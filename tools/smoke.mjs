// Smoke test: serve the site with vercel.json's headers, open each page in headless Chrome, fail on page errors.
// console.assert labels must start with 'self-check failed:' (headless Chrome logs only the label).
// Run: node tools/smoke.mjs   (CHROME=/path/to/chrome to override; screenshots land in tools/smoke-out/ to check by eye)
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {join, extname, resolve} from 'node:path';

const ROOT = resolve(import.meta.dirname, '..'), OUT = join(ROOT, 'tools', 'smoke-out');
const PAGES = ['index.html', 'index.html?view=hub', 'index.html?body=earth', 'index.html?body=saturn&step=1', 'index.html?body=mars&site=0&step=2',
  'sun-timeline.html', 'universe-timeline.html'];
const BAD = /Uncaught|self-check failed|needs WebGL|SyntaxError|Content Security Policy|Failed to load module/i;
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2'};
const chrome = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
if (!chrome) { console.error('Chrome not found; set CHROME'); process.exit(2); }

const vercel = JSON.parse(await readFile(join(ROOT, 'vercel.json'), 'utf8'));
const globalHeaders = vercel.headers.find(h => h.source === '/(.*)').headers;
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = join(ROOT, path === '/' ? 'index.html' : path);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, {'Content-Type': TYPES[extname(file)] || 'application/octet-stream', ...Object.fromEntries(globalHeaders.map(h => [h.key, h.value]))});
    res.end(body);
  } catch { res.writeHead(404).end(); }
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}/`;
await mkdir(OUT, {recursive: true});

const run = (page, i) => new Promise(done => {
  const shot = join(OUT, `${i}-${page.replace(/[^a-z0-9]+/gi, '_')}.png`);
  const p = spawn(chrome, ['--headless=new', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-logging=stderr', '--v=0',
    '--virtual-time-budget=10000', '--window-size=1280,800', `--screenshot=${shot}`, base + page]);
  let log = '';
  p.stderr.on('data', d => { log += d; });
  p.on('close', () => done({page, shot, errors: log.split('\n').filter(l => /CONSOLE|Uncaught|Content Security/.test(l) && BAD.test(l))}));
});

let failed = 0;
for (const [i, page] of PAGES.entries()) {
  const r = await run(page, i);
  if (!existsSync(r.shot)) r.errors.push('no screenshot written');
  console.log(`${r.errors.length ? 'FAIL' : 'ok  '} ${page}`);
  for (const e of r.errors) console.log('     ' + e.trim().slice(0, 300));
  failed += r.errors.length ? 1 : 0;
}
server.close();
console.log(failed ? `${failed} page(s) failed` : `all ${PAGES.length} pages ok · screenshots in tools/smoke-out/`);
process.exit(failed ? 1 : 0);
