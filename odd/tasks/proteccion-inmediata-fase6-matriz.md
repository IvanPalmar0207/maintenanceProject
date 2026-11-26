# Matriz de trazabilidad — Fase 6 (validación funcional)

Alcance: las 8 historias de usuario originales. Estados: **Implementada y validada (IV)**,
**Implementada con observaciones (IO)**, **Parcial (P)**, **No implementada (NI)**,
**Bloqueada (B)**.

| HU | Funcionalidad | Rol | Criterios de aceptación | Pruebas ejecutadas (evidencia) | Resultado | Errores encontrados | Correcciones | Estado |
|----|---------------|-----|-------------------------|-------------------------------|-----------|---------------------|--------------|--------|
| HU-01 | Registro e inicio de sesión | Público | Alta; campos obligatorios; formato email; duplicados; contraseña segura; login; mensaje de credenciales; persistencia/renovación de sesión; redirección por rol; rutas protegidas; logout; no escalar rol | `usuarios/tests/test_auth.py` (10), `test_password_reset.py` (16), `core/tests/test_flujos_integracion.py::FlujoE_Permisos`, frontend `core.spec.ts` (login, `inicializar`, interceptor, guard) | OK | Al recargar una ruta privada con token válido, el guard redirigía a `/login` (hidratación asíncrona) | App initializer `provideAppInitializer(() => AuthService.inicializar())` + `inicializar(): Promise<void>` | **IV** |
| HU-02 | Perfil propio | Usuario | Ver/editar propio; validaciones; guardado; confirmación; no acceder a perfiles ajenos; no cambiar rol/datos sensibles | `perfiles/tests/test_perfil.py` (6), `FlujoE_Permisos` | OK | — | — | **IV** |
| HU-03 | Denuncias públicas/anónimas | Usuario | Modalidad; validaciones; persistencia; identificador; confirmación; asociación interna; anonimato real | `denuncias/tests/test_denuncias.py` (creación + AnonimatoTests), `FlujoA`, `FlujoB`, `denuncias/tests/test_admin.py` (2) | OK | El admin de Django exponía `denunciante` y el `autor` del seguimiento (identidad) | `DenunciaAdmin.exclude=("denunciante",)`, `has_add_permission=False`; `SeguimientoInline` sin `autor` y de solo lectura | **IV** |
| HU-04 | Consulta y seguimiento | Usuario | Listado propio; identificador; fecha; modalidad; estado; detalle; actualización tras cambio de estado; aislamiento | `test_denuncias.py::DenunciaAislamientoTests`, `FlujoA` | OK | El label de estado final es "Finalizada" (la Fase 6 lo nombra "Completada") | — (decisión de nomenclatura para el usuario) | **IO** |
| HU-05 | Gestión/atención profesional | Profesional | Acceso exclusivo; casos disponibles/asignados; datos permitidos; distinguir modalidad; cambiar estado; persistir; ver el usuario; no acceder a casos ajenos | `test_denuncias.py::DenunciaEstadoTests`, `AnonimatoTests`, `FlujoA`, `FlujoB`, `FlujoE_Permisos` | OK | — | — | **IV** |
| HU-06 | Chat privado | Usuario/Profesional | Acceso por rol; abrir conversación; enviar/recibir; remitente; hora; persistencia; tiempo real (WS); historial; acceso restringido; pérdida de conexión/reconexión; admin sin acceso | `chat/tests/test_rest.py` (11), `test_websocket.py` (3), `FlujoC` | OK | Al reconectar no se recargaba el historial | `ChatRoomComponent` recarga el historial al reconectar (`effect` sobre `estadoConexion`) | **IV** |
| HU-07 | Noticias, pódcast y foro (consulta) | Usuario | Noticias publicadas (no borradores); detalle; pódcast publicados con plataforma/enlace; HTTPS; sin portada; foro: ver/crear/responder validado | `noticias/tests`, `podcasts/tests` (10), `foro/tests` (7), `FlujoD` | OK | — | — | **IV** |
| HU-08 | Administración de contenidos | Administrador | Noticias CRUD + publicar/despublicar + imágenes; pódcast por enlaces (URL https obligatoria) + portada; foro moderar; sin acceso a chats ni identidad anónima | `noticias/tests` (11), `podcasts/tests` (10), `foro/tests` (7), `FlujoD`, `FlujoE_Permisos` | OK | — | — | **IV** |

## Flujos completos verificados
- **A** (anónimo): registro → login → perfil → alta anónima → consulta propia → profesional ve modalidad y `solicitante=null` → asignación → cambio de estado → usuario ve el estado. **Sin fugas de identidad.**
- **B** (público): alta pública → profesional ve contacto operativo → cambio de estado → usuario ve el seguimiento.
- **C** (chat): el dueño abre la conversación; un no participante recibe 403; el profesional se une al abrir el caso, lee y responde; el dueño ve 2 mensajes; tercero y admin sin acceso.
- **D** (contenidos): admin crea noticia con imagen y la ve el público; al despublicar deja de ser alcanzable; pódcast rechaza `http://` y acepta `https://`; el admin modera el foro.
- **E** (permisos): accesos cruzados 403; rol manipulado en registro ignorado; `role` en perfil ignorado; aislamiento y manipulación de ids (404).

## Seguridad (negativos)
- Acceso horizontal (denuncias/perfiles/conversaciones ajenas): bloqueado.
- Escalamiento vertical (rol en registro/perfil/admin): bloqueado.
- Exposición de identidad en denuncias anónimas (API y **admin de Django**): bloqueado.
- Mensajes privados (API y admin): bloqueado; `Mensaje` no registrado en el admin.
- Validación de entradas (URLs https, imágenes, contraseñas): backend.

## Observaciones abiertas (no bloqueantes)
1. **Nomenclatura de estado final**: valor `FINALIZADA`, etiqueta "Finalizada" (Fase 1) vs "Completada" (Fase 6). Requiere decisión del usuario.
2. **Renovación de sesión**: existe `/api/auth/refresh/`, pero el cliente no refresca automáticamente ante un 401; la sesión se cierra y se redirige a login.
3. **Reconexión del chat**: un único reintento; al reconectar se recarga el historial (corregido).
4. **Admin de usuarios** muestra teléfono/documento de las cuentas (propio de la gestión de usuarios); no expone identidad de denuncias anónimas.
5. **Sin navegador/visión** en el entorno: la validación visual y de resoluciones no se pudo ejecutar (se reporta como no ejecutada).
