# Fase 10 — Integridad de documentos, filtros administrativos y logo institucional

Feature: `proteccion-inmediata-fase10`
Repos: `backend/` (Django + DRF) y `frontEnd/` (Angular), repos git independientes.
Punto de partida (Fase 9): backend 161/161, frontend 43/43, build OK, migraciones al día.

## Specs

S1. **Auditoría de documento**: inspeccionar dónde se almacena, revisar registros existentes
   (NULL, vacíos, solo espacios, duplicados normalizando espacios exteriores), enmascarar
   valores y no modificar datos automáticamente. Si hay conflictos, **detener** la migración y
   presentarlos.

S2. **Documento obligatorio y único**: cuando la auditoría no tenga conflictos, `unique=True`,
   `blank=False`, `null=False`, tipo texto, migración generada con restricción real de BD.

S3. **Registro**: documento obligatorio, sin valores vacíos/solo espacios, duplicados
   rechazados, error claro y sin exponer a otros usuarios.

S4. **Inmutabilidad sostenida**: perfil solo lectura y atenuado; PATCH/PUT rechazados; endpoint
   administrativo también; sin duplicados; mismo comportamiento en los tres roles.

S5. **Filtros de noticias y pódcast**: búsqueda de texto solo con ≥2 caracteres y ~400 ms de
   inactividad, reinicio del debounce al seguir escribiendo; campo vacío o borrado restaura
   resultados; filtro de estado combinable; sin respuestas obsoletas ni duplicados; sin botón
   de búsqueda.

S6. **Logo institucional**: usar `frontEnd/public/logoSC.png` (sin duplicar ni reemplazar) en
   navbar, login, registro y demás encabezados; proporciones originales, `object-fit: contain`,
   `alt` descriptivo, ruta absoluta `/logoSC.png`, sin deformaciones ni recortes.

S7. **Validación y documentación**: auditoría, migración (solo si procede), suites, build,
   `makemigrations --check`, carga del logo, permisos/inmutabilidad y este documento.

## Tasks

| ID | Specs | Ruta | Estado |
|----|-------|------|--------|
| T1 | S1 | Auditoría de datos (script sobre la BD real, valores enmascarados) | Hecho |
| T2 | S2 | `apps/usuarios/models.py` + migración `0003` | Hecho |
| T3 | S3 | `RegisterSerializer` documento obligatorio/único + `register.component` | Hecho |
| T4 | S5 | Filtros `debounceTime(400)` + guarda de longitud mínima + pruebas | Hecho |
| T5 | S6 | Logo en navbar/login/registro/footer + estilos | Hecho |
| T6 | S1,S2 | Actualización de las pruebas existentes para documento único | Hecho |
| T7 | S7 | Verificación final | En curso |
| T8 | S7 | Documentación e informe | Este documento |

## Log

L1 (Fase 10, request): pedido íntegro del usuario "FASE 10 — Integridad de documentos, corrección
de filtros administrativos e implementación del logo institucional", secciones 1–6 y restricciones.

L2 (auditoría, S1): la BD real (`db.sqlite3`) tiene **3 usuarios** (1 ADMINISTRADOR, 1 PROFESIONAL,
1 USUARIO). **3 documentos válidos, 0 NULL, 0 vacíos, 0 solo-espacios, 0 duplicados** (comparando
con `strip()` de espacios exteriores). **Sin conflictos.** Los valores se enmascararon (`***XX`,
`len=N`); no se registraron documentos completos.

L3 (hallazgo): el documento vive **solo en `Usuario`** (no hay modelo de perfil separado);
`apps/perfiles/models.py` está vacío. `RegisterSerializer` **no** incluía documento, y el modelo
era `blank=True` sin `unique`. Se detectaron ~56 creaciones de usuarios en pruebas sin documento,
que colisionarían con `unique=True`.

L4 (implementación):
- Modelo: `documento = models.CharField("documento", max_length=40, unique=True)`; migración
  `apps/usuarios/migrations/0003_alter_usuario_documento.py` generada y aplicada (OK).
- Registro: `documento` obligatorio, `strip()`, rechazo de vacío/solo-espacios y de duplicados;
  formulario Angular con validación (`required`, `minLength(4)`, patrón) y envío del documento.
- Pruebas existentes: helper `documento_unico()` en `apps/core/tests/factories.py`; 48 creaciones
  parcheadas para pasar documento único; 2 payloads de registro actualizados.
- Filtros: `debounceTime(400)` + `distinctUntilChanged()` + guarda `trim().length === 1` (no
  busca con un carácter) + `switchMap()` para cancelar; aplica a noticias y pódcast.
- Logo: `logoSC.png` (1409×1117 PNG RGBA) referenciado como `/logoSC.png` con `object-fit:
  contain` y `alt` en navbar, login, registro y footer; emitido en `dist/.../browser/logoSC.png`.

L5 (verificación independiente): `gentle-ai-verify` confirmó el esquema `NOT NULL UNIQUE`, la
unicidad real en BD y la inmutabilidad por API, y **encontró un bloqueante (B1)**: vías de
producción distintas del registro podían crear cuentas con `documento` vacío (que es un valor
único válido, por lo que la segunda creación fallaba con `IntegrityError`/500):
`UsuarioManager.create_user`/`create_superuser`, `createsuperuser` y el formulario de alta del
Django admin (`add_fieldsets` omitía el documento). Se corrigió:
- `_create_user` exige documento no vacío (recorta espacios) y falla con `ValueError`.
- `REQUIRED_FIELDS` incluye `documento` (CLI `createsuperuser`).
- `add_fieldsets` del admin incluye `documento` (alta obligatoria desde `/admin/`).
- Unicidad de registro **case-insensitive** (`iexact`) sin alterar el valor almacenado.
- Carrera TOCTOU: `RegisterSerializer.create` captura `IntegrityError` y devuelve 400 con mensaje
  genérico en lugar de 500.
Cuatro pruebas nuevas cubren estos casos (manager, superusuario, alta admin, variante de
mayúsculas).

## Resultado de la auditoría de datos (S1)

| Métrica | Valor |
|---------|-------|
| Total de usuarios analizados | 3 (1 ADMINISTRADOR, 1 PROFESIONAL, 1 USUARIO) |
| Documentos válidos | 3 |
| Documentos NULL / vacíos / solo espacios | 0 / 0 / 0 |
| Documentos duplicados (comparando `strip()`) | 0 |
| Identificadores conflictivos | Ninguno |
| Recomendación | Sin conflictos: procede la migración de obligatoriedad y unicidad |

No se expusieron documentos completos (valores enmascarados `***XX`, `len=N`). **No se modificó
ni eliminó ningún dato.**

## Cambios del modelo y migración

- `apps/usuarios/models.py`: `documento = models.CharField("documento", max_length=40, unique=True)`
  (texto, `blank=False`, `null=False`). `_create_user` exige documento.
- `apps/usuarios/migrations/0003_alter_usuario_documento.py`: generada y aplicada (`migrate` OK).
  Restricción real verificada con `sqlmigrate` (`documento varchar(40) NOT NULL UNIQUE`) y con el
  índice único de SQLite.
- Auditoría post-migración: 3 usuarios, 3 válidos, 0 duplicados.

## Comportamiento definitivo de filtros (S5)

- Un solo carácter **no** dispara petición de búsqueda (guarda `trim().length === 1`).
- Dos o más caracteres buscan tras `debounceTime(400)`; seguir escribiendo reinicia el temporizador.
- Campo vacío o borrado restaura resultados (sin parámetro `search`).
- Filtro de estado (Todas/Publicadas/Borradores) se combina con el texto y reinicia a página 1.
- `switchMap` cancela respuestas obsoletas; `distinctUntilChanged` evita duplicados; errores HTTP
  no rompen el flujo. Sin botón de búsqueda. Igual en noticias y pódcast.

## Logo institucional (S6)

`/logoSC.png` en navbar, login, registro y footer; `object-fit: contain`, proporciones originales,
`alt="Protección Inmediata SC"`, ruta absoluta; emitido por el build en `dist/.../browser/`.

## Validación final (S7)

| Verificación | Resultado |
|--------------|-----------|
| Backend completo | **173/173 OK** (`Ran 173 tests`, exit 0) |
| Frontend completo | **47/47 OK** (8 archivos) |
| Build producción | **OK** (exit 0) |
| `makemigrations --check` | **Sin cambios pendientes** |
| Restricción única real | **Verificada** (índice único de BD) |
| Logo emitido | **Verificado** en el build |
| Permisos/inmutabilidad documentos | **Verificado** (3 roles + orden) |

## Limitaciones

1. La unicidad case-insensitive se garantiza en el registro (API); el índice de BD es sensible a
   mayúsculas (SQLite/Postgres por defecto). Las demás vías (admin) usan la validación `unique`
   del modelo, sensible a mayúsculas.
2. La validación visual real del logo y de los filtros **no se ejecutó** (sin navegador; CDP
   suspendido). Se verificó por inspección de código, emisión en `dist/` y pruebas automatizadas.
3. Cambios **sin commitear** (no se autorizó commit); sin push ni deploy.

## Estado final

Documento obligatorio, único (restricción real de BD) e inmutable en los tres roles, con todas las
vías de creación cerradas; filtros administrativos que no buscan con un solo carácter ni dejan
respuestas obsoletas; y `logoSC.png` implementado en la identidad institucional. Backend **173/173**,
frontend **47/47**, build OK, migración aplicada y migraciones al día. Auditoría sin conflictos:
no hubo tareas detenidas por datos existentes.
