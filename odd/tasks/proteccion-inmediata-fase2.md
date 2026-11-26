# Protección Inmediata SC — Fase 2: rediseño visual + cierre de limitaciones

Feature: `proteccion-inmediata-fase2`
Base: MVP de la Fase 1 (`odd/tasks/proteccion-inmediata-mvp.md`). Se trabaja sobre el código existente; no se reconstruye ni se eliminan funcionalidades.
Repos: `backend/` y `frontEnd/` (independientes). Sin push sin autorización.

## Specs

F2-S1. **No regresiones**: conservar arquitectura, permisos, validaciones, separación de archivos `.ts/.html/.scss` por componente y apps Django por dominio. Nada de datos estáticos fingiendo funcionalidad ni botones decorativos. Todas las restricciones siguen en Django.

F2-S2. **Identidad visual** (paleta obligatoria de Fase 1): principal `#ff5657`, blanco `#ffffff`, gris `#d9d9d8`, coral `#ff8f8f`, rosa claro `#ffcaca`. Se admiten derivados para estados/sombras. Estilo: minimalista y editorial, glassmorphism moderado, bordes consistentes, sombras suaves, tipografía jerarquizada, espaciado generoso, iconografía coherente, fotografía/ilustración, microinteracciones, responsive real. Evitar apariencia de plantilla genérica, saturación, gradientes exagerados, iconos mezclados, textos diminutos.

F2-S3. **Recursos visuales**: ilustraciones SVG **originales** con la paleta, almacenadas localmente (decisión del usuario, sin red ni atribución de terceros). Tipografía self-host con `@fontsource` (decisión del usuario).

F2-S4. **Landing**: hero profesional con propósito, CTA (registro/login/recursos), sección de beneficios, proceso de atención, noticias y recursos destacados, acceso a pódcast y foro, privacidad/confidencialidad, footer completo.

F2-S5. **Autenticación**: rediseño de login y registro con validaciones visuales, estados de carga y mensajes claros; recuperación de contraseña.

F2-S6. **Dashboards por rol**: usuario (bienvenida, resumen de denuncias y estados, alta rápida, historial/seguimiento, chat, noticias recomendadas, perfil); profesional (resumen de casos asignados, pendientes/en proceso, indicadores, listado con filtros, detalle autorizado, chat, actualización de estados); administrador (navegación lateral, indicadores, gestión de usuarios/noticias/pódcast/foro, formularios, **gestión de imágenes y multimedia**, tablas con filtros/paginación/acciones). El admin no accede a chats privados ni a identidad de denuncias anónimas.

F2-S7. **Denuncias**: creación clara (secciones cuando convenga), selección pública/anónima, confirmación de envío, historial, detalle y seguimiento. "No debe generar confusión en una persona que posiblemente esté atravesando una situación difícil."

F2-S8. **Chat**: interfaz tipo mensajería moderna, diferenciación de mensajes, hora/fecha, indicador de conexión, estados de carga y reconexión, historial, responsive móvil. Conserva WebSockets y restricciones.

F2-S9. **Noticias**: imágenes de portada, tarjetas editoriales, detalle, fecha, categorías, contenido destacado, navegación intuitiva.

F2-S10. **Pódcast por enlaces externos** (NO reproductor propio, NO carga de MP3/WAV, NO almacenamiento de audio): el admin agrega/edita/elimina episodios con título, descripción, imagen de portada opcional, nombre del programa, **URL del episodio (obligatoria y validada)**, plataforma (Spotify/YouTube/Apple Podcasts/otra), fecha de publicación y estado publicado/borrador. La URL debe ser obligatoria y validarse; **solo protocolos seguros HTTPS**. Experiencia de usuario: tarjetas con portada, título, descripción, fecha, plataforma y botón para escuchar/visualizar que **abre el enlace externo de forma segura, preferiblemente en una nueva pestaña** (`rel="noopener noreferrer"`). Se puede ofrecer previsualización embebida opcional; no simular reproducción. Adaptar modelos/serializers/endpoints/componentes existentes, sin módulos duplicados. Documentar plataformas compatibles y limitaciones.

F2-S11. **Foro**: publicaciones con diseño editorial, respuestas, autor según permisos, fechas, estados vacíos y acciones por rol.

F2-S12. **Recuperación de contraseña por enlace de un solo uso** (NO login sin contraseña): solicitar → correo → abrir enlace → nueva contraseña → validar → actualizar → enlace invalidado → confirmación. Seguridad: token aleatorio seguro, temporal, de un solo uso, **almacenado como hash**; caducidad configurable; invalidación tras uso; **respuestas genéricas** contra enumeración; **rate limiting**; validación del token en el backend; validación de contraseña con Django; invalidación de refresh tokens previos; no exponer datos sensibles en URL/logs/respuestas; el frontend nunca decide si un token es válido.

F2-S13. **Correo**: configuración por variables de entorno en `.env.example` sin credenciales reales. En desarrollo, backend de consola de Django documentado como alternativa segura; no simular envío en producción.

F2-S14. **Subida de imágenes desde la UI admin**: selector de archivo, arrastrar y soltar, vista previa, nombre de archivo, validación de formato y tamaño, indicador y confirmación de carga, reemplazo y eliminación, y visualización de la imagen guardada al editar. Backend: `ImageField`, `MEDIA_ROOT`/`MEDIA_URL`, serializers multipart, validación de extensión y MIME, límite de tamaño configurable, nombres de archivo seguros, permisos solo para roles autorizados, reemplazo/eliminación controlada. "No confíes exclusivamente en las validaciones del navegador." En producción, documentar almacenamiento persistente.

F2-S15. **Cuentas demo sin excepciones**: creadas por el seed, cumplen las mismas reglas de contraseña/correo/unicidad, pasan por autenticación normal, reciben permisos por rol, sin bypass de JWT/guards/interceptors/permisos ni privilegios extra. Si algo no cumple, corregir el seed, no debilitar validaciones.

F2-S16. **Validaciones a revisar**: registro vacío, correo inválido/duplicado, contraseña débil, confirmación incorrecta, login incorrecto, rutas sin auth, rutas de otro rol, perfiles ajenos, denuncias ajenas, denuncia anónima, chats no autorizados, archivos no permitidos, tokens vencidos/reutilizados.

F2-S17. **Animaciones/interacciones**: entrada discreta, transiciones de vista, hover, feedback al guardar, skeletons, toasts, modales, dropdowns, acordeones, preview de imágenes, estados de carga/error, transiciones en tarjetas/botones, indicadores de progreso. Respetar `prefers-reduced-motion`. Interacción con mouse, teclado y táctil.

F2-S18. **Responsive y accesibilidad**: escritorio, portátil, tablet, móvil; navegación, formularios, tablas, tarjetas, imágenes, modales y chat adaptados; contraste, labels, teclado, foco visible, `alt`, jerarquía semántica, errores asociados a campos, controles táctiles cómodos.

F2-S19. **Calidad**: evitar dependencias innecesarias; tipado estricto; estilos globales y componentes reutilizables; no mezclar lógica de negocio con presentación; documentar variables de entorno y cambios.

F2-S20. **Pruebas**: funcionales (registro/login, cuentas demo, recuperación, expiración/reutilización de tokens, validaciones, denuncias públicas/anónimas, seguimiento, acceso profesional, chat, noticias, carga/reemplazo de imágenes, pódcast por enlaces y validación de enlaces, apertura segura, foro, restricciones admin). Ejecutar `npm run build`, `npm test`, `python manage.py test`. No debilitar pruebas existentes.

## Tasks

| ID | Specs | Ruta | Commit |
|----|-------|------|--------|
| P2-T1 | F2-S12,S13,S16 | Backend: app de recuperación de contraseña (token hasheado, un solo uso, expiración, rate limit, respuestas genéricas) + config de correo | `feat(auth): add single-use password recovery by email link` |
| P2-T2 | F2-S10,S19 | Backend: refactor de `podcasts` a enlaces externos (URL HTTPS obligatoria, plataforma, programa, portada, fecha) | `feat(podcasts): replace audio uploads with validated external links` |
| P2-T3 | F2-S14,S9 | Backend: subida de imágenes (noticias/categorías, portada de pódcast) con validación de extensión/MIME/tamaño y reemplazo | `feat(media): add validated image uploads for content` |
| P2-T4 | F2-S15,S16 | Backend: seed revisado (valida contraseñas demo, pódcast por enlaces, categorías) + tests | `test(seed): validate demo accounts and content rules` |
| P2-T5 | F2-S2,S3,S17,S18,S19 | Frontend: sistema visual (Inter self-host, tokens, primitivas, animaciones, a11y) + componentes reutilizables (modal, skeleton, dropdown, image-uploader) | `feat(ui): rebuild design system with motion and accessibility` |
| P2-T6 | F2-S4,S5 | Frontend: landing y autenticación rediseñadas + vistas de recuperación de contraseña | `feat(ui): redesign landing, auth and password recovery` |
| P2-T7 | F2-S6,S7 | Frontend: dashboards por rol y flujo de denuncias rediseñados | `feat(ui): redesign role dashboards and reporting flow` |
| P2-T8 | F2-S8,S9,S10,S11 | Frontend: chat, noticias, pódcast (enlaces externos) y foro rediseñados | `feat(ui): redesign chat and content modules` |
| P2-T9 | F2-S6,S14 | Frontend: admin con uploader de imágenes, tablas con filtros/paginación y CRUD de pódcast por enlaces | `feat(ui): rebuild admin panels with image upload and filters` |
| P2-T10 | F2-S20,S1 | Verificación final: tests backend+frontend, build, revisión de validaciones y no regresiones | — |
| P2-T11 | F2-S19 | README y `.env.example` actualizados + informe final | `docs(readme): document phase 2 features and configuration` |

## Log

L1 (Fase 2, request): "FASE 2 — REDISEÑO PROFESIONAL, MEJORAS FUNCIONALES Y CIERRE DE LIMITACIONES [...] No quiero una plantilla genérica con la paleta de colores cambiada. Quiero un rediseño real, coherente, detallado y profesional, acompañado de mejoras funcionales verificables."
L2 (decisiones del usuario): recursos visuales = ilustraciones SVG originales locales; tipografía = self-host `@fontsource`. Sin push sin autorización.
L3 (auditoría): estado inicial limpio; backend 6 commits, frontend 1; `Podcast` todavía con `audio`/`audio_url`; `Noticia` sin categoría; sin recuperación de contraseña; sin config de correo; sin uploader de imágenes en la UI.
L4 (verificación Fase 2): backend `manage.py test apps` → **102/102 OK**; frontend `npm run build` OK y `npm test` → **17/17 OK**; `makemigrations --check` sin cambios pendientes. Hallazgos: los passwords demo originales fallaban el validador de similitud (corregidos en el seed, validados con `validate_password`); `RefreshToken.for_user` escribe en BD al habilitar la blacklist (arreglado en los tests WebSocket). Verificación independiente delegada no disponible (el runner de subagentes no resuelve repos independientes en este entorno).
