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


login = http("POST", "/api/auth/login/", {"email": "usuario@proteccioninmediata.test", "password": "Sendero#Calido2026"})
token = login["access"]
conversaciones = http("GET", "/api/chat/conversaciones/", token=token)
conv_id = conversaciones["results"][0]["id"]
print("conv_id", conv_id)


async def main():
    uri = f"{WS}/ws/chat/{conv_id}/?token={token}"
    async with websockets.connect(uri, additional_headers={"Origin": ORIGIN}) as ws:
        print("WS_CONECTADO")
        await ws.send(json.dumps({"contenido": "Ping de validacion WS"}))
        recibido = await asyncio.wait_for(ws.recv(), timeout=10)
        data = json.loads(recibido)
        print("WS_RECIBIDO", data.get("tipo"), "|", (data.get("mensaje") or {}).get("contenido"))


asyncio.run(main())
