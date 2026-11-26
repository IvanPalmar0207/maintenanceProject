# Protección Inmediata SC

MVP funcional Full Stack para denunciar situaciones de violencia intrafamiliar,
abuso y acoso, hacer seguimiento de los casos, recibir acompañamiento profesional
y acceder a contenidos informativos. No es una maqueta: frontend y backend están
conectados, con persistencia, autenticación, autorización por roles, CRUD y chat
en tiempo real.

El proyecto vive en dos repositorios Git independientes dentro de esta carpeta:

```
ProteccionInmediataSC/
├── README.md      ← este documento (documentación canónica del proyecto)
├── backend/       ← API Django + Django REST Framework + Channels (repo git)
└── frontEnd/      ← aplicación Angular (repo git)
```

---

## 1. Descripción

Protección Inmediata SC permite a cualquier persona registrarse, registrar una
denuncia **pública o anónima**, hacer seguimiento a su estado, conversar por chat
privado con el profesional asignado, y consultar noticias, pódcast y el foro.
Profesionales atienden los casos sin ver la identidad de las denuncias anónimas.
Administradores gestionan usuarios y contenidos, sin acceso a los chats privados.

## 2. Objetivo general

Ofrecer una plataforma segura y accesible que facilite la denuncia, el
seguimiento y el acompañamiento, protegiendo especialmente la identidad de
quienes denuncian de forma anónima, con una separación clara entre identidad y
operación, aplicada en el backend y no sólo en la interfaz.

## 3. Tecnologías

**Backend**
- Python 3.14 y Django 6.1
- Django REST Framework 3.18
- djangorestframework-simplejwt 5.5 (JWT)
- Django Channels 4.3 + Daphne (WebSockets / ASGI)
- PostgreSQL (producción, vía `psycopg` 3) o SQLite (local)
- django-cors-headers, python-dotenv

**Frontend**
- Angular 22 (componentes standalone, TypeScript 6, `@if`/`@for`/`@switch`)
- SCSS con sistema de diseño propio
- RxJS, `HttpClient` con interceptores funcionales, guards
- Vitest (pruebas unitarias)

## 4. Arquitectura general

```
Angular (SPA)  ──HTTP/JSON + JWT──▶  Django REST Framework  ──ORM──▶  PostgreSQL / SQLite
      │                                     │
      └──── WebSocket (/ws/chat/…) ────▶ Django Channels (ASGI, Daphne)
                                             │
                                        Channel layer (memoria en local, Redis opcional)
```

- El frontend consume la API REST en `/api/...` y envía el JWT en
  `Authorization: Bearer <access>`.
- El chat usa WebSockets autenticados (JWT por query string) y **persiste en
  Django**; el REST también permite enviar y consultar historial.
- La configuración es por variables de entorno; CORS restringido al origen del
  frontend.

## 5. Estructura de carpetas del frontend

```
frontEnd/src/
├── main.ts, index.html, styles.scss
├── styles/                       _variables.scss (paleta), _base.scss (primitivas)
├── environments/                 environment.ts / environment.development.ts
└── app/
    ├── app.ts / app.html / app.scss        shell (nav + side-nav + router-outlet)
    ├── app.config.ts, app.routes.ts
    ├── core/
    │   ├── models/api.models.ts            tipos compartidos con la API
    │   ├── services/                       auth, token, perfil, denuncia, chat,
    │   │                                   chat-socket, noticia, podcast, foro,
    │   │                                   notificacion, admin-usuario, notification
    │   ├── guards/                         authGuard, roleGuard, publicOnlyGuard
    │   └── interceptors/                   authInterceptor, errorInterceptor
    ├── shared/
    │   ├── components/                      nav-bar, side-nav, empty-state, toast-host
    │   └── pipes/labels.pipe.ts            etiquetas en español de los enums
    └── features/
        ├── public/landing/
        ├── auth/{login,register}/
        ├── usuario/{dashboard,perfil,denuncias}/
        ├── profesional/{dashboard,denuncias}/
        ├── admin/{dashboard,usuarios,noticias,podcasts,foro}/
        ├── contenido/{noticias,podcasts,foro}/
        └── chat/{chat-list,chat-room}/
```

Cada componente tiene su propio `.component.ts`, `.component.html` y
`.component.scss` (sin plantillas ni estilos inline).

## 6. Estructura de carpetas del backend

```
backend/
├── manage.py, requirements.txt, .env.example, .gitignore
├── config/            settings.py, urls.py, asgi.py, wsgi.py
└── apps/
    ├── core/          permisos, paginación, modelo base, comando seed_demo
    ├── usuarios/      usuario custom, roles, registro/login, admin de usuarios
    ├── perfiles/      consulta/edición del perfil propio
    ├── denuncias/     modelo, serializers con anonimato, atención profesional
    ├── chat/          conversaciones, mensajes, REST y consumer WebSocket
    ├── noticias/      noticias + CRUD admin
    ├── podcasts/      pódcast + CRUD admin
    ├── foro/          publicaciones y respuestas
    └── notificaciones/notificaciones internas
```

Cada app tiene sus propios `models.py`, `serializers.py`, `views.py`, `urls.py`,
`admin.py`, `migrations/` y `tests/`.

## 7. Descripción de cada aplicación Django

| App | Responsabilidad |
|-----|-----------------|
| `core` | Permisos por rol, paginación estándar, `TimeStampedModel`, comando `seed_demo`. |
| `usuarios` | Usuario con email como identificador y campo `role`; registro, login JWT, `/me/` y gestión administrativa de cuentas. |
| `perfiles` | `GET/PUT/PATCH /api/perfiles/mi-perfil/`; siempre resuelve `request.user`. |
| `denuncias` | Denuncia con modalidad pública/anónima, tipo, estado, profesional asignado y `SeguimientoDenuncia`; serializers separados por rol. |
| `chat` | `Conversacion` (ligada a una denuncia, con participantes) y `Mensaje`; REST + `ChatConsumer`. |
| `noticias` | Noticias con lectura pública de publicadas y CRUD del administrador. |
| `podcasts` | Pódcast con audio (archivo o URL) y CRUD del administrador. |
| `foro` | Publicaciones y respuestas; autores y administrador gestionan su contenido. |
| `notificaciones` | Notificaciones internas por usuario y servicio `notificar(...)`. |

## 8. Descripción de módulos Angular

- **core**: sesión y roles (`AuthService`), token, servicios HTTP tipados por
  dominio, cliente WebSocket con estado de conexión, guards e interceptores.
- **shared**: navegación superior, navegación lateral por rol, estado vacío,
  notificaciones emergentes y pipes de etiquetas.
- **features/public**: landing con presentación, cómo funciona e información.
- **features/auth**: login y registro con validaciones y confirmación.
- **features/usuario**: dashboard con resumen y notificaciones, perfil editable,
  listado, registro (modalidad pública/anónima) y detalle con seguimiento.
- **features/profesional**: panel de casos, filtros, detalle anonimizado y cambio
  de estado con observación.
- **features/admin**: dashboard, gestión de usuarios, CRUD de noticias, pódcast y
  foro.
- **features/contenido**: noticias (lista/detalle), pódcast (reproductor) y foro
  (publicaciones y respuestas).
- **features/chat**: lista de conversaciones y sala en tiempo real.

## 9. Modelo general de datos y relaciones

```
Usuario (email único, role, datos personales)
  ├─1:N─ Denuncia.denunciante
  ├─1:N─ Denuncia.profesional_asignado
  ├─M:N─ Conversacion.participantes
  ├─1:N─ Mensaje.remitente
  ├─1:N─ Notificacion.usuario
  ├─1:N─ Noticia.autor / Podcast.autor
  └─1:N─ Publicacion.autor / Respuesta.autor

Denuncia (codigo UUID, modalidad, tipo_situacion, descripcion, estado,
          profesional_asignado)
  ├─1:N─ SeguimientoDenuncia (estado_anterior, estado_nuevo, observacion, autor)
  └─1:N─ Conversacion

Conversacion ─1:N─ Mensaje (contenido, leido)
Publicacion ─1:N─ Respuesta
```

La identidad del denunciante vive **sólo** en `Denuncia.denunciante`; la
serialización decide si se expone.

## 10. Roles y permisos

| Rol | Puede |
|-----|-------|
| **USUARIO** | Registrarse/iniciar sesión; ver y editar su perfil; registrar denuncias públicas o anónimas; ver **sólo** las propias; chat; noticias, pódcast y foro. |
| **PROFESIONAL** | Ver casos disponibles/asignados; identificar modalidad; **nunca** ver identidad de denuncias anónimas; asignarse y cambiar estados; chat con participantes. |
| **ADMINISTRADOR** | Gestionar usuarios y roles; CRUD de noticias, pódcast y foro. **No** accede a chats privados ni a la identidad de denuncias anónimas desde la atención. |

Los permisos se aplican con `permission_classes` y validaciones en el backend;
ocultar campos en Angular **no** es la barrera de seguridad. No existe bypass de
superusuario en los permisos de rol (un administrador no es un profesional).

## 11. Autenticación JWT

- `POST /api/auth/login/` devuelve `access`, `refresh` y el `user` (con `role`).
- El token incluye claims `role` y `email`.
- El frontend guarda el par en `localStorage`, lo adjunta con `authInterceptor` y
  limpia la sesión ante un `401` (`errorInterceptor`).
- Rutas protegidas por `authGuard` y `roleGuard(roles)`.
- WebSocket: el `JWTAuthMiddleware` (ASGI) valida `?token=<access>` ejecutando el
  ORM mediante `database_sync_to_async`.

## 12. Módulo de denuncias

- `POST /api/denuncias/mis-denuncias/` crea la denuncia asociada a `request.user`,
  registra un `SeguimientoDenuncia` inicial y genera una notificación.
- Estados: `PENDIENTE` → `EN_PROCESO` → `FINALIZADA`.
- El profesional se asigna (`/asignarme/`) y cambia el estado
  (`/cambiar_estado/`), lo que crea un seguimiento y notifica al denunciante.
- El dueño ve identificador, fecha, estado y la línea de seguimiento completa.
- El listado del dueño se filtra por `denunciante=request.user` (aislamiento
  total: no puede ver ni recuperar denuncias ajenas).

## 13. Manejo de anonimato y protección de datos

- `Denuncia.denunciante` mantiene el vínculo interno para que el usuario haga
  seguimiento.
- **Serializer del profesional** (`DenunciaProfesionalSerializer`): `solicitante`
  es `null` cuando la denuncia es anónima; jamás se serializan nombre, correo,
  teléfono ni documento.
- El `autor_nombre` del seguimiento tampoco filtra la identidad del denunciante
  en denuncias anónimas (`"Denunciante anónimo"`).
- El administrador no accede al módulo de atención (403) y `Mensaje` no está
  registrado en el admin de Django.
- Pruebas dedicadas recorren el JSON serializado y afirman que ningún dato
  identificativo aparece (ver `apps/denuncias/tests/test_denuncias.py`).

## 14. Chat y WebSockets

- Modelos: `Conversacion` (una por denuncia, con participantes) y `Mensaje`.
- REST: `GET /api/chat/conversaciones/`, `POST` para abrir/obtener la de una
  denuncia, `GET/POST /conversaciones/{id}/mensajes/` y
  `POST /conversaciones/{id}/marcar_leidos/`.
- WebSocket: `ws/chat/{conversacionId}/?token=<access>`. El `ChatConsumer`
  verifica que el usuario sea participante **antes** de aceptar (cierra con
  `4403` si no lo es), persiste cada mensaje y lo difunde al grupo
  `chat_<id>`.
- Sólo los participantes leen/escriben; el administrador no tiene acceso.
- Capa de canales en memoria para desarrollo local; con `REDIS_URL` se usa Redis.

> Nota: la comunicación en tiempo real requiere ejecutar el backend con ASGI
> (`daphne`/`runserver` con Channels). Está verificada con pruebas automatizadas
> del consumer (`WebsocketCommunicator`) además de la interfaz Angular.

## 15. Endpoints principales

| Método | Ruta | Rol |
|--------|------|-----|
| POST | `/api/auth/register/` | público |
| POST | `/api/auth/login/` · `/api/auth/refresh/` | público |
| POST | `/api/auth/password-reset/` | público (limitado por IP) |
| GET | `/api/auth/password-reset/validate/?token=…` | público |
| POST | `/api/auth/password-reset/confirm/` | público |
| GET | `/api/auth/me/` | autenticado |
| GET/PATCH | `/api/auth/usuarios/…` | ADMIN |
| GET/PUT/PATCH | `/api/perfiles/mi-perfil/` | autenticado |
| GET/POST | `/api/denuncias/mis-denuncias/` | USUARIO |
| GET | `/api/denuncias/mis-denuncias/{id}/` | dueño |
| GET | `/api/denuncias/profesional/` | PROFESIONAL |
| POST | `/api/denuncias/profesional/{id}/asignarme/` | PROFESIONAL |
| POST | `/api/denuncias/profesional/{id}/cambiar_estado/` | PROFESIONAL |
| GET/POST | `/api/chat/conversaciones/` | participantes |
| GET/POST | `/api/chat/conversaciones/{id}/mensajes/` | participantes |
| WS | `/ws/chat/{id}/?token=…` | participantes |
| GET | `/api/noticias/` · `/api/podcasts/` | público |
| POST/PATCH/DELETE | `/api/noticias/…` · `/api/podcasts/…` | ADMIN |
| GET | `/api/foro/publicaciones/` | autenticado |
| POST | `/api/foro/publicaciones/{id}/responder/` | autenticado |
| GET | `/api/notificaciones/` · `/api/notificaciones/no_leidas/` | autenticado |

Los listados están paginados (`{count, next, previous, results}`).

## 16. Variables de entorno

`backend/.env` (copiar de `backend/.env.example`):

```
DJANGO_SECRET_KEY=…            # obligatorio fuera de desarrollo
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200
DB_ENGINE=sqlite|postgres
POSTGRES_DB=proteccion_inmediata
POSTGRES_USER=…
POSTGRES_PASSWORD=…
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
JWT_ACCESS_MINUTES=60
JWT_REFRESH_DAYS=7
REDIS_URL=                     # vacío = canal en memoria

# Correo (recuperación de contraseña). En desarrollo el backend de consola
# imprime el mensaje en vez de enviarlo.
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=localhost
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=Proteccion Inmediata SC <no-responder@proteccioninmediata.test>

# Recuperación de contraseña
FRONTEND_URL=http://localhost:4200
PASSWORD_RESET_TIMEOUT_MINUTES=30
PASSWORD_RESET_RATE=5/hour

# Subidas
MAX_IMAGE_UPLOAD_MB=5
```

Frontend: `src/environments/environment.ts` y `environment.development.ts`
(`apiUrl`, `wsUrl`). No se versionan secretos ni `.env` (están en `.gitignore`).

## 17. Instalación y ejecución del backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    |  Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env               # ajustar valores
python manage.py migrate
python manage.py seed_demo         # cuentas y datos de demostración
python manage.py runserver         # http://localhost:8000
```

Con Channels, `runserver` usa ASGI (Daphne) y sirve también los WebSockets.

## 18. Instalación y ejecución del frontend

```bash
cd frontEnd
npm install
npm start            # http://localhost:4200
```

El backend debe estar accesible en `http://localhost:8000` (configurable en
`src/environments/`).

## 19. PostgreSQL y alternativa SQLite

- Por defecto `DB_ENGINE=sqlite` usa `backend/db.sqlite3` (cómodo para local).
- Para PostgreSQL: crear la base y poner `DB_ENGINE=postgres` con
  `POSTGRES_*`. El proyecto usa `psycopg` 3.
- En producción se recomienda PostgreSQL. SQLite permite clonar y ejecutar sin
  infraestructura adicional.

## 20. Migraciones

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

Las migraciones ya están generadas y versionadas por app
(`apps/<app>/migrations/`). El usuario custom se define en
`usuarios.0001_initial`; por eso `AUTH_USER_MODEL = "usuarios.Usuario"` y las
migraciones se generan en orden.

## 21. Cuentas de prueba

Se crean con `python manage.py seed_demo`, de forma **idempotente** (puede
ejecutarse repetidas veces sin duplicar datos). Crea las tres cuentas y datos
ficticios: denuncias públicas y anónimas con seguimiento, noticias, pódcast,
hilos del foro y una conversación con mensajes.

## 22. Pruebas automatizadas

Backend (65 pruebas, Django `APITestCase` + `WebsocketCommunicator`):

```bash
cd backend
.venv/Scripts/python.exe manage.py test apps      # Windows
# source .venv/bin/activate && python manage.py test apps   # Linux/macOS
```

Cubren: registro/login/roles, gestión administrativa y escalada de privilegios,
aislamiento de perfiles y denuncias, **anonimato** (sin fugas de identidad),
transiciones de estado, permisos y aislamiento del chat, entrega en tiempo real
por WebSocket, CRUD de noticias, pódcast y foro, **recuperación de contraseña**
(genérica contra enumeración, hash del token, expiración, reutilización, contraseña
segura, revocación de refresh tokens y rate limiting), **validación de imágenes**
(extensión, MIME, tamaño, bytes reales, reemplazo y borrado) y **validación de
enlaces HTTPS de pódcast**, además de la idempotencia y el cumplimiento de
contraseñas del seed.

Frontend (Vitest):

```bash
cd frontEnd
npm test
```

Cubren token y sesión/login, mapeo de rol a ruta, `roleGuard`, adjuntado del JWT
por el interceptor, validaciones del cargador de imágenes (formato, tamaño, borrado)
y la lógica del paginador. Actualmente **17 pruebas**.

## 23. Credenciales de demostración

| Rol | Correo | Contraseña |
|-----|--------|------------|
| USUARIO | `usuario@proteccioninmediata.test` | `Sendero#Calido2026` |
| PROFESIONAL | `profesional@proteccioninmediata.test` | `Brujula#Serena2026` |
| ADMINISTRADOR | `admin@proteccioninmediata.test` | `Faro#Seguro2026` |

> Exclusivamente para desarrollo y demostración. No usar en producción.
>
> **Cambiadas en la Fase 2:** las credenciales anteriores (`Usuario123*`, etc.) fueron
> rechazadas por el validador de similitud de Django (eran muy parecidas al correo). Para no
> debilitar las validaciones, el seed ahora usa contraseñas conformes y **valida cada una**
> con `validate_password` usando la cuenta como contexto: si dejan de cumplir la regla, el
> comando falla en vez de crear una cuenta débil.

## 24. Estado de implementación por historia de usuario

| HU | Descripción | Estado |
|----|-------------|--------|
| HU-01 | Registro e inicio de sesión | ✅ Completa (validaciones, duplicados, JWT, roles) |
| HU-02 | Consulta y gestión del perfil | ✅ Completa (sólo perfil propio) |
| HU-03 | Denuncias públicas o anónimas | ✅ Completa (anonimato verificado en backend) |
| HU-04 | Consulta y seguimiento de denuncias | ✅ Completa (aislamiento por cuenta) |
| HU-05 | Gestión y atención de denuncias | ✅ Completa (asignación y estados) |
| HU-06 | Comunicación mediante chat | ✅ Completa (REST + WebSocket persistente; probada) |
| HU-07 | Noticias, pódcast y foro | ✅ Completa (pódcast por enlaces externos) |
| HU-08 | Administración de contenidos | ✅ Completa (CRUD admin con imágenes y enlaces) |

Verificación Fase 2: `manage.py test apps` → 102/102 OK; `npm run build` OK;
`npm test` → 17/17 OK.

## 25. Funcionalidades pendientes y limitaciones conocidas

- **Reportes administrativos / exportación a Excel**: fuera del MVP prioritario.
  La arquitectura (apps separadas, servicios) queda preparada para agregarlos.
- **Pódcast**: funcionan **exclusivamente por enlace externo** (Spotify, YouTube, Apple
  Podcasts u otra plataforma). No hay reproductor propio ni almacenamiento de audio, por
  decisión de diseño. La previsualización embebida mediante iframe oficial **no** está
  implementada: el botón abre el enlace oficial en una pestaña nueva (`rel="noopener
  noreferrer"`). `OTRA` acepta cualquier enlace HTTPS.
- **Notificaciones en tiempo real**: se consultan por REST; el badge del navbar se
  refresca por polling (cada 30 s) y tras acciones. No usan WebSocket.
- **Capa de canales**: en memoria por defecto (adecuada para una sola instancia);
  para despliegues multi-proceso configure `REDIS_URL`.
- **Almacenamiento de archivos en producción**: las imágenes se guardan en `MEDIA_ROOT`
  (sistema de archivos local). En producción se debe usar almacenamiento persistente
  (volumen dedicado o servicio de objetos) y servirlas por el servidor web/CDN; el
  sistema de archivos efímero de muchos PaaS no es adecuado.
- El chat usa WebSocket autenticado por JWT; si el entorno no ejecuta ASGI, el
  envío cae al endpoint REST (persistencia garantizada, sin tiempo real).
- **Capturas de pantalla**: este entorno no dispone de navegador ni herramientas de
  captura, por lo que no se adjuntan evidencias gráficas. La verificación se realizó con
  pruebas automatizadas y build reproducible.

## 26. Novedades de la Fase 2

### Recuperación de contraseña (enlace de un solo uso)

- `POST /api/auth/password-reset/` recibe el correo y responde **siempre** con el mismo
  mensaje genérico (evita enumeración de cuentas). Está limitado por IP
  (`PASSWORD_RESET_RATE`, por defecto `5/hour`).
- El token es aleatorio (`secrets.token_urlsafe`), **se guarda sólo su hash SHA-256**,
  vence según `PASSWORD_RESET_TIMEOUT_MINUTES` y es de un solo uso.
- `GET /api/auth/password-reset/validate/` informa al SPA si el token sigue siendo válido;
  **el frontend nunca decide** esa validez.
- `POST /api/auth/password-reset/confirm/` valida la contraseña con los validadores de
  Django (incluida la similitud con el correo y el nombre), aplica el cambio, quema el
  token y **blacklistea todos los refresh tokens** previos del usuario.
- En desarrollo el correo se imprime por consola (`EMAIL_BACKEND`); en producción se
  configura SMTP por variables de entorno. Si el envío real falla, la API responde `503`
  en lugar de simular un envío exitoso.
- Vistas del frontend: `/recuperar` (solicitar), confirmación de envío, `/restablecer`
  (nueva contraseña) con estados de enlace inválido/expirado y de éxito.

### Subida de imágenes desde la administración

- El admin crea/edita noticias (portada, categoría, destacada) y pódcast (portada) con un
  componente reutilizable de carga: arrastrar y soltar, vista previa, reemplazo y borrado.
- El backend revalida cada archivo (`apps/core/validators.py`): extensión (JPG/PNG/WEBP),
  MIME type, tamaño máximo (`MAX_IMAGE_UPLOAD_MB`) y que los bytes sean una imagen
  decodificable con Pillow. Al reemplazar una imagen se elimina el archivo anterior.
- El envío usa `multipart/form-data`; se puede limpiar la imagen enviando `null`.

### Pódcast por enlaces externos

- Campos: título, descripción, programa, plataforma (`SPOTIFY|YOUTUBE|APPLE_PODCASTS|OTRA`),
  **enlace HTTPS obligatorio y validado**, portada opcional y fecha de publicación.
- La experiencia pública muestra tarjetas con portada, plataforma y fecha, y abre el
  enlace oficial de forma segura en una pestaña nueva.
- **Plataformas compatibles** (sólo por enlace): Spotify
  (`https://open.spotify.com/episode/…`), YouTube (`https://www.youtube.com/watch?v=…`),
  Apple Podcasts (`https://podcasts.apple.com/…`) y cualquier otra con HTTPS. `http://` y
  otros esquemas se rechazan con `400`.

### Tablas administrativas

- Búsqueda server-side con debounce y paginación reutilizable en usuarios, noticias,
  pódcast y foro (el backend expone `search_fields` y la paginación estándar).

## 27. Fotografía, animaciones e interacción (Fase 3)

### Fotografía

Fotografías reales almacenadas **localmente** en `frontEnd/public/photos/`, convertidas a
**WebP** y servidas con `loading="lazy"` donde corresponde. La app no depende de URLs
externas.

| Archivo | Uso | Foto original (Unsplash) |
|---|---|---|
| `hero.webp` | Hero de la landing | `photo-1521737604893-d14cc237f11d` |
| `proceso-1.webp` | Cómo funciona · paso 1 | `photo-1522202176988-66273c2fd55f` |
| `proceso-2.webp` | Cómo funciona · paso 2 | `photo-1543269865-cbf427effbad` |
| `proceso-3.webp` | Cómo funciona · paso 3 | `photo-1600880292203-757bb62b4baf` |
| `proceso-4.webp` | Cómo funciona · paso 4 | `photo-1573497019940-1c28c88b4f3e` |
| `acompanamiento.webp` | Sección de acompañamiento | `photo-1591604466107-ec97de577aff` |
| `comunidad.webp` | Recurso · Foro | `photo-1544027993-37dbfe43562a` |
| `recursos.webp` | Recurso · Pódcast | `photo-1521791136064-7986c2920216` |
| `cta.webp` | Fondo del llamado final | `photo-1509099836639-18ba1795216d` |
| `noticias-hero.webp` | Cabecera del módulo Noticias | `photo-1516321318423-f06f85e504b3` |
| `podcasts-hero.webp` | Cabecera del módulo Pódcast | `photo-1517048676732-d65bc937f952` |
| `foro-hero.webp` | Cabecera del módulo Foro | `photo-1529333166437-7750a6dd5a70` |

Origen: **Unsplash** (`https://images.unsplash.com/photo-<id>`), bajo la
[Unsplash License](https://unsplash.com/license) (uso gratuito, sin atribución obligatoria).
Se almacenan copias locales para no depender de terceros.

> **Nota de verificación:** el entorno de desarrollo de la Fase 3 no disponía de navegador ni
de modelo con visión, por lo que **no se pudo confirmar visualmente el contenido de cada
foto**. Se seleccionaron por temática (encuentro, conversación, acompañamiento), pero se
recomienda revisarlas y reemplazar cualquiera que no encaje.

### Animaciones

Librería: **[Motion](https://motion.dev) v14 — licencia MIT** (única dependencia agregada).
Se usa a través de dos directivas propias con limpieza explícita y respeto de
`prefers-reduced-motion`:

- `appInView` — revela el elemento al entrar en el viewport (`inView`), con dirección y
  retraso configurables; desactiva el observador al destruir el componente.
- `appParallax` — desplazamiento vertical sutil con `animate` + `scroll`, cancelado en
  `ngOnDestroy`.

Ninguna animación bloquea la interacción, no hay *scroll hijacking* y todo colapsa con
prefers-reduced-motion. Las transiciones base (hover, dropdowns, drawer, skeletons) son CSS.

### Interacción nueva

- Barra de navegación *sticky* con blur, sombra al hacer scroll, indicador de sección activa
  animado, menú desplegable de recursos, menú de usuario y **menú móvil animado**.
- Tarjetas con hover elevado, timeline de “Cómo funciona” con puntos conectados y zoom suave
  en las fotos, y aparición progresiva de tarjetas en noticias y pódcast.

---

## Historial de cambios (Conventional Commits)

- `chore(backend): scaffold django project and core app`
- `feat(auth): implement users, roles and jwt authentication`
- `feat(denuncias): add public and anonymous reporting with tracking`
- `feat(chat): implement websocket messaging`
- `feat(content): add news, podcasts and forum`
- `feat(seed): add idempotent demo data command`
- `test(security): validate roles, anonymity and conversation permissions`
- `feat(ui): build angular frontend with role panels, chat and content`
- `docs(readme): document application architecture`

### Fase 2

- `feat(auth): add single-use password recovery by email link`
- `feat(media): add validated image uploads for content`
- `feat(podcasts): replace audio uploads with validated external links`
- `test(seed): validate demo accounts and content rules`
- `feat(admin): enable server-side search on administrative lists`
- `feat(ui): rebuild design system and adapt content to the new contract`
- `feat(ui): redesign landing, auth and password recovery`
- `feat(ui): redesign role dashboards`
- `feat(ui): add search and pagination to administrative tables`
