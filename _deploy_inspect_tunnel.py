"""Inspect the Railway Postgres through the local SSH tunnel (read-only).

Connects to 127.0.0.1:<port> using credentials from backend/.env and prints
schema/table names (never prints the URL, user or password).
"""

import os
import sys
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 15432
ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / "backend" / ".env")
url = os.getenv("DATABASE_URL")
if not url:
    print("RESULT|sin DATABASE_URL")
    sys.exit(0)
parsed = urlparse(url)

import psycopg  # noqa: E402

try:
    with psycopg.connect(
        host="127.0.0.1",
        port=PORT,
        dbname=(parsed.path or "/").lstrip("/"),
        user=parsed.username,
        password=parsed.password,
        connect_timeout=8,
    ) as conn:
        with conn.cursor() as cur:
            cur.execute("select current_database()")
            print("RESULT|db:", cur.fetchone()[0])
            cur.execute(
                "select table_schema, count(*) from information_schema.tables "
                "where table_schema not in ('pg_catalog','information_schema') "
                "group by 1 order by 1"
            )
            print("RESULT|tablas_por_schema:", cur.fetchall())
            cur.execute(
                "select table_schema, table_name from information_schema.tables "
                "where table_schema not in ('pg_catalog','information_schema') order by 1,2"
            )
            tablas = cur.fetchall()
            print("RESULT|total_tablas:", len(tablas))
            for schema, tabla in tablas[:120]:
                print(f"RESULT|{schema}.{tabla}")
except Exception as error:  # noqa: BLE001
    print("RESULT|ERROR:", type(error).__name__, str(error)[:160])
