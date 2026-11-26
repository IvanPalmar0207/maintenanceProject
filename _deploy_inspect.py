"""Read-only inspection of the PostgreSQL target from backend/.env.

Prints connection metadata with the password MASKED and lists schemas/tables.
Never prints the full URL, user, or password.
"""

import os
import sys
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / "backend" / ".env")

url = os.getenv("DATABASE_URL")
if not url:
    print("RESULT|sin DATABASE_URL")
    sys.exit(0)

parsed = urlparse(url)
host = parsed.hostname or ""
dbname = (parsed.path or "/").lstrip("/")
print("RESULT|scheme:", parsed.scheme)
print("RESULT|host:", host)
print("RESULT|port:", parsed.port)
print("RESULT|db:", dbname)
print("RESULT|user_presente:", bool(parsed.username))
print("RESULT|password_presente:", bool(parsed.password))
print("RESULT|es_interno_railway:", host.endswith(".railway.internal"))

try:
    import psycopg
except ImportError:
    print("RESULT|psycopg no instalado")
    sys.exit(1)

try:
    with psycopg.connect(url, connect_timeout=10) as conn:
        with conn.cursor() as cur:
            cur.execute("select version()")
            print("RESULT|version:", cur.fetchone()[0][:60])
            cur.execute("select current_database(), current_user")
            db, user = cur.fetchone()
            print("RESULT|conectado_a:", db)
            cur.execute(
                "select table_schema, count(*) from information_schema.tables "
                "where table_schema not in ('pg_catalog','information_schema') "
                "group by table_schema order by 1"
            )
            print("RESULT|tablas_por_schema:", cur.fetchall())
            cur.execute(
                "select table_schema, table_name from information_schema.tables "
                "where table_schema not in ('pg_catalog','information_schema') "
                "order by 1,2"
            )
            tablas = cur.fetchall()
            print("RESULT|total_tablas_usuario:", len(tablas))
            for schema, tabla in tablas[:80]:
                print(f"RESULT|tabla|{schema}|{tabla}")
            # Does it already look like a Django project?
            nombres = {t for _, t in tablas}
            print("RESULT|tiene_django_migrations:", "django_migrations" in nombres)
            print("RESULT|tiene_usuarios_usuario:", "usuarios_usuario" in nombres)
except Exception as error:  # noqa: BLE001
    print("RESULT|ERROR_CONEXION:", type(error).__name__, str(error)[:200])
