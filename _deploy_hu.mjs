// Functional validation of the 8 user stories against production over HTTP.
const API = process.env.API || 'https://backend-production-d784.up.railway.app';
const results = [];
function ok(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);
}
async function req(method, path, { token, body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  return { status: res.status, data };
}

async function login(email, password) {
  const r = await req('POST', '/api/auth/login/', { body: { email, password } });
  return { status: r.status, token: r.data?.access, role: r.data?.user?.role };
}

const stamp = Date.now();
const u = await login('usuario@proteccioninmediata.test', 'Sendero#Calido2026');
const p = await login('profesional@proteccioninmediata.test', 'Brujula#Serena2026');
const a = await login('admin@proteccioninmediata.test', 'Faro#Seguro2026');

/* HU-01 registro e inicio de sesión */
ok('HU-01 login usuario/profesional/admin', u.status === 200 && p.status === 200 && a.status === 200,
  `${u.role}/${p.role}/${a.role}`);
ok('HU-01 credenciales inválidas -> 401', (await login('usuario@proteccioninmediata.test', 'mala')).status === 401);
const nuevoEmail = `qa${stamp}@test.dev`;
const reg = await req('POST', '/api/auth/register/', { body: { email: nuevoEmail, nombre_completo: 'QA Deploy', documento: `DOC-${stamp}`, password: 'ClaveDeploy#2026', password_confirm: 'ClaveDeploy#2026' } });
ok('HU-01 registro nuevo -> 201', reg.status === 201, `HTTP ${reg.status}`);
ok('HU-01 registro duplicado (email) -> 400', (await req('POST', '/api/auth/register/', { body: { email: nuevoEmail, nombre_completo: 'QA', documento: `DOC2-${stamp}`, password: 'ClaveDeploy#2026', password_confirm: 'ClaveDeploy#2026' } })).status === 400);

/* HU-02 perfil */
ok('HU-02 consulta perfil propio -> 200', (await req('GET', '/api/perfiles/mi-perfil/', { token: u.token })).status === 200);
ok('HU-02 teléfono inválido -> 400', (await req('PATCH', '/api/perfiles/mi-perfil/', { token: u.token, body: { telefono: '300ABC' } })).status === 400);
ok('HU-02 documento inmutable -> 400', (await req('PATCH', '/api/perfiles/mi-perfil/', { token: u.token, body: { documento: 'X-999' } })).status === 400);
ok('HU-02 fecha nacimiento <10 años -> 400', (await req('PATCH', '/api/perfiles/mi-perfil/', { token: u.token, body: { fecha_nacimiento: '2024-01-01' } })).status === 400);

/* HU-03 denuncia anónima + asignación automática */
const crear = await req('POST', '/api/denuncias/mis-denuncias/', { token: u.token, body: { modalidad: 'ANONIMA', tipo_situacion: 'ACOSO', descripcion: 'Denuncia de validación de despliegue suficientemente larga.' } });
ok('HU-03 crear denuncia anónima -> 201', crear.status === 201, `HTTP ${crear.status}`);
const den = crear.data?.denuncia;
ok('HU-03 asignación automática a profesional', !!den?.profesional_asignado?.id, `asignado=${den?.profesional_asignado?.nombre_completo ?? 'ninguno'}`);
ok('HU-03 fecha futura -> 400', (await req('POST', '/api/denuncias/mis-denuncias/', { token: u.token, body: { modalidad: 'PUBLICA', tipo_situacion: 'ACOSO', descripcion: 'Denuncia con fecha futura de prueba larga.', fecha_hechos: '2030-01-01' } })).status === 400);

/* HU-04 seguimiento propio */
const mias = await req('GET', '/api/denuncias/mis-denuncias/', { token: u.token });
ok('HU-04 lista denuncias propias -> 200', mias.status === 200, `count=${mias.data?.count}`);
ok('HU-04 detalle propio con seguimiento', (await req('GET', `/api/denuncias/mis-denuncias/${den?.id}/`, { token: u.token })).status === 200);
ok('HU-04 no accede a denuncia ajena por id -> 404', (await req('GET', '/api/denuncias/mis-denuncias/999999/', { token: u.token })).status === 404);

/* HU-05 gestión profesional */
const casosProf = await req('GET', '/api/denuncias/profesional/', { token: p.token });
ok('HU-05 profesional lista sus casos -> 200', casosProf.status === 200, `count=${casosProf.data?.count}`);
ok('HU-05 profesional ve la denuncia asignada', (await req('GET', `/api/denuncias/profesional/${den?.id}/`, { token: p.token })).status === 200);
ok('HU-05 caso inexistente -> 404', (await req('GET', '/api/denuncias/profesional/999999/', { token: p.token })).status === 404);
ok('HU-05 admin no accede al módulo profesional -> 403', (await req('GET', '/api/denuncias/profesional/', { token: a.token })).status === 403);

/* HU-06 chat */
const conv = await req('POST', '/api/chat/conversaciones/', { token: u.token, body: { denuncia: den?.id } });
ok('HU-06 dueño abre conversación', [200, 201].includes(conv.status), `HTTP ${conv.status}`);
const convId = conv.data?.id;
ok('HU-06 dueño envía mensaje -> 201', (await req('POST', `/api/chat/conversaciones/${convId}/mensajes/`, { token: u.token, body: { contenido: 'Mensaje de validación' } })).status === 201);
ok('HU-06 profesional asignado lee historial -> 200', (await req('GET', `/api/chat/conversaciones/${convId}/mensajes/`, { token: p.token })).status === 200);
ok('HU-06 administrador NO lee el chat -> 403', (await req('GET', `/api/chat/conversaciones/${convId}/`, { token: a.token })).status === 403);

/* HU-07 contenidos */
ok('HU-07 noticias -> 200', (await req('GET', '/api/noticias/')).status === 200);
ok('HU-07 podcasts -> 200', (await req('GET', '/api/podcasts/')).status === 200);
ok('HU-07 foro requiere auth -> 401', (await req('GET', '/api/foro/publicaciones/')).status === 401);
ok('HU-07 foro con auth -> 200', (await req('GET', '/api/foro/publicaciones/', { token: u.token })).status === 200);

/* HU-08 administración */
const usuariosAdmin = await req('GET', '/api/auth/usuarios/', { token: a.token });
const idsAdmin = (usuariosAdmin.data?.results ?? []).map((x) => x.email);
ok('HU-08 admin lista usuarios (sin sí mismo)', usuariosAdmin.status === 200 && !idsAdmin.includes('admin@proteccioninmediata.test'), `count=${usuariosAdmin.data?.count}`);
const adminMe = await req('GET', '/api/auth/me/', { token: a.token });
ok('HU-08 admin no se desactiva -> 400', (await req('PATCH', `/api/auth/usuarios/${adminMe.data.id}/`, { token: a.token, body: { is_active: false } })).status === 400);

/* WebSocket (chat en tiempo real) */
let wsOk = false, wsDetail = '';
try {
  const ws = new WebSocket(`${API.replace('https', 'wss')}/ws/chat/${convId}/?token=${u.token}`);
  wsOk = await new Promise((resolve) => {
    const t = setTimeout(() => resolve(false), 8000);
    ws.onopen = () => { clearTimeout(t); resolve(true); ws.close(); };
    ws.onerror = () => { clearTimeout(t); resolve(false); };
    ws.onclose = (e) => { if (e.code) { clearTimeout(t); resolve(false); } };
  });
} catch (e) { wsDetail = String(e).slice(0, 80); }
ok('HU-06 WebSocket autenticado conecta', wsOk, wsDetail);

const failed = results.filter((r) => !r.pass);
console.log(`\nRESUMEN: ${results.length - failed.length}/${results.length} OK`);
if (failed.length) console.log('FALLOS: ' + failed.map((f) => f.name).join(' | '));
