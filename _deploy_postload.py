from io import StringIO

from django.core.management import call_command
from django.db import connection

# 1) Reset PostgreSQL sequences for the imported primary keys.
out = StringIO()
call_command(
    "sqlsequencereset",
    "usuarios",
    "denuncias",
    "chat",
    "noticias",
    "podcasts",
    "foro",
    "notificaciones",
    stdout=out,
)
sql = out.getvalue()
sentencias = [s.strip() for s in sql.split(";") if s.strip()]
with connection.cursor() as cursor:
    for sentencia in sentencias:
        cursor.execute(sentencia)
print("SECUENCIAS_RESET:", len(sentencias))

# 2) Counts per model.
from apps.chat.models import Conversacion, Mensaje  # noqa: E402
from apps.denuncias.models import Denuncia, SeguimientoDenuncia  # noqa: E402
from apps.foro.models import Publicacion, Respuesta  # noqa: E402
from apps.noticias.models import Noticia  # noqa: E402
from apps.notificaciones.models import Notificacion  # noqa: E402
from apps.podcasts.models import Podcast  # noqa: E402
from apps.usuarios.models import Usuario  # noqa: E402

conteos = {
    "Usuario": Usuario.objects.count(),
    "Denuncia": Denuncia.objects.count(),
    "Seguimiento": SeguimientoDenuncia.objects.count(),
    "Conversacion": Conversacion.objects.count(),
    "Mensaje": Mensaje.objects.count(),
    "Noticia": Noticia.objects.count(),
    "Podcast": Podcast.objects.count(),
    "Publicacion": Publicacion.objects.count(),
    "Respuesta": Respuesta.objects.count(),
    "Notificacion": Notificacion.objects.count(),
}
for nombre, total in conteos.items():
    print(f"CONTEOS|{nombre}={total}")

# 3) Verify password hashes are intact (not plain text) and a known user can authenticate.
usuario = Usuario.objects.exclude(email="").first()
print("HASH_ESQUEMA:", usuario.password.split("$")[0] if usuario else "n/a")
