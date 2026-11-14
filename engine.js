// Shared engine for the solar-system explorer: maths, planet shader, atmosphere, rings, clouds, map loading.
import * as THREE from 'three';

/* ---------- maths ---------- */
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const mix = (a, b, k) => a + (b - a) * k;
export const seg = (p, a, b) => clamp((p - a) / (b - a));
export const io = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
export const out = k => 1 - Math.pow(1 - k, 3);

// map position u,v (0..1 from top-left) -> direction in mesh space (matches SphereGeometry uv)
export const dirUV = (u, v) => {
  const ph = 2 * Math.PI * u, th = Math.PI * v;
  return new THREE.Vector3(-Math.cos(ph) * Math.sin(th), Math.cos(th), Math.sin(ph) * Math.sin(th));
};
// standard equirectangular map, prime meridian in the centre
export const uvLL = (lat, lon) => ({u: (lon + 180) / 360, v: (90 - lat) / 180});
export const dirLL = (lat, lon) => { const {u, v} = uvLL(lat, lon); return dirUV(u, v); };
export const faceYaw = d => Math.atan2(-d.x, d.z);
export const faceLat = d => Math.asin(d.y);
export const XA = new THREE.Vector3(1, 0, 0), YA = new THREE.Vector3(0, 1, 0);
export const SUN = new THREE.Vector3(.62, .5, .6).normalize();

const v3 = a => new THREE.Vector3(a[0], a[1], a[2]);

/* ---------- planet surface ---------- */
export const PLANET_VS = `
  varying vec2 vUv; varying vec3 vObj; varying vec3 vN;
  void main(){ vUv = uv; vObj = normalize(position); vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
export const PLANET_FS = `
    uniform sampler2D map, night, ringMap; uniform vec2 texel, ringR; uniform vec3 sun, hiDir, tint, hiCol, rimCol, ringN;
    uniform float hi, hiR, ready, relief, gamma, hasNight;
    varying vec2 vUv; varying vec3 vObj; varying vec3 vN;
    float luma(vec2 u){ return dot(texture2D(map, u).rgb, vec3(.3,.6,.1)); }
    void main(){
      vec3 col = texture2D(map, vUv).rgb; col = pow(col, vec3(gamma)) * tint;
      // relief from the map's own brightness (relief = 0 for gas giants)
      vec3 n = normalize(vN);
      vec3 t = normalize(cross(vec3(0.,1.,0.), n)), b = cross(n, t);
      float dx = luma(vUv + vec2(texel.x*2.,0.)) - luma(vUv - vec2(texel.x*2.,0.));
      float dy = luma(vUv + vec2(0.,texel.y*2.)) - luma(vUv - vec2(0.,texel.y*2.));
      n = normalize(n - (t*dx + b*dy) * relief);
      float diff = max(dot(n, sun), 0.);
      // the rings' shadow on the body: march from the surface point toward the sun and see if the ring plane is crossed
      float rs = 1.;
      if (ringR.y > 0.) {
        vec3 P = normalize(vN); float dn = dot(sun, ringN);
        if (abs(dn) > 1e-4) { float tt = -dot(P, ringN) / dn;
          if (tt > 0.) { float rd = length(P + tt * sun);
            if (rd > ringR.x && rd < ringR.y) rs = 1. - texture2D(ringMap, vec2((rd - ringR.x) / (ringR.y - ringR.x), .5)).a * .85; } }
      }
      vec3 lit = col * (vec3(1.5,1.32,1.18) * pow(diff, .85) * rs + vec3(.2,.09,.06));
      // city lights on the night side
      lit += texture2D(night, vUv).rgb * vec3(1.,.82,.55) * (1. - smoothstep(0., .12, diff)) * hasNight * 1.3;
      // highlighted region with a rough edge, like a territory on a map
      float d = acos(clamp(dot(normalize(vObj), hiDir), -1., 1.)) + (luma(vUv) - .45) * .22;
      float m = smoothstep(hiR, hiR - .03, d), edge = smoothstep(.03, .0, abs(d - hiR + .01));
      lit = mix(lit, mix(lit, hiCol * (.25 + diff * 1.05) * (.5 + luma(vUv) * 1.1), .9), m * hi) + (hiCol * .5 + vec3(.5)) * edge * hi * .22;
      float fres = pow(1. - max(vN.z, 0.), 3.2);
      lit += rimCol * fres * (.05 + diff * .5);
      lit = lit / (lit * .3 + 1.) * 1.3;
      gl_FragColor = vec4(pow(lit, vec3(1./2.2)), 1.) * ready;
    }`;

export function planetMaterial(body) {
  const s = body.shader;
  return new THREE.ShaderMaterial({
    uniforms: {
      map: {value: null}, ready: {value: 0}, texel: {value: new THREE.Vector2(1 / 2048, 1 / 1024)},
      sun: {value: SUN.clone()}, hiDir: {value: new THREE.Vector3(0, 0, 1)}, hi: {value: 0}, hiR: {value: .62},
      tint: {value: v3(s.tint)}, gamma: {value: s.gamma}, relief: {value: s.relief},
      hiCol: {value: v3(s.hiCol)}, rimCol: {value: v3(s.rim)},
      night: {value: null}, hasNight: {value: 0},
      ringMap: {value: null}, ringR: {value: new THREE.Vector2(0, 0)}, ringN: {value: new THREE.Vector3(0, 1, 0)}
    },
    vertexShader: PLANET_VS, fragmentShader: PLANET_FS
  });
}

/* ---------- atmosphere ---------- */
export function atmosphere(body, readyUniform) {
  const a = body.shader.atmo;
  if (!a || a.strength <= 0) return null;
  const mat = new THREE.ShaderMaterial({
    uniforms: {sun: {value: SUN.clone()}, ready: readyUniform, color: {value: v3(a.color)}, strength: {value: a.strength}},
    side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    vertexShader: `varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform vec3 sun, color; uniform float ready, strength; varying vec3 vN;
    void main(){ float z = clamp(-vN.z, 0., 1.), a = smoothstep(.0, .55, z);
      float s = .55 + .6 * max(dot(-vN * vec3(1.,1.,0.), normalize(sun * vec3(1.,1.,0.))), 0.);
      a = pow(a, 2.6) * s * .7; gl_FragColor = vec4(color, a * ready * strength); }`
  });
  return new THREE.Mesh(new THREE.SphereGeometry(a.radius || 1.14, 64, 48), mat);
}

/* ---------- cloud layer (Earth) ---------- */
export function cloudLayer(tex, readyUniform) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {map: {value: tex}, sun: {value: SUN.clone()}, ready: readyUniform},
    transparent: true, depthWrite: false,
    vertexShader: `varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D map; uniform vec3 sun; uniform float ready; varying vec2 vUv; varying vec3 vN;
    void main(){ float c = texture2D(map, vUv).r; float diff = max(dot(normalize(vN), sun), 0.);
      gl_FragColor = vec4(vec3(.55 + .55 * pow(diff, .8)), c * c * ready * .95); }`
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1.012, 96, 72), mat);
  m.renderOrder = 1;
  return m;
}

/* ---------- rings (Saturn) ---------- */
export function ringMesh(body, tex, readyUniform) {
  const r = body.rings;
  const g = new THREE.RingGeometry(r.inner, r.outer, 160, 1);
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const d = Math.hypot(pos.getX(i), pos.getY(i));
    uv.setXY(i, (d - r.inner) / (r.outer - r.inner), .5);
  }
  const mat = new THREE.ShaderMaterial({
    uniforms: {map: {value: tex}, sun: {value: SUN.clone()}, ready: readyUniform, center: {value: new THREE.Vector3()}, R: {value: 1}},
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; varying vec3 vW; varying vec3 vN;
      void main(){ vUv = uv; vW = (modelMatrix * vec4(position,1.)).xyz; vN = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D map; uniform vec3 sun, center; uniform float R, ready; varying vec2 vUv; varying vec3 vW; varying vec3 vN;
      void main(){ vec4 t = texture2D(map, vec2(vUv.x, .5));
        vec3 p = (vW - center) / R; float ps = dot(p, sun); vec3 q = p - ps * sun;
        float sh = (ps < 0. && length(q) < 1.) ? .12 : 1.;           // the planet's shadow across the rings
        float lit = .55 + .45 * abs(dot(normalize(vN), sun));
        gl_FragColor = vec4(t.rgb * lit * sh, t.a * ready); }`
  });
  const m = new THREE.Mesh(g, mat);
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 2;
  return m;
}

/* ---------- textures ---------- */
export function canvasTexture(renderer, canvas, repeatX = true) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  if (repeatX) tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.needsUpdate = true;
  return tex;
}

const loadImage = src => new Promise((res, rej) => {
  const img = new Image(); img.crossOrigin = 'anonymous';
  img.onload = () => res(img); img.onerror = () => rej(new Error('missing ' + src)); img.src = src;
});

// Draw the map into a canvas, optionally blending the left edge over the right (for generated, non-seamless maps),
// and always pinching the poles so the top and bottom rows converge cleanly.
function prepareMap(img, seamFix) {
  const CW = Math.min(img.naturalWidth, 4096), CH = Math.round(CW / 2);
  const c = document.createElement('canvas'); c.width = CW; c.height = CH;
  const x = c.getContext('2d', {willReadFrequently: true});
  x.drawImage(img, 0, 0, CW, CH);
  if (seamFix) {
    const fw = Math.round(CW * .07);
    const tc = document.createElement('canvas'); tc.width = fw; tc.height = CH;
    const tx = tc.getContext('2d');
    tx.drawImage(img, 0, 0, img.naturalWidth * .07, img.naturalHeight, 0, 0, fw, CH);
    tx.globalCompositeOperation = 'destination-in';
    const g = tx.createLinearGradient(0, 0, fw, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    tx.fillStyle = g; tx.fillRect(0, 0, fw, CH);
    x.drawImage(tc, CW - fw, 0);
  }
  // average colour of the top and bottom rows, used to pinch the poles
  const pole = row => {
    const d = x.getImageData(0, row, CW, 1).data; let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const n = d.length / 4; return `rgb(${r / n | 0},${g / n | 0},${b / n | 0})`;
  };
  const ph = CH * .035, pt = pole(2), pb = pole(CH - 3);
  const gt = x.createLinearGradient(0, 0, 0, ph);
  gt.addColorStop(0, pt); gt.addColorStop(1, pt.replace('rgb', 'rgba').replace(')', ',0)'));
  x.fillStyle = gt; x.fillRect(0, 0, CW, ph);
  const gb = x.createLinearGradient(0, CH - ph, 0, CH);
  gb.addColorStop(0, pb.replace('rgb', 'rgba').replace(')', ',0)')); gb.addColorStop(1, pb);
  x.fillStyle = gb; x.fillRect(0, CH - ph, CW, ph);
  return c;
}

/* ---------- procedural stand-in map (used until the real texture is dropped into maps/) ---------- */
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function hash3(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function noise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  let fx = x - ix, fy = y - iy, fz = z - iz;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const l = (a, b, t) => a + (b - a) * t;
  return l(
    l(l(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), fx), l(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), fx), fy),
    l(l(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), fx), l(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), fx), fy), fz);
}
function fbm3(x, y, z, oct = 4) {
  let a = .5, s = 0;
  for (let i = 0; i < oct; i++) { s += a * noise3(x, y, z); x = x * 2.03 + 1.7; y = y * 2.03 + 9.2; z = z * 2.03 + 3.1; a *= .5; }
  return s;
}
// Fills an RGBA buffer with the stand-in surface. Self-contained so it can run inside a worker.
function fillPlaceholder(d, p, W, H) {
  const pal = p.pal.map(hex), sc = p.scale || 2.2;
  for (let j = 0; j < H; j++) {
    const v = j / H, th = Math.PI * v, lat = 90 - v * 180;
    for (let i = 0; i < W; i++) {
      const u = i / W, ph = 2 * Math.PI * u;
      const dx = -Math.cos(ph) * Math.sin(th), dy = Math.cos(th), dz = Math.sin(ph) * Math.sin(th);
      let n;
      if (p.bands) {
        const w = fbm3(dx * 1.6, dy * 1.6, dz * 1.6, 3) - .5;
        n = .5 + .5 * Math.sin(lat * .22 + w * 3.4) * .7 + (fbm3(dx * 5, dy * 5, dz * 5, 3) - .5) * .5;
      } else {
        n = fbm3(dx * sc, dy * sc, dz * sc, 5);
        n = (n - .3) * 2.2;
      }
      n = Math.max(0, Math.min(1, n));
      const k = n * (pal.length - 1), a = Math.floor(k), t = k - a, b = Math.min(pal.length - 1, a + 1);
      const o = (j * W + i) * 4;
      d[o] = pal[a][0] + (pal[b][0] - pal[a][0]) * t;
      d[o + 1] = pal[a][1] + (pal[b][1] - pal[a][1]) * t;
      d[o + 2] = pal[a][2] + (pal[b][2] - pal[a][2]) * t;
      d[o + 3] = 255;
    }
  }
}
export function placeholderMap(body, W = 1024) {
  const H = W / 2;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), id = x.createImageData(W, H);
  fillPlaceholder(id.data, body.proc, W, H);
  x.putImageData(id, 0, 0);
  return c;
}
// Same thing off the main thread. Falls back to the synchronous version where workers are unavailable.
let phWorker = null, phId = 0; const phJobs = new Map();
function worker() {
  if (phWorker) return phWorker;
  const src = `const hex = ${hex.toString()};\n${hash3.toString()}\n${noise3.toString()}\n${fbm3.toString()}\n${fillPlaceholder.toString()}\n` +
    `onmessage = e => { const {id, p, W, H} = e.data; const d = new Uint8ClampedArray(W * H * 4); fillPlaceholder(d, p, W, H); postMessage({id, d}, [d.buffer]); };`;
  phWorker = new Worker(URL.createObjectURL(new Blob([src], {type: 'text/javascript'})));
  phWorker.onmessage = e => { const j = phJobs.get(e.data.id); if (j) { phJobs.delete(e.data.id); j(e.data.d); } };
  return phWorker;
}
export function placeholderMapAsync(body, W = 1024) {
  const H = W / 2;
  if (typeof Worker === 'undefined') return Promise.resolve(placeholderMap(body, W));
  return new Promise(res => {
    const id = ++phId;
    phJobs.set(id, d => {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      c.getContext('2d').putImageData(new ImageData(d, W, H), 0, 0);
      res(c);
    });
    worker().postMessage({id, p: body.proc, W, H});
  });
}
export function placeholderRing(body) {
  const W = 1024, c = document.createElement('canvas'); c.width = W; c.height = 4;
  const x = c.getContext('2d'), id = x.createImageData(W, 4), d = id.data;
  const [r, g, b] = hex(body.rings.color || '#d8c4a0');
  for (let i = 0; i < W; i++) {
    const u = i / W;
    let a = .55 + .45 * Math.sin(u * 90 + Math.sin(u * 23) * 3);
    a *= 1 - Math.exp(-((u - .58) ** 2) / .00025) * .9;           // Cassini-like gap
    a *= Math.min(1, u * 6) * Math.min(1, (1 - u) * 5) * (.55 + .45 * (1 - u));
    for (let j = 0; j < 4; j++) { const o = (j * W + i) * 4; d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = a * 255; }
  }
  x.putImageData(id, 0, 0);
  return c;
}

/* ---------- loaders ---------- */
// Resolves to {texture, w, h, placeholder, url}. Tries body.map, then body.fallbackMap, else a procedural stand-in.
export async function loadMap(body, renderer, placeholderSize = 1024) {
  const tries = [body.map, ...[].concat(body.fallbackMap || [])].filter(Boolean);
  for (const src of tries) {
    try {
      const img = await loadImage(src);
      const c = prepareMap(img, !!body.seamFix);
      return {texture: canvasTexture(renderer, c), w: c.width, h: c.height, placeholder: false, url: src};
    } catch (e) { /* try the next source */ }
  }
  const c = await placeholderMapAsync(body, placeholderSize);
  return {texture: canvasTexture(renderer, c), w: c.width, h: c.height, placeholder: true, url: c.toDataURL('image/jpeg', .85)};
}
const imgCanvas = img => { const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0); return c; };
// One source or a list of sources tried in order; null when none loads.
export async function loadOptional(src, renderer, repeatX = true) {
  for (const s of [].concat(src || [])) {
    try { const img = await loadImage(s); return canvasTexture(renderer, imgCanvas(img), repeatX); } catch (e) { /* next */ }
  }
  return null;
}
// Saturn's ring strip: a single RGBA file, else a colour strip + alpha strip merged, else a procedural band pattern.
export async function loadRing(body, renderer) {
  const one = await loadOptional(body.ringMap, renderer, false);
  if (one) return one;
  for (const fb of [].concat(body.fallbackRing || [])) {
    try {
      const [ci, ai] = await Promise.all([loadImage(fb.color), loadImage(fb.alpha)]);
      const W = 1024, c = document.createElement('canvas'); c.width = W; c.height = 4;
      const x = c.getContext('2d');
      x.drawImage(ci, 0, 0, W, 4);
      const col = x.getImageData(0, 0, W, 4);
      x.clearRect(0, 0, W, 4); x.drawImage(ai, 0, 0, W, 4);
      const al = x.getImageData(0, 0, W, 4);
      for (let i = 0; i < col.data.length; i += 4) col.data[i + 3] = al.data[i];
      x.putImageData(col, 0, 0);
      return canvasTexture(renderer, c, false);
    } catch (e) { /* next pair */ }
  }
  return canvasTexture(renderer, placeholderRing(body), false);
}
