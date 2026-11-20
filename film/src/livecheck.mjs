// Check a deployed Firstlight: page errors, CSP blocks, live-data calls, and the tap-anywhere card.
//   node livecheck.mjs https://solar-system-three-swart.vercel.app/
import {launch, sleep} from './cdp.mjs';
import {writeFileSync} from 'node:fs';
const base = process.argv[2] || 'https://solar-system-three-swart.vercel.app/';
const c = await launch({width: 1280, height: 720, port: 9444, extra: process.env.BLOCK ? [`--host-resolver-rules=MAP ${process.env.BLOCK} ~NOTFOUND`] : []});   // BLOCK=celestrak.org tests a fallback
const problems = [], calls = {};
await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Log.enable'); await c.send('Network.enable');
c.on('Runtime.exceptionThrown', p => problems.push('exception: ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text)));
c.on('Runtime.consoleAPICalled', p => { if (p.type === 'error' || p.type === 'warning') problems.push(p.type + ': ' + p.args.map(a => a.value ?? a.description).join(' ')); });
c.on('Log.entryAdded', p => { if (p.entry.level === 'error') problems.push('log: ' + p.entry.text + ' ' + (p.entry.url || '')); });
c.on('Network.responseReceived', p => { const h = new URL(p.response.url).host; if (/usgs|celestrak|wheretheiss|open-meteo/.test(h)) calls[h] = p.response.status; });
c.on('Network.loadingFailed', p => problems.push('failed: ' + p.errorText + (p.blockedReason ? ' (' + p.blockedReason + ')' : '')));
await c.send('Page.navigate', {url: base + '?body=earth'});
await sleep(9000);
const title = await c.evaluate('document.title');
// tap the middle of the globe, like a visitor would
for (const type of ['mousePressed', 'mouseReleased']) await c.send('Input.dispatchMouseEvent', {type, x: 640, y: 360, button: 'left', clickCount: 1});
await sleep(4000);
const card = await c.evaluate(`document.getElementById('place').innerText.replace(/\\n+/g, ' | ')`);
const {data} = await c.send('Page.captureScreenshot', {format: 'jpeg', quality: 85});
writeFileSync(process.env.SHOT || 'live.jpg', Buffer.from(data, 'base64'));
console.log(JSON.stringify({title, calls, card, problems}, null, 1));
c.close(); process.exit(problems.length ? 1 : 0);
