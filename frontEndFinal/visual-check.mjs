// Temporary visual validation script (not committed).
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const FE = 'http://127.0.0.1:4200';
const API = 'http://127.0.0.1:8000/api';
const OUT = '../odd/evidencias/fase7';

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

async function esperar(url, etiqueta) {
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(url);
      if (r.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`No respondió: ${etiqueta}`);
}

async function login(email, password) {
  const r = await fetch(`${API}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(`Login falló para ${email}: ${r.status}`);
  return r.json();
}

async function primeraNoticiaId() {
  const r = await fetch(`${API}/noticias/`);
  const data = await r.json();
  return data.results?.[0]?.id ?? null;
}

function rutasPorRol(rol, noticiaId) {
  const comun = ['/noticias', `/noticias/${noticiaId}`, '/podcasts', '/foro'];
  if (rol === 'USUARIO') {
    return ['/', ...comun, '/usuario', '/usuario/denuncias', '/usuario/denuncias/nueva', '/usuario/perfil', '/chat'];
  }
  if (rol === 'PROFESIONAL') {
    return ['/profesional', '/profesional/denuncias', '/chat', '/noticias', '/podcasts'];
  }
  return ['/admin', '/admin/usuarios', '/admin/noticias', '/admin/podcasts', '/admin/foro'];
}

const problemas = [];
const resumen = { paginas: 0, overflow: [], erroresConsola: [], capturas: 0 };

async function revisar(page, rol, ruta, viewport) {
  const url = `${FE}${ruta}`;
  const errores = [];
  const onConsole = (m) => m.type() === 'error' && errores.push(m.text());
  const onPageError = (e) => errores.push(String(e));
  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  await page.goto(url, { waitUntil: 'load' }).catch(() => {});
  await page.waitForTimeout(1400);

  const desborde = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });

  resumen.paginas += 1;
  if (desborde > 2) {
    resumen.overflow.push({ rol, ruta, viewport: viewport.name, px: desborde });
  }
  if (errores.length) {
    resumen.erroresConsola.push({ rol, ruta, viewport: viewport.name, errores: errores.slice(0, 3) });
  }

  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  return desborde;
}

async function capturar(page, nombre) {
  const archivo = `${OUT}/${nombre}.png`;
  await page.screenshot({ path: archivo, fullPage: false });
  resumen.capturas += 1;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  await esperar(`${API}/noticias/`, 'API');
  await esperar(FE, 'frontend');
  const noticiaId = await primeraNoticiaId();

  const navegador = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    for (const [rol, [email, password]] of Object.entries(CUENTAS)) {
      const sesion = await login(email, password);
      for (const viewport of VIEWPORTS) {
        const contexto = await navegador.newContext({
          viewport: { width: viewport.width, height: viewport.height },
        });
        await contexto.addInitScript(
          ([access, refresh]) => {
            localStorage.setItem('pi_access', access);
            localStorage.setItem('pi_refresh', refresh);
          },
          [sesion.access, sesion.refresh],
        );
        const page = await contexto.newPage();
        for (const ruta of rutasPorRol(rol, noticiaId)) {
          await revisar(page, rol, ruta, viewport);
          // Screenshots at desktop and mobile only, to keep the set readable.
          if (viewport.name === '1440x900' || viewport.name === '390x844') {
            const limpia = ruta.replace(/\//g, '_') || '_raiz';
            await capturar(page, `${rol}${limpia}__${viewport.name}`);
          }
        }
        await contexto.close();
      }
      // The landing is checked at every resolution (overflow) with the public view.
      if (rol === 'USUARIO') {
        const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
        const page = await contexto.newPage();
        await page.goto(FE, { waitUntil: 'load' });
        await page.waitForTimeout(1600);
        await capturar(page, 'PUBLICO_landing__1440x900');
        await contexto.close();
      }
    }
  } finally {
    await navegador.close();
  }

  console.log(JSON.stringify(resumen, null, 2));
}

main().catch((error) => {
  console.error('FALLO:', error.message);
  process.exit(1);
});
