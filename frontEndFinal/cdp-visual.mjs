// Temporary CDP-based visual validation (not committed).
// Uses Chrome headless with a dedicated profile and Node's built-in WebSocket.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FE = 'http://127.0.0.1:4200';
const API = 'http://127.0.0.1:8000/api';
const OUT = '../odd/evidencias/fase7';
const PERFIL = `${process.env.TEMP}/pi-visual-profile`;
const PUERTO = 9333;

const VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844', width: 390, height: 844 },
  { name: '360x800', width: 360, height: 800 },
];

const CUENTAS = {
  USUARIO: ['usuario@proteccioninmediata.test', 'Sendero#Calido2026'],
  PROFESIONAL: ['profesional@proteccioninmediata.test', 'Brujula#Serena2026'],
  ADMINISTRADOR: ['admin@proteccioninmediata.test', 'Faro#Seguro2026'],
};

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function esperarHttp(url) {
  for (let i = 0; i < 90; i++) {
    try {
      const r = await fetch(url);
      if (r.status < 500) return;
    } catch {}
    await esperar(1000);
  }
  throw new Error(`No respondió ${url}`);
}

async function login(email, password) {
  const r = await fetch(`${API}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(`Login ${email}: ${r.status}`);
  return r.json();
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pendientes = new Map();
    this.errores = [];
    ws.addEventListener('message', (evento) => {
      const msg = JSON.parse(evento.data);
      if (msg.id && this.pendientes.has(msg.id)) {
        this.pendientes.get(msg.id)(msg);
        this.pendientes.delete(msg.id);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        this.errores.push(msg.params?.exceptionDetails?.exception?.description ?? 'exception');
      } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params?.type === 'error') {
        this.errores.push((msg.params.args ?? []).map((a) => a.value ?? a.description).join(' '));
      }
    });
  }

  enviar(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve) => {
      this.pendientes.set(id, resolve);
      this.ws.send(JSON.stringify(payload));
    });
  }
}

async function conectar() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PUERTO}/json/version`);
      const data = await r.json();
      if (data.webSocketDebuggerUrl) return data.webSocketDebuggerUrl;
    } catch {}
    await esperar(500);
  }
  throw new Error('Chrome no expuso el depurador');
}

function rutasPorRol(rol, noticiaId) {
  const contenido = ['/noticias', `/noticias/${noticiaId}`, '/podcasts', '/foro'];
  if (rol === 'USUARIO') {
    return ['/', ...contenido, '/usuario', '/usuario/denuncias', '/usuario/denuncias/nueva', '/usuario/perfil', '/chat'];
  }
  if (rol === 'PROFESIONAL') {
    return ['/profesional', '/profesional/denuncias', '/chat', '/noticias', '/podcasts'];
  }
  return ['/admin', '/admin/usuarios', '/admin/noticias', '/admin/podcasts', '/admin/foro'];
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  await esperarHttp(`${API}/noticias/`);
  await esperarHttp(FE);
  const noticiaId = (await (await fetch(`${API}/noticias/`)).json()).results?.[0]?.id ?? null;

  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    `--user-data-dir=${PERFIL}`,
    `--remote-debugging-port=${PUERTO}`,
    'about:blank',
  ], { stdio: 'ignore' });

  const resumen = { paginas: 0, capturas: 0, overflow: [], errores: [] };

  try {
    const wsUrl = await conectar();
    const ws = new WebSocket(wsUrl);
    await new Promise((r) => ws.addEventListener('open', r, { once: true }));
    const cdp = new Cdp(ws);

    for (const [rol, [email, password]] of Object.entries(CUENTAS)) {
      const sesion = await login(email, password);
      for (const vp of VIEWPORTS) {
        const { result } = await cdp.enviar('Target.createTarget', { url: 'about:blank' });
        const targetId = result.targetId;
        const attach = await cdp.enviar('Target.attachToTarget', { targetId, flatten: true });
        const s = attach.result.sessionId;

        await cdp.enviar('Page.enable', {}, s);
        await cdp.enviar('Runtime.enable', {}, s);
        await cdp.enviar(
          'Emulation.setDeviceMetricsOverride',
          { width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: false },
          s,
        );
        await cdp.enviar(
          'Page.addScriptToEvaluateOnNewDocument',
          {
            source: `localStorage.setItem('pi_access', ${JSON.stringify(sesion.access)});localStorage.setItem('pi_refresh', ${JSON.stringify(sesion.refresh)});`,
          },
          s,
        );

        for (const ruta of rutasPorRol(rol, noticiaId)) {
          cdp.errores = [];
          await cdp.enviar('Page.navigate', { url: `${FE}${ruta}` }, s);
          await esperar(2400);

          const medir = await cdp.enviar(
            'Runtime.evaluate',
            {
              expression:
                'document.documentElement.scrollWidth - document.documentElement.clientWidth',
              returnByValue: true,
            },
            s,
          );
          const desborde = medir.result?.result?.value ?? 0;
          resumen.paginas += 1;
          if (desborde > 2) {
            const detalle = await cdp.enviar('Runtime.evaluate', {
              expression: `(() => {
                const vw = document.documentElement.clientWidth;
                const out = [];
                document.querySelectorAll('*').forEach((el) => {
                  const r = el.getBoundingClientRect();
                  if (r.right > vw + 1 && r.width > 0) out.push((el.tagName.toLowerCase()) + '.' + String(el.className).slice(0,50) + '=' + Math.round(r.width));
                });
                return out.slice(0, 6).join(' | ');
              })()`,
              returnByValue: true,
            }, s);
            resumen.overflow.push({ rol, ruta, viewport: vp.name, px: desborde, culpables: detalle.result?.result?.value });
          }
          if (cdp.errores.length) {
            resumen.errores.push({ rol, ruta, viewport: vp.name, detalle: cdp.errores.slice(0, 2) });
          }

          if (vp.name === '1440x900' || vp.name === '390x844') {
            const captura = await cdp.enviar(
              'Page.captureScreenshot',
              { format: 'png' },
              s,
            );
            if (captura.result?.data) {
              const limpia = ruta.replace(/\//g, '_') || '_raiz';
              writeFileSync(`${OUT}/${rol}${limpia}__${vp.name}.png`, Buffer.from(captura.result.data, 'base64'));
              resumen.capturas += 1;
            }
          }
        }
        console.error(`ok ${rol} ${vp.name}`);
        await cdp.enviar('Target.closeTarget', { targetId });
      }
    }
    ws.close();
  } finally {
    chrome.kill();
    await esperar(2400);
    try {
      rmSync(PERFIL, { recursive: true, force: true });
    } catch {
      // Best effort: Chrome may still hold a lock on the profile.
    }
  }

  console.log(JSON.stringify(resumen, null, 2));
}

main().catch((error) => {
  console.error('FALLO:', error.message);
  process.exit(1);
});
