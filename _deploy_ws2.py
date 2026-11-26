import asyncio
import json
import urllib.request

import websockets

API = "https://backend-production-d784.up.railway.app"
WS = "wss://backend-production-d784.up.railway.app"
ORIGIN = "https://proteccion-inmediata-sc-ivan.netlify.app"


def http(method, path, body=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(API + path, data=data, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=25) as response:
        return json.loads(response.read())


def login(email, password):
    return http("POST", "/api/auth/login/", {"email": email, "password": password})["access"]


duenio = login("usuario@proteccioninmediata.test", "Sendero#Calido2026")
prof = login("profesional@proteccioninmediata.test", "Brujula#Serena2026")

# A conversation the owner participates in (professional is the assigned one).
conv = http("GET", "/api/chat/conversaciones/", token=duenio)["results"][0]
conv_id = conv["id"]
print("conv_id", conv_id)


async def main():
    uri = f"{WS}/ws/chat/{conv_id}/?token="
    a = await websockets.connect(uri + duenio, additional_headers={"Origin": ORIGIN})
    b = await websockets.connect(uri + prof, additional_headers={"Origin": ORIGIN})
    print("DOS_CONEXIONES_OK")

    await a.send(json.dumps({"contenido": "Hola desde el dueño (WS+Redis)"}))
    m1 = json.loads(await asyncio.wait_for(b.recv(), timeout=10))
    print("PROF_RECIBE:", m1.get("tipo"), "|", (m1.get("mensaje") or {}).get("contenido"))

    await b.send(json.dumps({"contenido": "Respuesta del profesional (WS+Redis)"}))
    m2 = json.loads(await asyncio.wait_for(a.recv(), timeout=10))
    print("DUEÑO_RECIBE:", m2.get("tipo"), "|", (m2.get("mensaje") or {}).get("contenido"))

    await a.close()
    await b.close()
    print("WS_BIDIRECCIONAL_OK")


asyncio.run(main())
