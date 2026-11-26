import json
import urllib.request

from django.conf import settings

mid = "01a1bc19-3460-75c9-a2d3-e4011a56e7a0"
peticion = urllib.request.Request(
    f"https://api.resend.com/emails/{mid}",
    headers={"Authorization": f"Bearer {settings.EMAIL_API_KEY}"},
)
try:
    with urllib.request.urlopen(peticion, timeout=20) as respuesta:
        data = json.loads(respuesta.read().decode())
        print("RESEND_EMAIL_STATUS:", data.get("last_event"), "| to:", data.get("to"))
except Exception as error:  # noqa: BLE001
    print("ERROR:", type(error).__name__, str(error)[:200])
