# Protección Inmediata SC — MVP Full Stack (Angular + Django DRF)

Feature: `proteccion-inmediata-mvp`
Repos: `backend/` (Django) y `frontEnd/` (Angular), repos git independientes con remoto `origin`.
Objetivo: MVP funcional (no maqueta) con frontend, backend, persistencia, JWT, roles, CRUD y chat en tiempo real.

## Specs

S1. **Arquitectura backend**: Python + Django + Django REST Framework, separada por aplicaciones funcionales independientes: `usuarios`, `perfiles`, `denuncias`, `chat`, `noticias`, `podcasts`, `foro`, `notificaciones`, `core`. Cada app con sus propios modelos, serializers, views, urls, permisos y pruebas. "No construir un único archivo de vistas o modelos que concentre toda la lógica del sistema."

S2. **Arquitectura frontend**: Angular + TypeScript. Cada componente con su propia estructura de archivos:
```
componente/
- componente.component.ts
- componente.component.html
- componente.component.scss
```
"No colocar toda la lógica, los estilos y la estructura visual en un único archivo." Servicios HTTP centralizados, guards, interceptors (JWT y errores), formularios reactivos con validaciones, gestión centralizada de sesión/roles, responsive, componentes reutilizables.

S3. **Base de datos**: PostgreSQL como motor previsto para producción; SQLite permitido para ejecución local. Modelos relacionales, llaves foráneas, restricciones y migraciones.

S4. **Comunicación**: Angular ↔ Django por API REST; autenticación JWT; Django Channels + WebSockets para el chat con persistencia en Django; CORS correcto; configuración por variables de entorno.

S5. **Paleta obligatoria** (uso exclusivo como base visual):
- Rojo principal: `#ff5657` — color principal para botones, acciones importantes, indicadores y elementos destacados.
- Blanco: `#ffffff` — predomina en superficies y fondos.
- Gris: `#d9d9d8` — bordes, textos secundarios y separadores.
- Rojo suave: `#ff8f8f` y rosa claro: `#ffcaca` — complementan mediante fondos suaves, detalles y decorativos.

S6. **Estilo visual**: minimalista, glassmorphism moderado, tarjetas con transparencias sutiles, bordes suaves, sombras discretas, radios consistentes, jerarquía tipográfica clara, iconografía coherente, microinteracciones y transiciones suaves, espaciados consistentes, formularios limpios, navegación intuitiva. Evitar: exceso de transparencias, degradados exagerados, animaciones innecesarias, interfaces saturadas, decoración que dificulte la lectura, apariencia de plantilla administrativa genérica. Completamente responsive; navegación adaptada a cada rol.

S7. **Roles**:
1. USUARIO
2. PROFESIONAL
3. ADMINISTRADOR

**Usuario** puede: crear cuenta e iniciar sesión; consultar y actualizar su perfil; registrar denuncias públicas o anónimas; consultar sus propias denuncias; seguimiento; comunicarse con un profesional mediante chat; consultar noticias; escuchar pódcast; consultar publicaciones del foro.

**Profesional** puede: iniciar sesión; consultar denuncias disponibles o asignadas según permisos; consultar la información necesaria para atender los casos; identificar si una denuncia es pública o anónima; actualizar estados de atención; comunicarse con usuarios mediante chat; consultar historial de conversaciones autorizadas. "un profesional NO debe poder consultar la identidad ni los datos personales del remitente cuando una denuncia sea anónima."

**Administrador** puede: administrar usuarios y roles; gestionar noticias; gestionar pódcast; gestionar publicaciones del foro; administrar módulos generales. "El administrador NO debe poder consultar el contenido de los chats privados."

"Implementar todas las restricciones en el backend mediante permisos y validaciones. No confiar únicamente en la protección de rutas del frontend."

S8. **HU-01. Registro e inicio de sesión**: Como usuario de la plataforma, quiero crear una cuenta e iniciar sesión en el sistema, para acceder a las funcionalidades de Protección Inmediata SC y gestionar mis solicitudes de atención. Criterios: (1) Permitir crear una cuenta mediante un formulario. (2) Solicitar los datos necesarios para registrar al usuario. (3) Validar campos obligatorios. (4) Validar el formato del correo electrónico. (5) Evitar registros con correos duplicados. (6) Permitir iniciar sesión con credenciales válidas. (7) Mostrar mensajes informativos cuando las credenciales sean incorrectas. (8) Habilitar funcionalidades según el rol asignado.

S9. **HU-02. Consulta y gestión del perfil**: consultar y actualizar la información del perfil propio. Criterios: (1) consultar el perfil del usuario autenticado. (2) Mostrar los datos personales registrados. (3) Permitir editar los campos habilitados. (4) Validar los campos obligatorios. (5) Permitir guardar los cambios. (6) Mostrar confirmación después de actualizar. (7) Impedir que un usuario consulte o modifique perfiles ajenos. (8) Proteger la información personal y evitar que sea expuesta a profesionales en denuncias anónimas.

S10. **HU-03. Registro de denuncias públicas o anónimas**. Criterios: (1) Permitir seleccionar entre denuncia pública y anónima. (2) Permitir registrar la descripción de los hechos y la información solicitada. (3) Validar campos obligatorios. (4) Permitir que el profesional autorizado consulte los datos de identificación necesarios en denuncias públicas. (5) Mantener la relación interna de la denuncia anónima con la cuenta del usuario, pero ocultar al profesional los datos personales del remitente. (6) Mostrar al profesional que la denuncia es anónima. (7) Guardar la denuncia y generar una confirmación de registro. (8) Permitir que el usuario consulte posteriormente su denuncia desde su cuenta.

**Requisito crítico de anonimato**: La denuncia anónima debe estar asociada internamente a la cuenta del usuario para que este pueda realizar seguimiento. Sin embargo: el profesional debe visualizar la modalidad ANÓNIMA; el profesional no debe visualizar el nombre, correo, teléfono, documento ni otros datos identificativos del remitente; los serializers y endpoints deben excluir estos datos para los profesionales; no basta con ocultar los campos visualmente en Angular; el administrador tampoco debe tener acceso indiscriminado a los datos personales de una denuncia anónima desde los módulos de atención; los permisos deben verificarse en el backend. Implementar una separación clara entre la información de identidad del usuario y la información operativa de la denuncia.

S11. **HU-04. Consulta y seguimiento de denuncias**. Criterios: (1) consultar las denuncias asociadas a la cuenta autenticada. (2) Mostrar identificador, fecha de registro y estado. (3) consultar el detalle de cada denuncia. (4) Mostrar actualizaciones del proceso. (5) Identificar estados pendiente, en proceso y finalizada. (6) Impedir consultar denuncias de otras cuentas. (7) No mostrar información personal que comprometa el anonimato.

S12. **HU-05. Gestión y atención de denuncias** (profesional). Criterios: (1) consultar denuncias disponibles o asignadas. (2) Mostrar identificador, fecha, modalidad y estado. (3) consultar detalles según autorización. (4) Identificar si una denuncia es pública o anónima. (5) Ocultar datos personales en denuncias anónimas. (6) Permitir actualizar el estado de atención. (7) Guardar los cambios y reflejarlos en el seguimiento del usuario. (8) Restringir estas acciones a profesionales autorizados.

S13. **HU-06. Comunicación mediante chat**. Criterios: (1) iniciar conversaciones entre usuario y profesional cuando corresponda. (2) enviar y recibir mensajes. (3) Mostrar los mensajes dentro de su conversación. (4) Identificar remitente, fecha y hora de envío. (5) consultar el historial autorizado. (6) Restringir el contenido a los participantes. (7) Impedir que el administrador consulte los mensajes privados. (8) Implementar WebSockets para comunicación en tiempo real.
Requisitos técnicos: modelos de conversaciones y mensajes; relación de participantes; persistencia; endpoints REST para consultar conversaciones e historial; Django Channels; WebSockets autenticados; verificación de participantes antes de permitir conexión o envío; actualización en tiempo real; interfaz de conversación en Angular; estados de conexión y envío. "Si una configuración del entorno impide ejecutar WebSockets, documentar la limitación y no afirmar que la funcionalidad está operativa."

S14. **HU-07. Consulta de noticias, pódcast y foro**. Criterios: (1) consultar noticias publicadas. (2) Mostrar título, descripción, fecha y contenido. (3) consultar los pódcast disponibles. (4) reproducir los contenidos de audio. (5) visualizar publicaciones del foro. (6) consultar publicaciones y sus respuestas. (7) Organizar los contenidos de manera accesible. (8) Acceso desde móviles y computadores.

S15. **HU-08. Administración de noticias, pódcast y foro** (administrador). Criterios: (1) crear noticias. (2) consultar, editar y eliminar noticias. (3) registrar pódcast y asociar archivos o recursos de audio. (4) consultar, editar y eliminar pódcast. (5) crear, consultar, editar y eliminar publicaciones del foro. (6) Reflejar los cambios en los módulos visibles para los usuarios. (7) Restringir las operaciones al rol administrador.

S16. **Vistas frontend**: públicas (bienvenida, presentación, registro, login, información general); panel usuario (dashboard, perfil, registro de denuncias, selección de modalidad, listado, detalle y seguimiento, chat, noticias, pódcast, foro); panel profesional (dashboard, listado de denuncias, detalle, indicador de modalidad, gestión de estados, chat, historial autorizado); panel administrador (dashboard, gestión de usuarios, noticias, pódcast, foro). Navegación propia según rol. "No crear botones decorativos sin funcionalidad."

S17. **Cuentas de prueba** (creadas por comando de inicialización idempotente; sólo desarrollo):
- USUARIO: `usuario@proteccioninmediata.test` / `Usuario123*`
- PROFESIONAL: `profesional@proteccioninmediata.test` / `Profesional123*`
- ADMINISTRADOR: `admin@proteccioninmediata.test` / `Admin123*`

S18. **Datos ficticios de demostración**: denuncias públicas, denuncias anónimas, noticias, pódcast, publicaciones del foro, conversaciones y mensajes de prueba cuando sea posible. "No utilizar datos personales reales ni información real de víctimas."

S19. **README.md completo** en la raíz del proyecto con: 1 nombre y descripción; 2 objetivo general; 3 tecnologías; 4 arquitectura general; 5 estructura de carpetas frontend; 6 estructura de carpetas backend; 7 descripción de cada app Django; 8 descripción de módulos Angular; 9 modelo general de datos y relaciones; 10 roles y permisos; 11 autenticación JWT; 12 módulo de denuncias; 13 manejo de anonimato y protección de datos; 14 chat y WebSockets; 15 endpoints principales; 16 variables de entorno; 17 instalación/ejecución backend; 18 instalación/ejecución frontend; 19 PostgreSQL y alternativa SQLite; 20 migraciones; 21 cuentas de prueba; 22 pruebas automatizadas; 23 credenciales de demostración; 24 estado de implementación por HU; 25 pendientes/limitaciones.

S20. **Pruebas**: automatizadas para registro/login, validación de roles, protección de endpoints, edición de perfiles, registro de denuncias, separación de datos en denuncias anónimas, seguimiento, actualización de estados, permisos del chat, envío/recepción de mensajes, CRUD noticias/pódcast/foro. Comprobar especialmente: (1) un usuario no puede consultar denuncias de otras cuentas; (2) un profesional no puede obtener datos personales de una denuncia anónima; (3) un usuario no puede ejecutar operaciones administrativas; (4) un profesional no puede asignarse permisos de administrador; (5) el administrador no puede acceder al contenido de los chats privados; (6) los participantes no pueden acceder a conversaciones ajenas.

S21. **Git**: Conventional Commits; no commits vacíos; no secretos/.env; respetar trabajo previo; push sólo con autorización (usuario decidió: sólo commits locales por ahora).

S22. **Reportes administrativos / exportación Excel**: fuera del MVP. Dejar arquitectura preparada, sin sacrificar los ocho módulos.

## Tasks

| ID | Spec | Ruta | Commit |
|----|------|------|--------|
| T1 | S1,S3,S4,S22 | Scaffold backend: `config` (settings con env, ASGI/WSGI, urls), app `core`, `requirements.txt`, `.env.example`, `.gitignore` | `chore(backend): scaffold django project and core app` |
| T2 | S7,S8,S9 | `usuarios` (custom user + roles + JWT auth + admin de usuarios) y `perfiles` | `feat(auth): implement users, roles and jwt authentication` |
| T3 | S7,S10,S11,S12 | `denuncias` (modalidad, anonimato, seguimiento, estados) + `notificaciones` | `feat(denuncias): add public and anonymous reporting with tracking` |
| T4 | S4,S7,S13 | `chat` (modelos, REST, Channels + consumer JWT) | `feat(chat): implement websocket messaging` |
| T5 | S7,S14,S15 | `noticias`, `podcasts`, `foro` (CRUD + permisos + contenido público) | `feat(content): add news, podcasts and forum` |
| T6 | S17,S18 | Comando `seed_demo` idempotente + datos ficticios | `feat(seed): add idempotent demo data command` |
| T7 | S20 | Suite de pruebas de seguridad/roles/CRUD | `test(security): validate roles, anonymity and conversation permissions` |
| T8 | S2,S5,S6,S16 | Scaffold Angular 22: identidad visual, core (auth/session/guards/interceptors), shell y navegación por rol | `feat(ui): scaffold angular app with auth core and role shell` |
| T9 | S8,S9,S10,S11,S16 | Auth, landing, perfil, panel usuario, denuncias | `feat(ui): build user dashboard and reporting flow` |
| T10 | S12,S16 | Panel profesional + gestión de estados | `feat(ui): build professional panel and status management` |
| T11 | S14,S15,S16 | Panel admin + contenidos (noticias, podcasts, foro) | `feat(ui): build admin and content modules` |
| T12 | S13,S16 | Chat UI real + servicio WebSocket | `feat(ui): connect real-time chat` |
| T13 | S19 | README completo | `docs(readme): document application architecture` |
| T14 | S20,S21 | Verificación integral + commits | — |

## Convenciones (leer antes de escribir código)

### Backend
- Layout: `backend/config/` (settings, urls, asgi, wsgi); `backend/apps/<app>/` con `models.py`, `serializers.py`, `views.py`, `urls.py`, `permissions.py`, `admin.py`, `apps.py`, `migrations/`, `tests/`. `apps` se agrega a `sys.path` vía `INSTALLED_APPS` nombres `apps.usuarios` etc.; usar `apps.<name>` como etiqueta de app (`name = "apps.usuarios"`, `label = "usuarios"`).
- Usuario custom: `apps.usuarios.models.Usuario(AbstractBaseUser, PermissionsMixin)`, `USERNAME_FIELD = "email"`, campo `role` con `RolChoices`. `AUTH_USER_MODEL = "usuarios.Usuario"`.
- Respuesta de error uniforme: DRF default (`{"detail": ...}` / dict de campos). No inventar envelope propio.
- JWT: `djangorestframework-simplejwt`; claims custom `role` y `email` vía serializer propio; `Authorization: Bearer <access>`.
- Permisos: `apps.core.permissions.IsUsuario`, `IsProfesional`, `IsAdministrador` (por `request.user.role`). Toda vista protegida declara `permission_classes`.
- Anonimato: la identidad vive en `Denuncia.denunciante` (FK). Serializer separado por rol: el serializer profesional NUNCA incluye `denunciante`, `denunciante_email`, `denunciante_nombre`, `denunciante_telefono`, `denunciante_documento`; sólo `es_anonima`, `modalidad`. El serializer del dueño sí incluye sus propios datos.
- `django-cors-headers` con `CORS_ALLOWED_ORIGINS` por env.
- Config por env con `python-dotenv`; `.env.example` sin valores sensibles reales; `.env` en `.gitignore`.
- Canales: `channels`, ASGI con `ProtocolTypeRouter`; consumer autenticado por JWT en query string (`?token=`), verificación de participante en `connect`.
- Datos en español (nombres de campos y mensajes de validación en español), identificadores y lógica en inglés cuando sea más natural (p. ej. `class UsuarioManager`).

### Frontend
- Angular 22 standalone components, rutas lazy por rol, `provideRouter`, `provideHttpClient(withInterceptors([...]))`.
- Estructura: `src/app/core/` (services, guards, interceptors, models), `src/app/shared/` (componentes reutilizables), `src/app/features/<feature>/` con componentes `<name>/<name>.component.{ts,html,scss}` y `<feature>.routes.ts`.
- Paleta en `src/styles/_variables.scss` (SCSS) y tokens CSS en `:root`; usar siempre las variables, no hex sueltos.
- Sin dependencias externas de iconos/fuentes por CDN; iconografía con SVG inline.
- `HttpClient` sólo dentro de servicios de `core/services` o `features/<f>/data`.
- Guards: `authGuard`, `roleGuard(roles)`; interceptor `authInterceptor` (adjunta JWT, redirige en 401), `errorInterceptor` (mensajes).
- `environment.ts` con `apiUrl` y `wsUrl`.

### Verificación
- Backend: `.venv/Scripts/python.exe manage.py test` (SQLite local).
- Frontend: `npm test` y `npm run build`.
- Pruebas backend usan `APITestCase` con datos ficticios.

## Log

L1 (request original): "PROMPT MAESTRO — PROTECCIÓN INMEDIATA SC. Construcción de MVP funcional Full Stack con Angular y Django. [...] El objetivo principal es entregar un MVP funcional de Protección Inmediata SC, no simplemente una demostración visual." (spec completa en la conversación; S1–S22 la citan textualmente).

L2 (decisiones del usuario, 2026-11-07): repositorios backend/ y frontEnd/ se mantienen separados con sus remotos; README canónico en la raíz del workspace (no versionado); push a origin NO autorizado por ahora (sólo commits locales).

L3 (entorno): Node v26.12.1, npm 11.20.0, Python 3.14.7, git 2.55.0.windows.3. Instalado en `backend/.venv`: Django 6.1.3, DRF 3.18.3, simplejwt 5.5.1, channels 4.3.2, daphne 4.2.3, psycopg 3.3.8, django-cors-headers 4.9.0, Pillow 13.0.0, python-dotenv 1.2.4. Angular CLI 22.2.6 soporta Node >=26.

L4 (frontend scaffold, 2026-11-07): `ng new proteccion-inmediata-sc --directory=. --style=scss --routing --ssr=false` en `frontEnd/`. Angular 22.2, TypeScript 6.0, **Vitest 5** como runner (`npm test`), componentes standalone, raíz `src/app/app.ts`.

## API contract (contrato REST + WebSocket)

Autenticación: `Authorization: Bearer <access>` en todas las rutas salvo las públicas. Listados paginados devuelven `{count, next, previous, results}`. Errores DRF: `400` con `{campo: [mensajes]}` o `{"detail": "..."}`; `401` sin/with token inválido; `403` rol/permiso; `404` recurso inexistente o ajeno.

### Autenticación y usuarios (`/api/auth/`)
- `POST /api/auth/register/` body `{email, nombre_completo, telefono, password, password_confirm}` → `201 {detail, user}`. `role` ignorado (siempre USUARIO).
- `POST /api/auth/login/` body `{email, password}` → `200 {access, refresh, user}`; `401` credenciales inválidas.
- `POST /api/auth/refresh/` body `{refresh}` → `200 {access}`.
- `GET /api/auth/me/` → `200 Usuario`.
- `GET /api/auth/usuarios/` (ADMIN) → paginado de usuarios.
- `PATCH /api/auth/usuarios/{id}/` (ADMIN) body `{role?, is_active?, nombre_completo?, telefono?, documento?}`.

`Usuario`/`Perfil`: `{id, email, nombre_completo, telefono, documento, direccion, fecha_nacimiento, role, is_active, date_joined}`. `role` ∈ `USUARIO|PROFESIONAL|ADMINISTRADOR`.

### Perfil (`/api/perfiles/`)
- `GET|PUT|PATCH /api/perfiles/mi-perfil/` — siempre el usuario autenticado. Editables: `nombre_completo, telefono, documento, direccion, fecha_nacimiento`.

### Denuncias del usuario (`/api/denuncias/mis-denuncias/`)
- `GET` → paginado de las propias; `POST` body `{modalidad, tipo_situacion, descripcion, ubicacion?, fecha_hechos?}` → `201 {detail, denuncia}`.
- `GET /{id}/` → detalle propio.
- `modalidad` ∈ `PUBLICA|ANONIMA`; `tipo_situacion` ∈ `VIOLENCIA_INTRAFAMILIAR|ABUSO|ACOSO|OTRO`; `estado` ∈ `PENDIENTE|EN_PROCESO|FINALIZADA`.
- Detalle propio: `{id, identificador, modalidad, es_anonima, tipo_situacion, descripcion, ubicacion, fecha_hechos, estado, profesional_asignado: {id,nombre_completo}|null, seguimientos: [{id, estado_anterior, estado_nuevo, observacion, autor_nombre, creado_en}], creado_en, actualizado_en}`.

### Atención profesional (`/api/denuncias/profesional/`)
- `GET` (PROFESIONAL) → paginado; query `?estado=&modalidad=&mis_denuncias=true`.
- `GET /{id}/` → detalle. **Para ANONIMA, `solicitante` es `null`**; para PUBLICA es `{nombre_completo,email,telefono,documento}`.
- `POST /{id}/asignarme/` → asigna el caso y pasa a EN_PROCESO.
- `POST /{id}/cambiar_estado/` body `{estado, observacion?}` → crea seguimiento y notifica al denunciante.
- Campos: igual que el detalle propio más `solicitante`.

### Chat (`/api/chat/`)
- `GET /conversaciones/` → paginado de las propias: `{id, denuncia: {id,identificador,modalidad,es_anonima,estado}, participantes: [{id,nombre_completo,role}], ultimo_mensaje: {contenido,remitente_nombre,creado_en}|null, no_leidos, creado_en, actualizado_en}`.
- `POST /conversaciones/` body `{denuncia}` → `201` o `200` si ya existía.
- `GET /conversaciones/{id}/` → detalle (sólo participantes).
- `GET /conversaciones/{id}/mensajes/` → paginado `{id, remitente: {id,nombre_completo,role}, contenido, leido, creado_en}`.
- `POST /conversaciones/{id}/mensajes/` body `{contenido}` → `201` mensaje.
- `POST /conversaciones/{id}/marcar_leidos/` → `{actualizados}`.
- WebSocket: `ws/chat/{conversacionId}/?token=<access>` (URL base desde entorno). Enviar `{"contenido": "..."}`. Recibir `{"tipo": "mensaje", "mensaje": {...}}`. Cierre `4403` si no es participante.

### Contenido
- `GET /api/noticias/` público (sólo publicadas), `GET /api/noticias/{id}/`; `POST/PATCH/DELETE` sólo ADMIN. `{id, titulo, resumen, contenido, imagen, autor_nombre, publicado, fecha_publicacion}`.
- `GET /api/podcasts/` público, `GET /{id}/`; `POST/PATCH/DELETE` sólo ADMIN. `{id, titulo, descripcion, audio, audio_url, url_audio, duracion_segundos, autor_nombre, publicado, fecha_publicacion}`.
- `GET /api/foro/publicaciones/` (autenticado) `{id,titulo,contenido,autor_nombre,respuestas:[...],respuestas_count,creado_en,actualizado_en}`; `POST` autenticado; `PATCH/DELETE` autor o ADMIN; `POST /api/foro/publicaciones/{id}/responder/` body `{contenido}`; `DELETE /api/foro/respuestas/{id}/` autor o ADMIN.

### Notificaciones (`/api/notificaciones/`)
- `GET` paginado de las propias `{id,titulo,mensaje,tipo,url,leida,creado_en}`; `GET /no_leidas/` → `{no_leidas}`; `POST /{id}/marcar_leida/`; `POST /marcar_todas_leidas/`.

### Cuentas de demostración
`usuario@proteccioninmediata.test / Usuario123*`, `profesional@proteccioninmediata.test / Profesional123*`, `admin@proteccioninmediata.test / Admin123*`.

## Verificación (L5)

- **Backend**: `manage.py test apps` → 65/65 OK. La suite cubrió y corrigió tres defectos reales de seguridad (fuga del nombre del denunciante por el autor del seguimiento, bypass de superusuario en `IsProfesional`, y `DestroyModelMixin` faltante en `RespuestaViewSet`).
- **Frontend**: `npm run build` OK; `npm test` → 9/9 OK (Vitest).
- **E2E en vivo** (Daphne ASGI en 127.0.0.1:8000, HTTP real): login de los 3 roles; alta de denuncia anónima; la lista profesional devuelve `solicitante=None` y **cero fugas** de nombre/correo/teléfono/documento en el objeto anónimo (acotado a las denuncias anónimas; las públicas sí exponen contacto, como exige HU-03 criterio 4); `admin GET /denuncias/profesional/` → 403; `admin GET /chat/conversaciones/` → lista vacía y retrieve/mensajes → 403; participante ve 1 conversación e historial, y persiste un mensaje nuevo (201).
- **Verificación independiente delegada**: no disponible — el runner de subagentes rechazó `workspace_root` y `repository_root` porque la raíz del workspace no es un repo git y `backend/`/`frontEnd/` son clones independientes. Limitación documentada; la verificación se hizo con suite automatizada + E2E en vivo, no afirmando nada no ejecutado.
