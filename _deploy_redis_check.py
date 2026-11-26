import asyncio

from django.conf import settings

print("CHANNEL_BACKEND:", settings.CHANNEL_LAYERS["default"]["BACKEND"])
print("REDIS_URL_PRESENTE:", bool(settings.REDIS_URL))
print("REDIS_ESQUEMA:", settings.REDIS_URL.split("://")[0] if settings.REDIS_URL else "n/a")

from channels_redis.core import RedisChannelLayer  # noqa: E402


async def main():
    layer = RedisChannelLayer(hosts=[settings.REDIS_URL])
    await layer.group_add("deploy-check", "canal-1")
    await layer.send("deploy-check", {"type": "check.message", "valor": 42})
    recibido = await layer.receive("deploy-check")
    print("REDIS_ROUNDTRIP:", bool(recibido and recibido.get("valor") == 42))
    await layer.group_discard("deploy-check", "canal-1")
    await layer.flush()


asyncio.run(main())
