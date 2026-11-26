# Fase 11 — Denuncias: fecha de sucesos, asignación automática y seguridad del chat

Feature: `proteccion-inmediata-fase11`
Repos: `backend/` (Django + DRF + Channels) y `frontEnd/` (Angular).
Punto de partida (Fase 12 anterior): backend 198/198, frontend 92/92, build OK.

## Specs

S1. **Fecha de los sucesos ≠ futura**: en creación/edición de denuncia, `fecha_hechos <= hoy`.
   Angular: `[max]=hoy`, validación reactiva y mensaje "La fecha de los sucesos no puede ser
   posterior al día de hoy". Django: validador con `timezone.localdate()`, aplicado al modelo
   (cubre serializer y Django admin); no confundir con `creado_en`.

S2. **Asignación automática al crear**: elegir un profesional activo con rol PROFESIONAL, el de
   **menos casos activos**, desempate determinista por `id`; transaccional y seguro ante
   concurrencia. Nunca desde Angular. Si no hay profesionales, la denuncia se registra sin
   asignar y queda pendiente.

S3. **Trazabilidad**: registrar en `SeguimientoDenuncia` (estructura existente) la asignación
   automática (autor `Sistema`), la manual (autor = administrador) y los cambios de profesional;
   fecha/hora = `creado_en`.

S4. **Tabla del profesional estricta**: el endpoint del profesional devuelve **solo** las
   denuncias con `profesional_asignado = request.user`. Sin casos de otros profesionales, sin
   pendientes de asignación; filtros, búsqueda y paginación sobre ese subconjunto; detalle,
   cambio de estado y seguimiento igual. Sin autoasignación (`asignarme`).

S5. **Chat solo dueño + profesional asignado** (REST): lista, detalle, participantes, historial,
   envío, marcado de leídos y apertura comprueban que el usuario sea el `denunciante` o el
   `profesional_asignado` actual. Administrador siempre denegado. Denuncia sin asignar: ningún
   profesional abre el chat (el dueño sí).

S6. **Chat WebSocket**: misma comprobación al conectar, al recibir y **al entregar** cada
   mensaje, para que un cambio de asignación revoque de inmediato la entrega al profesional
   anterior. El nuevo profesional obtiene acceso; el dueño lo conserva; historial intacto.

S7. **Interfaz**: usuario no elige profesional; profesional ve solo sus casos (estado vacío
   "No tienes casos asignados actualmente") y pierde el botón de autoasignación; administrador
   puede listar casos, ver pendientes y asignar/reasignar profesional.

S8. **Privacidad**: administrador no lee chats; identidad anónima protegida en REST y WS.

S9. **Pruebas**: flujos A–H (asignación, chat, profesional no asignado, cambio de profesional,
   sin profesionales, privacidad, tabla individual, fechas) + suites y build.

## Tasks

| ID | Specs | Ruta | Archivos |
|----|-------|------|----------|
| T1 | S1 | Backend: validador `fecha_hechos` + migración + pruebas | `apps/core/validators.py`, `apps/denuncias/models.py`, migración, tests |
| T2 | S2,S3 | Backend: servicio de asignación automática + integración en creación + pruebas | `apps/denuncias/services.py`, `apps/denuncias/views.py`, tests |
| T3 | S4 | Backend: queryset profesional estricto; quitar `asignarme`; cambio de estado solo propio | `apps/denuncias/views.py`, tests |
| T4 | S7 | Backend: endpoint admin de asignación/reasignación y listado | `apps/denuncias/views.py`, `apps/denuncias/urls.py`, tests |
| T5 | S5,S8 | Backend: permisos y endpoints de chat REST | `apps/chat/models.py`, `permissions.py`, `views.py`, `serializers.py`, tests |
| T6 | S6,S8 | Backend: consumer WebSocket re-verifica en connect/receive/entrega | `apps/chat/consumers.py`, tests |
| T7 | S1 | Frontend: `[max]` + validador en denuncia-create | `denuncia-create.component.{ts,html}`, validador |
| T8 | S4,S7 | Frontend: tabla profesional solo asignados + estado vacío; quitar autoasignación | `profesional-denuncias.*`, `profesional-denuncia-detail.*`, `denuncia.service.ts` |
| T9 | S7 | Frontend: página admin de casos con asignación/reasignación | `admin/denuncias/*`, rutas, navegación |
| T10 | S9 | Pruebas de integración A–H + verificación final | — |
| T11 | S9 | Informe | este documento |

## Log

L1 (request): pedido íntegro del usuario de corrección integral (fecha de sucesos, asignación
automática, tabla del profesional y seguridad del chat), secciones 1–8 y restricciones.

L2 (línea base): backend 198/198, frontend 92/92, build OK.

L3 (hallazgos):
- `ProfesionalDenunciaViewSet.get_queryset` incluye **disponibles (sin asignar) + propias**;
  existe `asignarme` (autoasignación por el profesional) y `cambiar_estado` tolera casos sin
  asignar. Debe pasar a **solo asignadas**.
- La creación no asigna profesional; no hay servicio de asignación.
- El chat autoriza por **participación M2M** (`EsParticipanteDeConversacion`), no por
  asignación actual; un profesional no asignado podría quedar como participante y conservar
  acceso tras una reasignación. Autorización y participantes deben calcularse desde
  `denunciante` + `profesional_asignado` actual.
- No existe endpoint de administración para asignar/reasignar (solo el Django admin).
- `fecha_hechos` no tiene validación de futuro.

L4 (implementación):
- **S1**: `validar_fecha_sucesos` (usar `timezone.localdate()`) adjunto a `Denuncia.fecha_hechos`
  (+ migración `denuncias/0003`), aplicable a serializer y Django admin. Angular: `[max]="hoy"`
  + `fechaSucesosValidator()` + mensaje.
- **S2/S3**: `apps/denuncias/services.py` con `profesionales_habilitados()` (activos, PROFESIONAL,
  contados por casos activos, orden `casos_activos, id`) y `asignar_profesional_automatico()`
  transaccional (bloqueo de filas cuando el backend lo soporta). Integrado en `DenunciaViewSet.create`;
  si no hay profesionales, queda sin asignar y se registra "Pendiente de asignación".
  Trazabilidad en `SeguimientoDenuncia` (autor `None` = Sistema en automática; admin en manual).
- **S4**: `ProfesionalDenunciaViewSet` filtra `profesional_asignado=request.user`; se eliminó
  `asignarme`; `cambiar_estado` solo sobre casos propios (404 en ajenos).
- **S5/S6**: `Conversacion.acceso_permitido` = denunciante o asignado actual (admin denegado);
  `permissions`, listado, apertura y **consumer WebSocket** (connect, receive y entrega) la usan;
  `participantes` del serializer se calculan desde la denuncia (no del M2M).
- **S7**: frontend — tabla del profesional solo asignados + estado vacío; autoasignación eliminada;
  nueva página admin de casos con asignación/reasignación; fecha máxima en creación de denuncia.

## Flujos A–H (cobertura de pruebas)

| Flujo | Cobertura |
|-------|-----------|
| A — registro y asignación automática | `test_asignacion.AsignacionAutomaticaTests` |
| B — acceso al chat | `chat/test_rest.py`, `test_websocket.py` |
| C — profesional no asignado | `test_asignacion.ProfesionalTablaEstrictaTests`, `chat/test_reasignacion.py`, `test_websocket.py` |
| D — cambio de profesional | `chat/test_reasignacion.py`, `test_websocket.test_reassignment_revokes_the_previous_professional` |
| E — sin profesionales | `test_asignacion.test_sin_profesionales_queda_pendiente` + admin asigna |
| F — privacidad | `denuncias/AnonimatoTests`, `chat` admin denial, `test_permisos_fase8` |
| G — tabla individual | `test_asignacion.ProfesionalTablaEstrictaTests` (incluye filtros) |
| H — fechas de sucesos | `denuncias/test_fecha_hechos.py` |

## Resultados

| Verificación | Resultado |
|--------------|-----------|
| Backend completo | **227/227 OK** |
| Frontend completo | **99/99 OK** (14 archivos) |
| Build producción | **OK** |
| `makemigrations --check` | **Sin cambios pendientes** |
| Datos existentes | 4 denuncias, todas asignadas; sin conflictos |
| Verificación independiente | 4/4 objetivos confirmados; 2 avisos cerrados |

### Adenda — verificación independiente

`gentle-ai-verify` ejecutó 27 sondas aisladas y confirmó S1–S8 sin bloqueantes. Cerró dos avisos:
(1) el anonimato del WebSocket se recalculaba solo al conectar → ahora `chat_message` recalcula
`_datos_denuncia()` en cada entrega, con prueba de cambio de modalidad en socket abierto;
(2) `ConversacionViewSet.create` no denegaba explícitamente al administrador → se agregó la
comprobación, con prueba de regresión. Re-ejecución: backend **227/227 OK**.

## Limitaciones

1. La validación visual no se ejecutó (sin navegador/CDP); el comportamiento se verificó por
   pruebas automatizadas (backend/unitarias) e inspección de estilos.
2. El bloqueo `select_for_update` solo se aplica en backends que lo soportan (PostgreSQL); en
   SQLite (pruebas) la serialización la da el propio motor.
3. Cambios **sin commitear** (no autorizado); sin push ni deploy.
