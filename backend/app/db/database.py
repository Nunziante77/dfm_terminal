from typing import Any, Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import DATABASE_URL

engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=10)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_query(db: Session, sql: str, params: dict | None = None) -> list[dict[str, Any]]:
    """Execute a SQL query and return rows as list of dicts."""
    result = db.execute(text(sql), params or {})
    columns = list(result.keys())
    return [dict(zip(columns, row)) for row in result.fetchall()]
