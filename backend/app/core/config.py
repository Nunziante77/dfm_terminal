import os
from pathlib import Path
from dotenv import load_dotenv

# Search up the directory tree for a .env file
_search = Path(__file__).resolve().parent
for _ in range(5):
    if (_search / ".env").exists():
        load_dotenv(_search / ".env")
        break
    _search = _search.parent
else:
    load_dotenv()

DATABASE_URL: str = os.environ.get(
    "DATABASE_URL",
    "postgresql://dfm_user@localhost:5432/dfm_db_semantic",
)

CORS_ORIGINS: list[str] = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
]
