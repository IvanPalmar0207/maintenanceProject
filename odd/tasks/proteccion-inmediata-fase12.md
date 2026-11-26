# Fase 12 — Historial inmediato, bloqueo de denuncias completadas y CRUD del foro

Feature: `proteccion-inmediata-fase12`
Repos: `backend/` (Django + DRF + Channels) y `frontEnd/` (Angular).
Punto de partida (Fase 11): backend 227/227, frontend 99/99, build OK.

## Specs

S1. **Historial inmediato**: al cambiar el estado, la respuesta del backend debe incluir el
   seguimiento nuevo, y Angular debe actualizar estado + historial sin recargar. Sin duplicados
   ni solicitudes extra; carga visible; éxito/error notificado; si falla, no mostrar el cambio.

S2. **Denuncia completada = solo lectura**: con `estado = FINALIZADA` se permite consultar detalle,
   caso, historial y mensajes anteriores; se prohíbe cambiar estado, agregar seguimiento, enviar
   mensajes (REST y WebSocket) y acciones de gestión. La restricción se garantiza en Django
   (409 en REST; error por WebSocket). Frontend deshabilita los controles y muestra el aviso
   "Esta denuncia ha sido completada…".

S3. **Foro CRUD para administrador**: crear, consultar, editar y eliminar publicaciones. El backend
   ya expone `ModelViewSet` con `EsAutorOAdministrador`; falta completar la UI de administración
   (crear/editar) reutilizando `ForoService`.

S4. **Regresión**: permisos por rol, privacidad, asignación, chat por asignación, anonimato,
   historial, estados, foro y noticias/pódcast siguen funcionando. Suites, build y migraciones.

## Tasks

| ID | Specs | Ruta | Archivos |
|----|-------|------|----------|
| T1 | S1 | Backend: invalidar caché de prefetch al crear seguimiento (cambiar_estado/asignar) + pruebas | `apps/denuncias/views.py`, tests |
| T2 | S2 | Backend: guardia `FINALIZADA` (409) en cambio de estado, asignación, chat REST y WS + pruebas | `apps/core/exceptions.py`, `apps/denuncias/views.py`, `apps/chat/views.py`, `apps/chat/consumers.py`, tests |
| T3 | S2 | Frontend: chat y detalle profesional en modo lectura al finalizar | `chat-room.component.{ts,html}`, `profesional-denuncia-detail.component.{ts,html}` |
| T4 | S3 | Frontend: crear/editar publicaciones en la administración del foro | `admin/foro/*` |
| T5 | S4 | Verificación final (backend, frontend, build, migraciones) | — |
| T6 | S4 | Informe | este documento |

## Log

L1 (request): pedido íntegro del usuario de tres mejoras (historial inmediato, bloqueo de
completadas, CRUD admin del foro), secciones 1–6 y restricciones.

L2 (línea base): backend 227/227, frontend 99/99, build OK.

L3 (hallazgos):
- **Causa raíz del historial**: `ProfesionalDenunciaViewSet` obtiene la denuncia con
  `prefetch_related("seguimientos")` y crea el seguimiento con `SeguimientoDenuncia.objects.create`,
  que **no invalida el caché de prefetch**; el serializer devuelve entonces `seguimientos` viejos.
  Igual en `AdminDenunciaViewSet.asignar`.
- El foro ya ofrece CRUD completo por API (`PublicacionViewSet` + `EsAutorOAdministrador`); el
  componente admin solo lista y elimina.
- No existe guardia de "completada": `cambiar_estado`, `asignar` y el envío de mensajes (REST/WS)
  operan sin comprobar `FINALIZADA`.

L4 (implementación):
- **S1**: `refrescar_seguimientos(denuncia)` invalida el caché de prefetch tras crear el
  seguimiento, en `cambiar_estado` (profesional) y `asignar` (admin); la respuesta incluye el
  historial fresco y el frontend ya lo aplica con `denuncia.set(denuncia)`.
- **S2**: `apps/core/exceptions.ConflictoDeEstado` (409) + `asegurar_editable(denuncia)` en
  cambio de estado, asignación y envío de mensajes REST; `ChatConsumer.receive_json` responde con
  `{tipo:'error', code:'denuncia_completada'}` sin persistir. Lectura (detalle, historial,
  mensajes) sigue permitida. Frontend: `bloqueada` deshabilita chat y cambio de estado + aviso.
- **S3**: la administración del foro ahora permite crear y editar publicaciones reutilizando
  `ForoService` (`crear`/`actualizar`), con validaciones, notificaciones y recarga del listado;
  el backend ya exponía el CRUD completo.

## Resultados

| Verificación | Resultado |
|--------------|-----------|
| Backend completo | **235/235 OK** |
| Frontend completo | **99/99 OK** (14 archivos) |
| Build producción | **OK** |
| `makemigrations --check` | **Sin cambios pendientes** (no se requirieron migraciones) |

## Limitaciones

1. El historial y el bloqueo se verificaron por pruebas de backend e inspección de código; no se
   ejecutó validación visual (sin navegador/CDP). El frontend se validó con build y pruebas
   unitarias existentes.
2. `marcar_leidos` no se bloqueó en denuncias finalizadas (es una marca de lectura, no una
   interacción de contenido); el envío de mensajes sí está bloqueado.
3. Cambios **sin commitear**; sin push ni deploy.
