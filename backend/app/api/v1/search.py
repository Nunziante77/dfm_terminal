from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
def global_search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Full-text search across entity profiles.
    Searches entity_name, sector, description, and any text columns.
    """
    pattern = f"%{q}%"
    rows = run_query(
        db,
        """
        SELECT *
        FROM v_dfm_entity_profile_v1
        WHERE entity_name ILIKE :pattern
           OR CAST(entity_id AS TEXT) ILIKE :pattern
        LIMIT :limit
        """,
        {"pattern": pattern, "limit": limit},
    )
    return {"data": rows, "total": len(rows), "query": q}
