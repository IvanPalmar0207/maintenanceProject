// Temporary overflow probe (not committed).
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FE = 'http://127.0.0.1:4200';
const API = 'http://127.0.0.1:8000/api';
const PERFIL = `${process.env.TEMP}/pi-probe-profile`;
const PUERTO = 9334;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function conectar() {
  for (let i = 0; i < 40; i++) {
    try {
      const data = await (await fetch(`http://127.0.0.1:${PUERTO}/json/version`)).json();
      if (data.webSocketDebuggerUrl) return data.webSocketDebuggerUrl;
    } catch {}
    await esperar(500);
  }
  throw new Error('sin depurador');
}

class Cdp {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pend = new Map();
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.pend.has(m.id)) { this.pend.get(m.id)(m); this.pend.delete(m.id); }
    });
  }
  enviar(method, params = {}, sessionId) {
    const id = ++this.id;
    const p = { id, method, params };
    if (sessionId) p.sessionId = sessionId;
    return new Promise((res) => { this.pend.set(id, res); this.ws.send(JSON.stringify(p)); });
  }
}

const ruta = process.argv[2] ?? '/usuario';
const ancho = Number(process.argv[3] ?? 360);

const login = await (await fetch(`${API}/auth/login/`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'usuario@proteccioninmediata.test', password: 'Sendero#Calido2026' }),
})).json();

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${PERFIL}`, `--remote-debugging-port=${PUERTO}`, 'about:blank'], { stdio: 'ignore' });
try {
  const ws = new WebSocket(await conectar());
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  const cdp = new Cdp(ws);
  const t = (await cdp.enviar('Target.createTarget', { url: 'about:blank' })).result.targetId;
  const s = (await cdp.enviar('Target.attachToTarget', { targetId: t, flatten: true })).result.sessionId;
  await cdp.enviar('Page.enable', {}, s);
  await cdp.enviar('Runtime.enable', {}, s);
  await cdp.enviar('Emulation.setDeviceMetricsOverride', { width: ancho, height: 800, deviceScaleFactor: 1, mobile: false }, s);
  await cdp.enviar('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('pi_access','${login.access}');localStorage.setItem('pi_refresh','${login.refresh}');` }, s);
  await cdp.enviar('Page.navigate', { url: `${FE}/noticias` }, s);
  await esperar(1800);
  await cdp.enviar('Page.navigate', { url: `${FE}${ruta}` }, s);
  await esperar(2400);

  const expr = `(() => {
    const vw = document.documentElement.clientWidth;
    const out = [];
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width > 0) {
        out.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 70), right: Math.round(r.right), width: Math.round(r.width) });
      }
    });
    const doc = document.documentElement;
    const anchos = [];
    document.querySelectorAll('*').forEach((el) => {
      if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
        anchos.push({ tag: el.tagName.toLowerCase(), cls: (el.className||'').toString().slice(0,60), sw: el.scrollWidth, cw: el.clientWidth });
      }
    });
    return JSON.stringify({ vw, docOverflow: doc.scrollWidth - doc.clientWidth, culpables: out.slice(0, 12), scrollables: anchos.slice(0, 12) });
  })()`;
  const r = await cdp.enviar('Runtime.evaluate', { expression: expr, returnByValue: true }, s);
  console.log(r.result.result.value);
  ws.close();
} finally {
  chrome.kill();
  await esperar(1200);
  try { rmSync(PERFIL, { recursive: true, force: true }); } catch {}
}
