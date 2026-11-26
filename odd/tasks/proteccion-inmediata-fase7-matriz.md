# Matriz de aceptación — Fase 7 (compilación, pruebas y responsive por inspección)

Feature: `proteccion-inmediata-fase7`
Repos: `backend/` (Django) y `frontEnd/` (Angular), repos git independientes.
Alcance de esta fase: cerrar la validación de Fase 7 **sin capturas de pantalla ni
automatización visual del navegador**. La validación visual/CDP quedó **suspendida por
decisión del usuario** y se reporta como **no ejecutada**.

> **Advertencia de alcance:** ninguna validación de esta matriz se realizó en un navegador
> real. La revisión responsive es **inspección de código y estilos**, no verificación visual.
> No se generaron capturas ni se ejecutó `cdp-visual.mjs`.

## Specs

S1. **Compilación Angular**: `npm run build` debe compilar el proyecto de producción sin errores.

S2. **Pruebas de frontend y backend**: `ng test` y `manage.py test apps` deben pasar completos.
   No se debilitan pruebas existentes.

S3. **Flujos funcionales de los tres roles**: usuario, profesional y administrador validados
   mediante las pruebas existentes (flujos A–E de `core/tests/test_flujos_integracion.py` y
   suites por app).

S4. **Responsive por inspección de código y estilos**: verificar breakpoints, layouts fluidos,
   tablas con scroll, navegación móvil y `prefers-reduced-motion` **leyendo los estilos**, sin
   abrir un navegador.

S5. **Matriz de aceptación**: consolidar el resultado por historia/rol y **documentar
   explícitamente las pruebas que no pudieron ejecutarse**.

## Cambios en curso (preservados)

Estos cambios estaban sin commitear al iniciar la Fase 7 y **no se revirtieron ni se
reconstruyeron**:

- `backend/apps/denuncias/models.py` + `migrations/0002_...`: label de estado `FINALIZADA`
  pasa de "Finalizada" a "Completada" (resuelve la observación 1 de Fase 6). `makemigrations
  --check` → **sin cambios pendientes**.
- `frontEnd/`: `refresh.interceptor.ts` (nuevo) + `AuthService.refrescarToken()` (resuelve la
  observación 2: renovación de sesión ante 401); reconexión progresiva en
  `ChatSocketService` (observación 3); coherencia de etiquetas "Completada" en dashboards,
  filtros y pipe; exención de endpoints de auth/refresh en `error.interceptor.ts`.
- `frontEnd/src/styles/_base.scss`: ya commiteado (`fc81a27`, `ff0677e`), sin cambios locales.

## Resultados de verificación

| # | Verificación | Comando | Resultado | Evidencia |
|---|--------------|---------|-----------|-----------|
| V1 | Compilación Angular | `npm run build` | **OK** (exit 0, build de producción, 3.856 s) | bundle generado en `frontEnd/dist/proteccion-inmediata-sc` |
| V2 | Pruebas frontend | `npx ng test --watch=false` | **33/33 OK** (6 archivos, 3.34 s) | Vitest 5.1.0 |
| V3 | Pruebas backend | `.venv/Scripts/python.exe manage.py test apps` | **114/114 OK** (89.21 s, exit 0) | `Ran 114 tests ... OK` |
| V4 | Migraciones al día | `manage.py makemigrations --check --dry-run` | **OK** (`No changes detected`) | — |
| V5 | Flujos funcionales A–E | incluidas en V3 | **OK** | `apps/core/tests/test_flujos_integracion.py` |
| V6 | Responsive por inspección | lectura de `*.scss` | **Revisado (no visual)** | ver sección siguiente |

### Conteo de pruebas backend por módulo (114)

| Módulo | Tests |
|---|---|
| `chat/tests/test_rest.py` | 10 |
| `chat/tests/test_websocket.py` | 3 |
| `core/tests/test_flujos_integracion.py` | 10 |
| `core/tests/test_seed_demo.py` | 4 |
| `core/tests/test_validators.py` | 8 |
| `denuncias/tests/test_admin.py` | 2 |
| `denuncias/tests/test_denuncias.py` | 17 |
| `foro/tests/test_foro.py` | 7 |
| `noticias/tests/test_noticias.py` | 11 |
| `perfiles/tests/test_perfil.py` | 6 |
| `podcasts/tests/test_podcasts.py` | 8 |
| `podcasts/tests/test_portadas.py` | 2 |
| `usuarios/tests/test_admin_usuarios.py` | 5 |
| `usuarios/tests/test_auth.py` | 9 |
| `usuarios/tests/test_password_reset.py` | 12 |

### Pruebas frontend (33)

- `core.spec.ts`: TokenService (2), AuthService (6) — login, logout, mapeo de rol, bearer,
  restauración de sesión, token inválido.
- `guards/role.guard.spec.ts`: 3.
- `interceptors/refresh.interceptor.spec.ts`: 6 — 401 único, single-flight, fallo de refresh,
  exención de endpoints, anti-loop, sin refresh token.
- `services/chat-socket.service.spec.ts`: 8 — estado, sin socket duplicado, backoff, límite,
  rechazo 4403 sin reintento, `online` inmediato, mensajes/`enviar`, `cerrar`.
- `image-uploader.component.spec.ts`: 4.
- `paginador.component.spec.ts`: 4.

## Flujos funcionales por rol (S3)

| Flujo | Rol(es) | Cobertura | Resultado |
|-------|---------|-----------|-----------|
| Flujo A — denuncia anónima | Usuario + Profesional | alta anónima, seguimiento, `solicitante=null`, sin fuga de identidad | **OK** |
| Flujo B — denuncia pública | Usuario + Profesional | contacto operativo, cambio de estado, sincronización de seguimiento | **OK** |
| Flujo C — chat privado | Usuario + Profesional | participantes; tercero y admin 403 | **OK** |
| Flujo D — contenidos | Administrador + Público | noticia publicar/despublicar; pódcast `https://` obligatorio; moderación de foro | **OK** |
| Flujo E — permisos | Los tres | rutas cruzadas, manipulación de rol, aislamiento de ids | **OK** |

## Revisión responsive por inspección de estilos (S4)

Breakpoints declarados en `frontEnd/src/styles/_variables.scss`: `$bp-mobile: 640px`,
`$bp-tablet: 900px`, `$bp-desktop: 1200px`. Mixins `desde-tablet` / `desde-mobile` en
`_mixins.scss`.

| Área | Evidencia (archivo) | Hallazgo |
|------|---------------------|----------|
| Layout global | `app.scss` | `.shell` flex row → column bajo 900px; `__main { min-width: 0 }` evita desbordes |
| Contenedores/tipografía | `_base.scss` | `clamp()` en títulos; grid a 1 columna y padding reducido bajo 640px |
| Navegación | `nav-bar.component.scss` | links ocultos + hamburguesa visible bajo 900px; drawer animado |
| Navegación lateral | `side-nav.component.scss` | 230px fijo → 100% con ítems en fila envolvente bajo 900px |
| Tablas admin | `admin-*/**.html` + `.scss` | todas envueltas en `.tabla-wrap { overflow-x: auto }` |
| Tablas de rol | `profesional-denuncias`, `denuncias-list` | `.tabla-wrap { overflow-x: auto }` |
| Chat | `chat-room.component.scss` | burbujas `max-width: min(520px, 78%)`; ventana `overflow-y: auto` |
| Modales | `modal.component.scss` | ancho completo bajo 640px |
| Imágenes | `_base.scss` | `img { max-width: 100% }`; hero con `object-fit: cover` y `min-height: clamp()` |
| Movimiento | `_base.scss`, `_mixins.scss` | bloque `prefers-reduced-motion: reduce` desactiva animaciones/transiciones; hover solo en punteros finos |

**Observaciones (no bloqueantes, pendientes de confirmación visual):**

1. `.chat__form` no declara `flex-wrap`; en anchos muy chicos el botón de envío podría
   comprimir el campo. El campo usa `flex: 1 1 auto` y los botones `.btn` son `white-space:
   nowrap`, por lo que el riesgo es bajo.
2. `admin-usuarios.component.scss` fuerza `min-width: 260px` en inputs; a 390px con el
   padding del layout entran, pero en modales angostos podría necesitar scroll propio.
3. La coherencia de contraste (observación de Fase 6 sobre hovers coral) fue corregida en
   `_base.scss`, pero **no se midió contraste real** en navegador.

## Pruebas NO ejecutadas (S5)

| Prueba | Motivo | Estado |
|--------|--------|--------|
| Capturas de pantalla por rol y resolución (1440×900 y 390×844) | Suspendidas por decisión del usuario | **No ejecutada** |
| Ejecución de `cdp-visual.mjs` / `cdp-probe.mjs` (Chrome/CDP) | Suspendidas por decisión del usuario | **No ejecutada** |
| Verificación visual real de layout, tipografía, imágenes y animaciones | Sin navegador/modelo de visión en el entorno | **No ejecutada** |
| Medición de contraste/`axe`/Lighthouse | Sin navegador | **No ejecutada** |
| Pruebas E2E de navegador (login→flujo real en UI) | Sin navegador | **No ejecutada** |

> `odd/evidencias/fase7/` contiene capturas **previas** a la suspensión. **No fueron
> revisadas ni validadas** y no se usan como evidencia en esta matriz.

## Matriz de aceptación Fase 7

| Criterio | Verificación | Evidencia | Estado |
|----------|--------------|-----------|--------|
| Compila en producción | V1 | `npm run build` exit 0 | **Aceptado** |
| Pruebas frontend completas | V2 | 33/33 | **Aceptado** |
| Pruebas backend completas | V3 | 114/114 | **Aceptado** |
| Migraciones consistentes | V4 | sin cambios pendientes | **Aceptado** |
| Flujos de los tres roles | V5 | Flujos A–E OK | **Aceptado** |
| Responsive por inspección | V6 | revisión de estilos | **Aceptado (inspección, no visual)** |
| Validación visual/pixel real | — | — | **Pendiente / No ejecutada** |
| Contraste y accesibilidad medidos | — | — | **Pendiente / No ejecutada** |

## Estado y próximos pasos

- Cambios de Fase 7 **preservados en el working tree, sin commitear** (no se solicitó commit).
- Cierre funcional: los tres roles quedan cubiertos por pruebas automatizadas en verde.
- Pendiente si el usuario lo decide: commit de los cambios y, en un entorno con navegador,
  la validación visual/accesibilidad que aquí se declara **no ejecutada**.
