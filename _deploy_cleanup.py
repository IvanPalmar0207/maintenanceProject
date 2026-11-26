from apps.chat.models import Conversacion, Mensaje
from apps.denuncias.models import Denuncia
from apps.usuarios.models import Usuario

qa = Usuario.objects.filter(email__startswith="qa", email__endswith="@test.dev")
print("USUARIOS_QA_BORRADOS:", qa.count(), list(qa.values_list("email", flat=True)))
qa.delete()

den = Denuncia.objects.filter(descripcion__startswith="Denuncia de validación de despliegue")
print("DENUNCIAS_TEST_BORRADAS:", den.count())
den.delete()

msg = (
    Mensaje.objects.filter(contenido__icontains="WS+Redis")
    | Mensaje.objects.filter(contenido__icontains="validación")
    | Mensaje.objects.filter(contenido__icontains="Ping de validacion")
)
print("MENSAJES_TEST_BORRADOS:", msg.count())
msg.delete()

print(
    "DESPUES|Usuario=%s|Denuncia=%s|Conversacion=%s|Mensaje=%s"
    % (
        Usuario.objects.count(),
        Denuncia.objects.count(),
        Conversacion.objects.count(),
        Mensaje.objects.count(),
    )
)
