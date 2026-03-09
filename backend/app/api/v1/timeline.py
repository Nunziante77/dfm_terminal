from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/timeline", tags=["timeline"])


@router.get("")
def get_timeline(
    entity_id: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Event timeline data from entity context view, ordered by date.
    """
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if entity_id:
        conditions.append("CAST(entity_id AS TEXT) = :entity_id")
        params["entity_id"] = entity_id

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT *
        FROM v_dfm_entity_context_v1
        WHERE {where}
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    return {"data": rows, "total": len(rows)}


@router.get("/entity/{entity_id}")
def get_entity_timeline(entity_id: str, db: Session = Depends(get_db)):
    """All timeline events for a specific entity."""
    rows = run_query(
        db,
        """
        SELECT *
        FROM v_dfm_entity_context_v1
        WHERE CAST(entity_id AS TEXT) = :eid
        """,
        {"eid": entity_id},
    )
    return {"data": rows, "entity_id": entity_id}
