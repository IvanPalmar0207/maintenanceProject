# Fase 8 — Correcciones funcionales, permisos por rol, UX y localización colombiana

Feature: `proteccion-inmediata-fase8`
Repos: `backend/` (Django + DRF + Channels) y `frontEnd/` (Angular), repos git independientes.
Punto de partida verificado: backend 114/114, frontend 33/33, build OK, flujos A–E OK.

## Specs

S1. **Navegación del usuario normal**: eliminar el panel lateral del rol USUARIO y reorganizar
   sus opciones en una navegación superior/tarjetas, conservando todas las rutas y
   funcionalidades. "La experiencia debe sentirse sencilla, accesible y orientada al usuario final."

S2. **Centrado de formularios (global)**: auditarlos todos (registro, login, recuperación,
   perfil, denuncias, profesionales, admin de usuarios, noticias, podcasts, foro). "Los
   formularios deben estar centrados respecto al área útil de contenido", con ancho máximo
   apropiado y márgenes automáticos, campos alineados a la izquierda, sin desbordes en móvil.
   "centrar el contenedor no significa centrar todos los campos o textos."

S3. **Perfil del profesional**: acceso desde su navegación, ver/editar sus datos, validación,
   persistencia real y restricción a su propio perfil.

S4. **Perfil del administrador**: acceso desde la navegación administrativa, ver/editar sus
   datos, persistencia y restricción a su propia información, sin confundirlo con la gestión
   de usuarios.

S5. **Acceso del profesional a denuncias**: "El profesional únicamente debe consultar los casos
   que le corresponden o que tiene asignados." No puede consultar, modificar ni descubrir
   denuncias de otros profesionales, ni por manipulación de IDs. La restricción debe estar en
   Django y probada. Se conserva la protección de identidad de las denuncias anónimas.
   Interpretación acordada: "los casos que le corresponden" = casos **disponibles (sin asignar)**
   más los **asignados a él**; se excluyen los asignados a otro profesional.

S6. **Tabla de usuarios**: mostrar el rol real almacenado en el backend (Usuario,
   Profesional, Administrador), sin valores estáticos ni inferencias; conservar filtros,
   acciones y permisos.

S7. **Selector de roles**: rediseño visual (dimensiones, alineación, tipografía, espaciado,
   bordes, estados), coherente con la identidad, usable con mouse, teclado y móvil. Reutilizar
   un componente/estilo global de selectores sin regresiones.

S8. **Administrador sin chat**: sin acceso en su navegación, sin rutas de frontend, endpoints
   de conversaciones/mensajes denegados, WebSocket/Channels denegado, sin historiales y sin
   acceso al contenido de conversaciones en Django Admin. "La protección debe estar garantizada
   en backend, no solamente ocultando el botón."

S9. **Notificaciones por rol**: campanita coherente para los roles con notificaciones, con
   contador de no leídas, listado, marcar una como leída y marcar todas. Aislamiento por
   usuario y rol; sin exponer información ajena; el admin queda fuera de notificaciones de
   chat. "No inventar eventos ni mostrar notificaciones ficticias."

S10. **Localización es-CO**: tuteo colombiano ("Puedes", "Selecciona", "Ingresa", "Guardar"),
   sin voseo ni expresiones argentinas; fechas `dd/MM/yyyy`; formatos numéricos regionales;
   `LOCALE_ID` = `es-CO`. No cambiar nombres técnicos, identificadores, enums ni contratos de API.

S11. **Auditoría de permisos**: los 13 escenarios de la tabla de la sección 7, con pruebas
   backend (y frontend donde corresponda), sin reducir controles existentes.

S12. **Validación final y documentación**: todas las pruebas backend/frontend, build de
   producción, migraciones, permisos por rol, rutas/navegación, responsive por inspección, y
   actualización de esta matriz documentando lo corregido, lo ejecutado y las limitaciones
   (nada visual se marca como realizado si no se ejecutó).

## Tasks

| ID | Specs | Ruta | Archivos principales |
|----|-------|------|----------------------|
| T1 | S5, S11 | Backend: restringir queryset/objeto del profesional a disponibles + propios; pruebas de acceso ajeno por ID | `apps/denuncias/views.py`, `apps/denuncias/tests/test_denuncias.py` |
| T2 | S9 | Backend: notificación real de mensajes al interlocutor (sin admin); pruebas de aislamiento | `apps/chat/views.py`, `apps/chat/consumers.py`, `apps/notificaciones/tests.py` |
| T3 | S1,S3,S4,S8 | Frontend: navegación por rol (sin side-nav de usuario, perfil para prof/admin, sin chat para admin), rutas y guards | `app.html`, `app.ts`, `core/nav/navegacion.ts`, `core/guards/*`, `app.routes.ts`, `nav-bar.*` |
| T4 | S9 | Frontend: página de notificaciones compartida + campanita para todos los roles | `features/notificaciones/*`, `nav-bar.*`, `usuario-dashboard.*` |
| T5 | S6,S7 | Frontend: rol real en la tabla admin + selector global estilizado | `admin-usuarios.*`, `styles/_base.scss` |
| T6 | S2 | Frontend: utilidad global de formulario centrado y aplicación a todos los formularios | `styles/_base.scss`, `*.html` de formularios |
| T7 | S10 | Frontend: barrido es-CO (tuteo, formatos, `LOCALE_ID`) | `app.config.ts`, `*.html`, `*.ts` |
| T8 | S11 | Pruebas backend de los 13 escenarios de permisos | `apps/**/tests/*.py`, `apps/notificaciones/tests.py` |
| T9 | S12 | Verificación final: backend, frontend, build, migraciones, responsive por inspección | — |
| T10 | S12 | Matriz de aceptación Fase 8 + informe | `odd/tasks/proteccion-inmediata-fase8.md` |
| T11 | S5,S8,S11 | Backend: ocultar la identidad del denunciante anónimo en el chat (serializers + WebSocket) y endurecer el admin de conversaciones | `apps/chat/serializers.py`, `apps/chat/consumers.py`, `apps/chat/admin.py`, `apps/chat/tests/*` |

## Log

L1 (Fase 8, request): ver texto íntegro del pedido del usuario aportado en la conversación de
la Fase 8 ("FASE 8 — Correcciones funcionales, permisos por rol, UX y localización colombiana"),
con las secciones 1–8 y las restricciones (no push, no deploy, no commits sin autorización, no
CDP/capturas, no pruebas visuales declaradas sin ejecutar).

L2 (línea base): backend 114/114 OK, frontend 33/33 OK, `npm run build` OK, flujos A–E OK.

L3 (hallazgos de exploración):
- `ProfesionalDenunciaViewSet.get_queryset` devuelve **todas** las denuncias; `mis_denuncias`
  es opt-in. Un profesional puede ver casos de otro. **Vulnerabilidad a corregir.**
- Perfiles: `MiPerfilView` (RetrieveUpdateAPIView) ya es genérico para cualquier rol
  autenticado y resuelve por `request.user`; backend OK. Falta navegación/rutas frontend para
  profesional y administrador.
- Tabla admin: `AdminUsuarioSerializer` incluye `role`, pero el `<select>` usa `[value]` antes
  de que existan sus `<option>` (bug clásico) y no tiene estilos → muestra el primer rol y
  parece control nativo.
- Chat: el backend ya niega admin por participación (`EsParticipanteDeConversacion`, consumer
  4403, `Mensaje` fuera del admin). Falta retirar el enlace/rutas del frontend.
- Notificaciones: backend ya aísla por `request.user` y expone contador/marcar; el frontend
  enlaza la campanita a `/usuario` (ruta solo-USUARIO) y el listado vive embebido en el
  dashboard de usuario. Profesional no recibe notificaciones por eventos reales (solo los
  denunciantes reciben en creación/cambio de estado).
- Localización: 37 coincidencias de voseo/expresiones argentinas; sin `LOCALE_ID`.

L4 (implementación Fase 8): T1–T10 completadas. Backend: queryset del profesional restringido a disponibles + propios y mismo criterio en la apertura de conversaciones; notificación real de mensajes al interlocutor (excluye admin); perfil ya soportaba todos los roles; voseo del backend corregido. Frontend: panel lateral solo para profesional/admin; perfiles para profesional/admin; chat fuera de navegación y rutas del admin; campanita y página de notificaciones compartidas; rol real en la tabla admin y selector global estilizado; utilidad `.form-page` aplicada; localización es-CO con `LOCALE_ID`.

## Matriz de aceptación — Fase 8

### Correcciones por sección del pedido

| Sección | Problema | Corrección | Archivos |
|---------|----------|------------|----------|
| 1.1 | Panel lateral del usuario normal | `App.mostrarSideNav` solo profesional/admin; navegación superior + tarjetas del dashboard | `app.ts`, `navegacion.ts` |
| 1.2 y 6 | Formularios desplazados a la izquierda | Utilidad `.form-page`/`.form-page--wide` aplicada a perfil, denuncias, admin y foro | `_base.scss`, `*.html` |
| 2.1 | Profesional sin perfil | Ruta `/profesional/perfil` + enlace de navegación reutilizando `PerfilComponent` | `app.routes.ts`, `navegacion.ts` |
| 2.2 | Profesional veía todas las denuncias | Queryset `disponibles + propias`; ajenas invisibles (404) en list, detail, asignarme, cambiar_estado y apertura de chat | `denuncias/views.py`, `chat/views.py` |
| 3.1 | Administrador sin perfil | Ruta `/admin/perfil` + enlace de navegación | `app.routes.ts`, `navegacion.ts` |
| 3.2 | Rol incorrecto en la tabla de usuarios | `[selected]` por opción (el `[value]` previo se aplicaba antes de existir las opciones) | `admin-usuarios.component.html` |
| 3.3 | Selector nativo sin estilos | `select`/`.select` global con flecha propia, foco, hover y variante `--sm` | `_base.scss` |
| 3.4 | Administrador con acceso al chat | Sin enlace ni rutas de chat; backend ya niega por participación (REST 403, WS 4403, `Mensaje` fuera del admin) | `nav-bar.component.html`, `app.routes.ts`, verificado en backend |
| 4 | Campanita solo útil para usuario | Página `/notificaciones` compartida + campanita para todos los roles; notificación real de mensajes al interlocutor | `features/notificaciones/*`, `nav-bar.*`, `usuario-dashboard.*`, `notificaciones/services.py`, `chat/*` |
| 5 | Español argentino | Barrido de voseo a tuteo (frontend y backend) y `LOCALE_ID` `es-CO` | múltiples `.html`/`.ts`, `app.config.ts`, backend `usuarios/*` |
| 7 | Auditoría de permisos | `apps/core/tests/test_permisos_fase8.py` (13 escenarios) + pruebas de denuncias/chat/notificaciones | backend tests |
| 8 | Validación final | Backend, frontend, build, migraciones y responsive por inspección | — |

### Auditoría de permisos (13 escenarios) — todos verificados

| # | Escenario | Resultado | Prueba |
|---|-----------|-----------|--------|
| 1 | Usuario consulta su perfil | Permitido (200) | `test_permisos_fase8.PerfilPermisosTests` |
| 2 | Usuario intenta modificar otro perfil | Denegado (sin ruta por id; solo cambia el propio) | idem |
| 3 | Profesional consulta su perfil | Permitido (200) | idem |
| 4 | Profesional intenta modificar otro perfil | Denegado (solo cambia el propio) | idem |
| 5 | Profesional consulta sus casos asignados | Permitido (200) | `DenunciaProfesionalPermisosTests` |
| 6 | Profesional consulta casos ajenos | Denegado (lista 0 / detalle 404) | idem |
| 7 | Administrador consulta su perfil | Permitido (200) | `PerfilPermisosTests` |
| 8 | Administrador modifica su perfil | Permitido (200; el rol no se puede cambiar) | idem |
| 9 | Administrador intenta acceder al chat | Denegado (lista 0 / 403 en detalle, mensajes y apertura) | `ChatAdministradorPermisosTests` |
| 10 | Usuario consulta notificaciones propias | Permitido (200) | `NotificacionPermisosTests` |
| 11 | Profesional consulta notificaciones propias | Permitido (200) | idem |
| 12 | Usuario intenta consultar notificaciones ajenas | Denegado (lista 0 / detalle 404) | idem |
| 13 | Profesional intenta consultar notificaciones ajenas | Denegado (lista 0 / detalle 404) | idem |

### Validación final (section 8)

| Verificación | Comando | Resultado |
|--------------|---------|-----------|
| Backend completo | `.venv/Scripts/python.exe manage.py test apps` | **146/146 OK** |
| Frontend completo | `npx ng test --watch=false` | **36/36 OK** (7 archivos) |
| Build producción | `npm run build` | **OK** (exit 0) |
| Migraciones | `makemigrations --check --dry-run` | **Sin cambios pendientes** |
| Responsive | Inspección de `*.scss` | Revisado (no visual) |

### Pruebas nuevas

- `backend/apps/core/tests/test_permisos_fase8.py`: 13 escenarios transversales.
- `backend/apps/denuncias/tests/test_denuncias.py`: `ProfesionalCasosTests` (7 pruebas) + ajuste 403→404 en caso ajeno.
- `backend/apps/chat/tests/test_rest.py`: 5 pruebas de apertura de conversación y 3 de anonimato en el chat.
- `backend/apps/notificaciones/tests.py`: 7 pruebas de aislamiento y notificación de mensajes.
- `frontend/src/app/core/nav/navegacion.spec.ts`: 3 pruebas de navegación por rol.

### Pruebas NO ejecutadas (limitaciones)

| Prueba | Motivo | Estado |
|--------|--------|--------|
| Validación visual real (navegador) | Sin navegador; CDP/capturas suspendidos por el usuario | **No ejecutada** |
| Verificación manual responsive en dispositivos | Sin navegador | **No ejecutada** |
| Pruebas E2E de UI | Sin navegador | **No ejecutada** |
| Medición de contraste/axe/Lighthouse | Sin navegador | **No ejecutada** |

### Observaciones pendientes

1. La notificación de chat se crea por cada mensaje recibido; si resultara ruidosa, puede agruparse por conversación.
2. El administrador no tiene eventos administrativos propios en el sistema actual; su bandeja mostrará el estado vacío (no se inventaron eventos ficticios).
3. El centrado se validó por inspección de estilos; falta confirmación visual real.
4. Cambios **sin commitear** (no se autorizó commit).

## Estado final

Funcionalidad y seguridad corregidas y probadas (backend 146/146, frontend 36/36, build OK, migraciones al día). Validación visual pendiente en un entorno con navegador; reportada explícitamente como no ejecutada.

## Adenda — hallazgo de la verificación independiente (T11)

La verificación independiente (`gentle-ai-verify`) confirmó los 6 puntos de permisos y **encontró un hueco de fuga de identidad preexistente** en el chat: un profesional asignado a una denuncia `ANONIMA` veía el `nombre_completo` real del denunciante a través de `participantes`, `ultimo_mensaje.remitente_nombre` y el remitente de los mensajes, pese a que el serializer de denuncias sí lo ocultaba (`solicitante: None`).

Corrección aplicada (S5/S8):
- `apps/chat/serializers.py`: `participantes`, `ultimo_mensaje` y `MensajeSerializer.remitente` renderizan "Denunciante anónimo" para todo espectador distinto del propio denunciante; el denunciante sigue viendo su nombre.
- `apps/chat/consumers.py`: el payload del broadcast conserva el nombre real solo en el servidor; cada conexión enmascara antes de entregar, según su propio usuario.
- `apps/chat/admin.py`: `participantes` pasa a solo lectura (se elimina `filter_horizontal`), para que un superusuario de Django no pueda autoincorporarse a una conversación.

Pruebas añadidas:
- `apps/chat/tests/test_rest.py`: 3 pruebas (conversación, mensajes y nombre propio del dueño).
- `apps/chat/tests/test_websocket.py`: el profesional recibe el nombre enmascarado y el dueño su propio nombre.

Resultado: backend **146/146 OK**; el escenario de anonimato quedó cubierto en REST y WebSocket.
