// 설치본 실행 시험: 앱을 띄워 달력 화면이 열리는지 확인하고 화면을 찍음 (GitHub Actions의 Windows에서 실행)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const exe = process.argv[2];
const child = spawn(exe, ['--remote-debugging-port=9333', '--no-sandbox'], { env: { ...process.env, DESKCAL_NO_UPDATES: '1' }, stdio: 'ignore' });
let exited = null; child.on('exit', (c) => { exited = c; });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pages = [];
for (let i = 0; i < 40; i++) {
  await sleep(1500);
  if (exited !== null) break;
  try { pages = await (await fetch('http://127.0.0.1:9333/json')).json(); } catch { continue; }
  if (pages.some((p) => /calendar\.html/.test(p.url))) { await sleep(6000); pages = await (await fetch('http://127.0.0.1:9333/json')).json(); break; }
}
console.log('exited:', exited, 'pages:', pages.map((p) => p.url.split('/').pop()).join(', '));
const shot = async (p, name) => {
  const ws = new WebSocket(p.webSocketDebuggerUrl); let id = 0; const wait = new Map();
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (wait.has(d.id)) { wait.get(d.id)(d.result); wait.delete(d.id); } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const info = await send('Runtime.evaluate', { expression: `JSON.stringify({ title: document.title, text: document.body.innerText.replace(/\\s+/g,' ').slice(0,200), ver: (window.deskcal && 1) || 0, ua: navigator.userAgent })`, returnByValue: true });
  console.log(name, info && info.result && info.result.value);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  if (r && r.data) fs.writeFileSync(`smoke-${name}.png`, Buffer.from(r.data, 'base64'));
  ws.close();
};
let ok = false;
for (const p of pages.filter((x) => x.type === 'page')) { const n = p.url.split('/').pop().split('.')[0]; try { await shot(p, n); if (n === 'calendar') ok = true; } catch (e) { console.log('shot fail', n, String(e)); } }
try { child.kill(); } catch {}
if (!ok) { console.error('SMOKE FAILED: calendar window did not open'); process.exit(1); }
console.log('SMOKE OK'); process.exit(0);
