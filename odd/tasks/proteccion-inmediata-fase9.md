# Fase 9 — Refinamiento de foro, perfiles, administración y filtros

Feature: `proteccion-inmediata-fase9`
Repos: `backend/` (Django + DRF) y `frontEnd/` (Angular), repos git independientes.
Punto de partida verificado (Fase 8): backend 146/146, frontend 36/36, build OK, migraciones al día.

## Specs

S1. **Foro centrado**: centrar el contenedor principal del foro, con ancho máximo apropiado,
   márgenes equilibrados y distribución consistente de encabezado, descripción, filtros,
   publicaciones, formularios y acciones, sin centrar indiscriminadamente los textos internos.
   Conservar identidad visual, funcionalidades y responsive.

S2. **Documento inmutable en el perfil**: mostrar el documento, solo lectura, visualmente
   atenuado, sin permitir escritura ni pegado, para todos los roles. Aplicar el mismo criterio
   a todo campo inmutable (p. ej. correo). Distinguir visualmente editables vs. inmutables sin
   depender solo del color.

S3. **Protección backend del documento**: impedir modificarlo por PATCH/PUT, sin aceptarlo
   silenciosamente; mantener la validación del modelo. Pruebas de solicitud directa.

S4. **Administración de usuarios**: excluir al administrador autenticado de su propia lista;
   conservar el resto de usuarios, roles, filtros y paginación; su perfil sigue accesible.
   En backend, impedir que el administrador cambie su propio `is_active` (comparar identidad
   autenticada, no el ID enviado), con pruebas de solicitud directa.

S5. **Formulario admin de noticias centrado**: contenedor principal centrado, ancho máximo
   apropiado, encabezado y acciones correctos, responsive. Creación y edición. No cambiar
   campos ni contratos.

S6. **Formulario admin de pódcast centrado**: mismos criterios; conservar enlaces externos
   HTTPS y sin carga de audio ni reproductores.

S7. **Filtros inmediatos en noticias y pódcast**: la búsqueda y el filtro de estado de
   publicación actualizan los resultados automáticamente, sin botón extra. Cancelar
   solicitudes anteriores (`switchMap`), evitar duplicados y respuestas obsoletas, respetar
   filtros combinados y paginación. Debounce reducido/eliminado.

S8. **Pruebas**: perfil (documento mostrado, no editable, rechazo por solicitud directa,
   resto de campos editable), admin (autoexclusión, auto-desactivación bloqueada, perfil
   propio operativo), foro/formularios (funcionalidad y centrado por inspección), filtros
   (búsqueda automática, filtros, limpiar, sin sobrescritura obsoleta, sin duplicados).

S9. **Validación final y documentación**: suites completas, build, migraciones, pruebas de
   seguridad, y este documento actualizado con problemas, soluciones, archivos, pruebas,
   resultados y limitaciones. Nada visual se declara ejecutado si no se ejecutó.

## Tasks

| ID | Specs | Ruta | Archivos principales |
|----|-------|------|----------------------|
| T1 | S2,S3,S8 | Backend: `documento` inmutable en `PerfilSerializer` + pruebas | `apps/perfiles/serializers.py`, `apps/perfiles/tests/test_perfil.py` |
| T2 | S4,S8 | Backend: excluir admin de la lista y bloquear auto-desactivación + pruebas | `apps/usuarios/views.py`, `apps/usuarios/tests/test_admin_usuarios.py` |
| T3 | S7,S8 | Backend: filtro `publicado` en noticias y podcasts + pruebas | `apps/noticias/views.py`, `apps/podcasts/views.py`, tests |
| T4 | S2 | Frontend: documento/correo inmutables en perfil + estilo global de campos inmutables | `perfil.component.html`, `styles/_base.scss` |
| T5 | S1 | Frontend: centrar contenedor del foro (lista y detalle) | `foro-list.*`, `foro-detail.*` |
| T6 | S5,S6 | Frontend: centrar páginas admin de noticias y pódcast | `admin-noticias.component.html`, `admin-podcasts.component.html` |
| T7 | S7 | Frontend: filtros reactivos inmediatos con `switchMap` y servicio con `publicado` | `admin-noticias.*`, `admin-podcasts.*`, `noticia.service.ts`, `podcast.service.ts` |
| T8 | S8 | Frontend: pruebas de filtros | `admin-contenido.filtros.spec.ts` (o equivalente) |
| T9 | S9 | Verificación final | — |
| T10 | S9 | Matriz/informe Fase 9 | `odd/tasks/proteccion-inmediata-fase9.md` |

## Log

L1 (Fase 9, request): pedido íntegro del usuario "FASE 9 — Refinamiento de foro, perfiles,
administración y filtros", secciones 1–9 y restricciones (sin CDP/capturas, sin reconstruir,
sin revertir, sin push/deploy, sin commits sin autorización, sin debilitar permisos).

L2 (línea base): backend 146/146, frontend 36/36, build OK, migraciones sin cambios.

L3 (hallazgos de exploración):
- Foro: `foro-detail` usa `.publicacion`, `.respuestas`, `.responder` con `max-width: 820px`
  **sin** `margin-inline: auto` → contenido pegado a la izquierda; `foro-list` usa `.container`
  (1180) sin columna centrada propia.
- Perfil: `PerfilSerializer` expone `documento` como editable (`read_only_fields` no lo
  incluye); el formulario lo muestra como input normal. El modelo define `documento` como
  `blank=True` y **sin unique** (discrepancia con el pedido, se documenta como observación).
- Admin usuarios: `AdminUsuarioViewSet.get_queryset` devuelve todos (incluido el propio admin)
  y `AdminUsuarioSerializer` permite cambiar `is_active` en cualquier caso.
- Admin noticias/pódcast: la `<section class="container stack">` es 1180 y el `<form>` tiene
  `.form-page--wide` + regla local `form { max-width: 980px }` sin centrado explícito del
  encabezado; el filtro de estado de publicación **no existe** ni en UI ni en backend. La
  búsqueda usa `debounceTime(350)` y `subscribe` directo (sin cancelar peticiones previas).
- `NoticiaViewSet`/`PodcastViewSet` soportan `search` (y noticias `categoria`/`destacada`),
  pero no `publicado`.

L4 (implementación Fase 9): T1–T8 completadas. Perfil: `documento` inmutable en backend
(rechazo explícito 400, no silencioso) y en UI (readonly + estilo atenuado); admin de usuarios:
autoexclusión de la lista y bloqueo de auto-desactivación verificado por identidad; filtro
`publicado` en noticias/pódcast; foro y páginas admin centradas con `form-page--wide`;
filtros reactivos con `switchMap`, debounce 150 ms y filtro de estado en la UI.

## Matriz de aceptación — Fase 9

### Correcciones por sección

| Sección | Problema | Corrección | Archivos |
|---------|----------|------------|----------|
| 1 | Foro pegado a la izquierda (`.publicacion`/`.respuestas`/`.responder` con `max-width` sin centrado) | Contenedor `form-page--wide` en lista y detalle + `margin-inline: auto` en los bloques internos | `foro-list.component.html`, `foro-detail.component.{html,scss}` |
| 2 | Documento editable en el perfil | Backend `documento` read-only; UI `readonly` + `field--inmutable`; correo también inmutable | `apps/perfiles/serializers.py`, `perfil.component.{html,ts}`, `styles/_base.scss` |
| 3 | El admin aparecía en su propia lista y podía desactivarse | `get_queryset` excluye `request.user` en `list`; `update` bloquea cambios de `is_active` sobre la propia cuenta | `apps/usuarios/views.py` |
| 4 | Formulario admin de noticias a la izquierda | `<section>` con `form-page--wide` (encabezado + formulario + tabla centrados) | `admin-noticias.component.html` |
| 5 | Formulario admin de pódcast a la izquierda | idem | `admin-podcasts.component.html` |
| 6 | Búsqueda con pausa y sin cancelar peticiones; sin filtro de publicación | `switchMap` + debounce 150 ms; filtro de estado (`Todas/Publicadas/Borradores`) y param `publicado` en backend/servicio | `admin-noticias.component.{ts,html}`, `admin-podcasts.component.{ts,html}`, `noticia.service.ts`, `podcast.service.ts`, `apps/noticias/views.py`, `apps/podcasts/views.py` |
| 7 y 9 | Pruebas y validación final | Suites y build en verde | ver abajo |

### Pruebas ejecutadas y resultados

| Verificación | Comando | Resultado |
|--------------|---------|-----------|
| Backend completo | `.venv/Scripts/python.exe manage.py test apps` | **161/161 OK** |
| Frontend completo | `npx ng test --watch=false` | **43/43 OK** (8 archivos) |
| Build producción | `npm run build` | **OK** (exit 0) |
| Migraciones | `makemigrations --check --dry-run` | **Sin cambios pendientes** |
| Anonimato/permisos (Fase 8) | `apps/core/tests/test_permisos_fase8.py` | **13/13 OK** (sin regresiones) |

### Pruebas nuevas

- `apps/perfiles/tests/test_perfil.py`: 5 pruebas (documento visible, rechazo PATCH, rechazo PUT,
  reenvío sin cambio permitido, mismo criterio para profesional).
- `apps/usuarios/tests/test_admin_usuarios.py`: 5 pruebas (autoexclusión de lista, búsqueda sin
  el propio admin, auto-desactivación bloqueada, cambio de estado propio bloqueado, documento
  inmutable por el endpoint administrativo, perfil propio).
- `apps/noticias/tests/test_noticias.py` y `apps/podcasts/tests/test_podcasts.py`: 2 pruebas cada uno
  (filtro `publicado` para admin, ignorado para público).
- `frontend/src/app/features/admin/admin-filtros.spec.ts`: 7 pruebas (búsqueda automática, filtro
  de estado y reinicio de página, limpiar búsqueda, cancelación de respuesta obsoleta,
  sin duplicados, combinación búsqueda+estado, en noticias y pódcast).

### Observaciones pendientes

1. El modelo define `documento` como `blank=True` y **sin `unique`**; el pedido lo describe como
   "único y obligatorio". No se endureció el modelo para no introducir una migración con riesgo
   sobre datos existentes (posibles vacíos/duplicados). Queda como decisión del usuario si se
   debe pasar a `unique=True, blank=False` con su migración.
2. Validación visual real del centrado (foro, noticias, pódcast) **no ejecutada**: sin navegador;
   se validó por inspección de estilos y `form-page--wide`/`margin-inline:auto`.
3. Persisten cambios **sin commitear** (no se autorizó commit); sin push ni deploy.

## Estado final

Foro y formularios administrativos centrados por inspección, identidad inmutable (perfil),
autoexclusión y auto-protección del administrador, y filtros inmediatos sin respuestas obsoletas.
Backend 161/161, frontend 43/43, build OK, migraciones al día. Validación visual de navegador
no ejecutada.

### Adenda — verificación independiente

`gentle-ai-verify` ejecutó 22+17 sondas aisladas y confirmó los 5 puntos (documento inmutable sin
bypass; autoexclusión y auto-protección del admin con identidad del servidor; filtro `publicado`
sin exponer borradores; sin regresión de anonimato/permisos de Fase 8; frontend por inspección).

Encontró una vía en alcance: `AdminUsuarioSerializer` mantenía `documento` editable, permitiendo
a un administrador cambiarlo (propio o de terceros) por el endpoint administrativo. Se cerró:
`documento` pasó a solo lectura con rechazo explícito (400) también allí, y se añadió la prueba
`test_admin_cannot_change_document_through_admin_endpoint`. Reprueba: backend **161/161 OK**, sin
disminuir ningún control.
