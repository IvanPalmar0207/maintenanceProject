import json
import urllib.error
import urllib.request

from apps.usuarios.models import Usuario
from apps.usuarios.services import crear_token_recuperacion

BASE = "https://backend-production-d784.up.railway.app"
EMAIL = "recuperacion-e2e@test.dev"
OLD = "ClaveVieja#2026"
NEW = "ClaveNueva#2026"


def http(method, path, body=None):
    headers = {"Content-Type": "application/json"}
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status, json.loads(response.read().decode() or "{}")
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read().decode() or "{}")


Usuario.objects.filter(email=EMAIL).delete()
usuario = Usuario.objects.create_user(
    email=EMAIL,
    password=OLD,
    nombre_completo="Recuperacion E2E",
    documento="DOC-E2E-UNICO-1",
    role="USUARIO",
)

token = crear_token_recuperacion(usuario)
print("TOKEN_GENERADO:", bool(token))

s1, _ = http("POST", "/api/auth/password-reset/confirm/", {"token": token, "password": NEW, "password_confirm": NEW})
print("CONFIRM:", s1)

s2, b2 = http("POST", "/api/auth/login/", {"email": EMAIL, "password": NEW})
print("LOGIN_NUEVA:", s2, (b2.get("user") or {}).get("role"))

s3, _ = http("POST", "/api/auth/login/", {"email": EMAIL, "password": OLD})
print("LOGIN_VIEJA:", s3)

s4, _ = http("POST", "/api/auth/password-reset/confirm/", {"token": token, "password": "OtraClave#2026", "password_confirm": "OtraClave#2026"})
print("REUSO_TOKEN:", s4)

s5, _ = http("POST", "/api/auth/password-reset/confirm/", {"token": "invalido-xyz", "password": "OtraClave#2026", "password_confirm": "OtraClave#2026"})
print("TOKEN_INVALIDO:", s5)

Usuario.objects.filter(email=EMAIL).delete()
print("LIMPIEZA_OK")
