from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/timeline", tags=["timeline"])


@router.get("")
def get_timeline(
    entity_id: str | None = Query(None),
    event_type: str | None = Query(None),
    country_code: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Event timeline from dfm_events_v1, ordered by event_date DESC."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if entity_id:
        conditions.append("entity_id = :entity_id")
        params["entity_id"] = entity_id
    if event_type:
        conditions.append("event_type ILIKE :event_type")
        params["event_type"] = f"%{event_type}%"
    if country_code:
        conditions.append("country_code ILIKE :country_code")
        params["country_code"] = f"%{country_code}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT event_id, entity_id, event_type, event_source, event_date,
               country_code, event_value, currency, created_at
        FROM dfm_events_v1
        WHERE {where}
        ORDER BY event_date DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    return {"data": rows, "total": len(rows)}


@router.get("/entity/{entity_id}")
def entity_timeline(entity_id: str, db: Session = Depends(get_db)):
    """All timeline events for a specific entity."""
    rows = run_query(
        db,
        """
        SELECT event_id, entity_id, event_type, event_source, event_date,
               country_code, event_value, currency, created_at
        FROM dfm_events_v1
        WHERE entity_id = :eid
        ORDER BY event_date DESC NULLS LAST
        """,
        {"eid": entity_id},
    )
    return {"data": rows, "entity_id": entity_id, "total": len(rows)}
