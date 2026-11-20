// Firstlight product film: drive the real app on a virtual clock and capture every frame.
//   node film.mjs                 full capture → ../frames/00000.jpg …
//   node film.mjs --stills 60,470 only screenshot these frames (still steps every frame, so state is identical)
//   node film.mjs --from 500      (not supported: the app's state comes from playing every frame before it)
// Needs the app served at http://127.0.0.1:8765 (python3 -m http.server 8765 in the repo root).
import {launch} from './cdp.mjs';
import {mkdirSync, writeFileSync, readFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'frames'); mkdirSync(OUT, {recursive: true});
const FPS = 30, DT = 1000 / FPS, W = 1280, H = 720, DPR = 1.5, LAST = 1079;
const arg = process.argv.indexOf('--stills');
const STILLS = arg > 0 ? new Set(process.argv[arg + 1].split(',').map(Number)) : null;
const log = [];

/* ---------- virtual clock: the app's time only moves when we say so. It starts at 1 s, not 0: the app reads loadedAt = 0 as "not loaded" ---------- */
const CLOCK = `(() => {
  let now = 1000; const t0 = ${Date.now()}, RealDate = Date, q = []; let id = 0;
  performance.now = () => now;
  class D extends RealDate { constructor(...a) { a.length ? super(...a) : super(t0 + now); } static now() { return t0 + now; } }
  window.Date = D;
  window.requestAnimationFrame = cb => { q.push([++id, cb]); return id; };
  window.cancelAnimationFrame = k => { const i = q.findIndex(r => r[0] === k); if (i >= 0) q.splice(i, 1); };
  window.__advance = ms => { now += ms; for (const [, cb] of q.splice(0)) { try { cb(now); } catch (e) { console.error(e); } } };
})();`;

/* ---------- overlay drawn into the page: cursor, click ring, caption, end card ---------- */
const MARK = readFileSync(join(HERE, 'mark.svg'), 'utf8');
const OVERLAY = `(() => {
  const d = document.createElement('div'); d.id = '__film';
  d.innerHTML = \`<style>
    #__film{position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:Montserrat,system-ui,sans-serif;color:#fff}
    #__cur{position:absolute;left:0;top:0;width:24px;height:24px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.55))}
    #__ring{position:absolute;left:0;top:0;width:40px;height:40px;margin:-20px 0 0 -20px;border:2px solid #fff;border-radius:50%;opacity:0}
    #__cap{position:absolute;left:6%;bottom:13%;font-weight:600;font-size:26px;letter-spacing:-.005em;opacity:0;text-shadow:0 2px 18px rgba(0,0,0,.9),0 1px 3px rgba(0,0,0,.8)}
    #__cap i{display:inline-block;width:10px;height:10px;margin-right:14px;border-radius:50%;background:#e8283c;vertical-align:.15em;box-shadow:0 0 10px rgba(232,40,60,.8)}
    #__end{position:absolute;inset:0;display:grid;place-items:center;align-content:center;gap:26px;background:#05070c;opacity:0}
    #__end .lk{display:flex;align-items:center;gap:22px;font-weight:600;font-size:54px;letter-spacing:.16em}
    #__end svg{width:78px;height:78px}
    #__end p{font-weight:500;font-size:30px;letter-spacing:-.01em;color:rgba(255,255,255,.86)}#__end b{font-weight:800;color:#fff}
    #__black{position:absolute;inset:0;background:#000;opacity:0}
  </style>
  <div id="__cap"></div>
  <div id="__end"><div class="lk">${MARK.replace(/`/g, '')}FIRSTLIGHT</div><p>From the <b>first light</b> to here.</p></div>
  <svg id="__cur" viewBox="0 0 24 24"><path d="M3 2l7.5 19 2.6-7.9L21 10.5z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>
  <div id="__ring"></div><div id="__black"></div>\`;
  document.body.appendChild(d);
  window.__film = (s) => {
    const c = document.getElementById('__cur'), r = document.getElementById('__ring'), cap = document.getElementById('__cap');
    c.style.transform = 'translate(' + (s.x - 3) + 'px,' + (s.y - 2) + 'px)'; c.style.opacity = s.cursor;
    r.style.transform = 'translate(' + s.rx + 'px,' + s.ry + 'px) scale(' + s.rs + ')'; r.style.opacity = s.ro;
    if (cap.dataset.t !== s.cap) { cap.dataset.t = s.cap; cap.innerHTML = s.cap ? '<i></i>' + s.cap : ''; }
    cap.style.opacity = s.capo; cap.style.transform = 'translateY(' + (1 - s.capo) * 10 + 'px)';
    document.getElementById('__end').style.opacity = s.end; document.getElementById('__black').style.opacity = s.black;
  };
})();`;

/* ---------- helpers ---------- */
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const seg = (f, a, b) => clamp((f - a) / (b - a));
const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const mix = (a, b, k) => a + (b - a) * k;

const CAPTIONS = [   // [from, to, text]
  [12, 140, 'Scrub 13.8 billion years'], [176, 272, 'One star, eight worlds'], [292, 384, 'Pick a world'],
  [430, 524, 'Live: quakes, the ISS, real daylight'], [548, 672, '750 million years of Earth'],
  [700, 802, 'Tap anywhere for its time and weather'], [862, 944, 'Land on real photographs']];

const c = await launch({width: W, height: H});
const {send, evaluate} = c;
await send('Page.enable'); await send('Runtime.enable'); await send('Animation.enable');
await send('Emulation.setDeviceMetricsOverride', {width: W, height: H, deviceScaleFactor: DPR, mobile: false});
await send('Page.addScriptToEvaluateOnNewDocument', {source: CLOCK});
await send('Page.navigate', {url: 'http://127.0.0.1:8765/index.html'});
await new Promise(r => setTimeout(r, 2500));
await evaluate(`document.fonts.ready.then(() => 1)`);
await evaluate(OVERLAY);
// a stray click that leaves the page would silently ruin the rest of the take: stop instead
c.on('Page.frameNavigated', p => { if (!p.frame.parentId) { console.error(`page navigated to ${p.frame.url} at frame ${f}`); process.exit(3); } });
// let textures, quakes and the ISS arrive (network time is real) while the virtual clock stands still
for (let i = 0; i < 60; i++) { await evaluate('__advance(0)'); await new Promise(r => setTimeout(r, 100)); }

const rect = sel => evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height}; })()`);
const mode = () => evaluate('document.body.className');
// Earth on the hub: its label sits under the planet; the label's transform carries the planet's x, y + radius + 10
const earthHub = () => evaluate(`(() => { const l = [...document.querySelectorAll('.lab')].find(e => e.querySelector('b')?.textContent === 'Earth'); if (!l) return null;
  const m = l.style.transform.match(/translate\\(([-\\d.]+)px, ([-\\d.]+)px\\)/); return m ? {x: +m[1], y: +m[2] - 22} : null; })()`);

let x = W * .5, y = H * .78, down = false;
const mouse = async (type, extra = {}) => send('Input.dispatchMouseEvent', {type, x, y, button: 'left', buttons: down ? 1 : 0, clickCount: 1, pointerType: 'mouse', ...extra});
let ring = -99;
const click = async () => { down = true; await mouse('mousePressed'); down = false; await mouse('mouseReleased'); ring = f; log.push([f, 'click', Math.round(x), Math.round(y)]); };

// a glide from wherever the cursor is to a target (resolved when the glide starts, or every frame if follow)
let glide = null;
const glideTo = (target, frames, {follow = false} = {}) => { glide = {f0: f, f1: f + frames, x0: x, y0: y, target, follow, tx: null, ty: null}; };

/* ---------- the timeline: what happens on which frame ---------- */
let f = 0, tap = null, probe = 0, arrived = -1;
const PROBES = [[730, 300], [760, 370], [690, 250], [660, 340], [790, 280], [620, 410], [700, 420]].map(([a, b]) => ({x: a, y: b}));
async function direct() {
  // HOOK: grab the universe timeline and scrub to Today
  if (f === 0) { const r = await rect('#utrack'); x = r.x + r.w * .5; y = r.y + r.h + 70; glideTo({x: r.x + 4, y: r.y + 26}, 14); }
  if (f === 16) { down = true; await mouse('mousePressed'); const r = await rect('#utrack'); glideTo({x: r.x + r.w - 2, y: r.y + 26}, 118); }
  if (f === 136) { down = false; await mouse('mouseReleased'); }
  // REVEAL: press "Enter the solar system" if the app has not grown the system on its own yet
  if (f === 150) glideTo(async () => (await mode()).includes('uni') ? (r => r && r.w ? {x: r.x + r.w / 2, y: r.y + r.h / 2} : {x, y})(await rect('#enterSys')) : {x: W * .5, y: H * .6}, 22);
  if (f === 174 && (await mode()).includes('uni')) await click();
  // CHOICE: follow Earth on its orbit, then open it
  if (f === 286) glideTo(earthHub, 40, {follow: true});
  if (f >= 326 && f < 372) { const e = await earthHub(); if (e) { x = e.x; y = e.y; await mouse('mouseMoved'); } }   // keep the app's pointer on the moving planet
  if (f === 360) await click();
  if (f === 372 && (await mode()).includes('hub')) await click();       // one retry if the first click landed between frames
  if (f === 384 && (await mode()).includes('hub')) throw new Error('Earth did not open at frame 360/372');
  // PROOF: spin the live Earth
  if (f === 404) glideTo({x: W * .66, y: H * .54}, 26);
  // a leftward drag turns the globe east (yaw falls); long enough to beat the app's slow westward auto-spin,
  // so Africa and Europe face us in daylight by the tap
  if (f === 432) { down = true; await mouse('mousePressed'); glideTo({x: W * .34, y: H * .5}, 64); }
  if (f === 498) { down = false; await mouse('mouseReleased'); glideTo({x: W * .62, y: H * .66}, 26); }
  // DEPTH: Earth through time, back to the oldest era and home again
  if (f === 530) glideTo(async () => { const r = await rect('#era'); return {x: r.x + r.w - 7, y: r.y + r.h / 2}; }, 24);
  if (f === 556) { down = true; await mouse('mousePressed'); const r = await rect('#era'); glideTo({x: r.x + 6, y: r.y + r.h / 2}, 54); }
  if (f === 624) { const r = await rect('#era'); glideTo({x: r.x + r.w - 6, y: r.y + r.h / 2}, 34); }
  if (f === 664) { down = false; await mouse('mouseReleased'); }
  // TAP ANYWHERE: hover until the app names a country, then tap it
  if (f === 680) glideTo(PROBES[0], 16);
  if (!glide && arrived < 0) arrived = f;
  if (glide) arrived = -1;
  if (f > 696 && f <= 760 && !tap && !glide && f - arrived >= 4) {   // the app eases the country label in over ~4 frames
    const g = await evaluate(`(() => { const e = document.getElementById('geo'); return +getComputedStyle(e).opacity > .6 ? e.textContent : ''; })()`);
    if (g) { tap = f; await click(); log.push([f, 'tap', g]); }
    else if (++probe < PROBES.length) glideTo(PROBES[probe], 10);
    else { tap = f; await click(); }
  }
  if (f === 762 && !tap) { tap = f; await click(); }
  // ARRIVAL: Earth's sites → Everest → Go there
  if (f === 812) glideTo(async () => { const r = await rect('#place .go'); return r && r.w ? {x: r.x + r.w / 2, y: r.y + r.h / 2} : {x, y}; }, 22);
  if (f === 836) await click();
  if (f === 866) glideTo(async () => { const r = await rect('#card a'); return r && r.w ? {x: r.x + r.w / 2, y: r.y + r.h / 2} : {x, y}; }, 24);
  if (f === 896) await click();
  if (f === 906) glideTo({x: W * .9, y: H * .92}, 30);
}

const t0 = Date.now();
let ms = 0, rate = 1;
for (f = 0; f <= LAST; f++) {
  const tStep = Date.now();
  await direct();
  if (glide) {
    if (glide.tx === null || glide.follow) { const t = typeof glide.target === 'function' ? await glide.target() : glide.target; if (t) { glide.tx = t.x; glide.ty = t.y; } }
    const k = ease(seg(f, glide.f0, glide.f1));
    if (glide.tx !== null) { x = mix(glide.x0, glide.tx, k); y = mix(glide.y0, glide.ty, k); }
    if (f >= glide.f1) glide = null;
    await mouse('mouseMoved');
  }
  // overlay state for this frame
  const cap = CAPTIONS.find(([a, b]) => f >= a && f <= b);
  const capo = cap ? Math.min(seg(f, cap[0], cap[0] + 8), 1 - seg(f, cap[1] - 8, cap[1])) : 0;
  const rk = seg(f, ring, ring + 14);
  const end = seg(f, 990, 1010), black = seg(f, 1056, 1076);
  await evaluate(`__film(${JSON.stringify({x, y, cursor: 1 - seg(f, 984, 994), rx: x, ry: y, rs: .35 + rk * .9, ro: f >= ring && f <= ring + 14 ? (1 - rk) * .9 : 0,
    cap: cap ? cap[2] : '', capo, end, black})})`);
  await evaluate(`__advance(${DT})`);
  if (!STILLS || STILLS.has(f)) {
    const {data} = await send('Page.captureScreenshot', {format: 'jpeg', quality: 92});
    writeFileSync(join(OUT, String(f).padStart(5, '0') + '.jpg'), Buffer.from(data, 'base64'));
  }
  // CSS transitions run on real time; slow them to match how long a frame really takes to capture
  ms = mix(ms || Date.now() - tStep, Date.now() - tStep, .1);
  if (f % 15 === 0) { const r = clamp(DT / ms, .05, 1); if (Math.abs(r - rate) > .02) { rate = r; await send('Animation.setPlaybackRate', {playbackRate: rate}); } }
  if (f % 60 === 0) console.log(`frame ${f} · ${(await mode()).trim()} · ${Math.round(ms)} ms/frame · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
writeFileSync(join(HERE, '..', 'reviews', 'capture-log.json'), JSON.stringify(log));
console.log('done', log);
c.close();
process.exit(0);
