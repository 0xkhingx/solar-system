// Probe: which GL renderer does headless Chrome give us, and how many screencast frames per second does the app produce?
import {launch, sleep} from './cdp.mjs';
const flags = process.argv.slice(2);
const c = await launch({headless: !flags.includes('--headed'), extra: flags.filter(f => f !== '--headed')});
await c.send('Page.enable');
await c.send('Page.navigate', {url: 'http://127.0.0.1:8765/index.html?body=earth'});
await sleep(6000);
const gl = await c.evaluate(`(() => { const g = document.createElement('canvas').getContext('webgl'); const e = g && g.getExtension('WEBGL_debug_renderer_info'); return g ? (e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'webgl, renderer hidden') : 'NO WEBGL'; })()`);
let n = 0;
c.on('Page.screencastFrame', p => { n++; c.send('Page.screencastFrameAck', {sessionId: p.sessionId}); });
await c.send('Page.startScreencast', {format: 'jpeg', quality: 85, everyNthFrame: 1});
await sleep(3000);
await c.send('Page.stopScreencast');
console.log(JSON.stringify({flags, gl, screencastFps: (n / 3).toFixed(1)}));
c.close();
process.exit(0);
