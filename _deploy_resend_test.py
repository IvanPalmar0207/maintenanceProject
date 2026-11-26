from django.core.mail import EmailMessage

destinatario = "palmar.ivan0205@gmail.com"
mensaje = EmailMessage(
    subject="Prueba de envio · Proteccion Inmediata SC",
    body=(
        "Correo de prueba enviado mediante Resend desde el backend de produccion "
        "de Proteccion Inmediata SC."
    ),
    from_email=None,
    to=[destinatario],
)
try:
    enviados = mensaje.send(fail_silently=False)
    print("ENVIADOS:", enviados)
    estado = mensaje.anymail_status
    print("MESSAGE_ID:", estado.message_id)
    print("STATUS:", estado.status)
    for destino, valor in estado.recipients.items():
        print("RECIPIENT:", destino, valor)
except Exception as error:  # noqa: BLE001
    print("ERROR:", type(error).__name__, str(error)[:300])
