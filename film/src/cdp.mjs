// Minimal Chrome DevTools Protocol driver: launch Chrome, open a page, send commands, receive events.
// No dependencies (Node 22+ has a global WebSocket).
import {spawn} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

export const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

export async function launch({width = 1280, height = 720, port = 9333, headless = true, extra = []} = {}) {
  const profile = mkdtempSync(join(tmpdir(), 'fl-film-'));
  const args = [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${width},${height}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--autoplay-policy=no-user-gesture-required', ...(headless ? ['--headless=new'] : []), ...extra, 'about:blank'];
  const proc = spawn(CHROME, args, {stdio: 'ignore'});
  let list;
  for (let i = 0; i < 100; i++) {
    try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (list.length) break; } catch {}
    await new Promise(r => setTimeout(r, 150));
  }
  const target = list.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map(), listeners = new Map();
  ws.onmessage = ({data}) => {
    const m = JSON.parse(data);
    if (m.id && pending.has(m.id)) { const {res, rej} = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
    else if (m.method) for (const fn of listeners.get(m.method) || []) fn(m.params);
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, {res, rej}); ws.send(JSON.stringify({id: i, method, params})); });
  const on = (method, fn) => { if (!listeners.has(method)) listeners.set(method, []); listeners.get(method).push(fn); };
  const evaluate = async expr => { const r = await send('Runtime.evaluate', {expression: expr, awaitPromise: true, returnByValue: true}); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
  const close = () => { try { ws.close(); } catch {} proc.kill(); };
  return {send, on, evaluate, close, proc};
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
