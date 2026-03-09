from typing import Any, Dict, List, Optional, Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import DATABASE_URL

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Dependency for FastAPI routes
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Generic helper to execute SQL queries against PostgreSQL views
def run_query(
    db: Session,
    sql: str,
    params: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Execute a raw SQL query and return results as list of dictionaries.
    Designed for querying analytical PostgreSQL views used by the DFM Terminal.
    """
    result = db.execute(text(sql), params or {})
    rows = result.fetchall()
    columns = result.keys()

    return [
        dict(zip(columns, row))
        for row in rows
    ]
