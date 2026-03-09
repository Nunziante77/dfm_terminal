from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/events", tags=["events"])


@router.get("")
def list_events(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    entity_id: str | None = Query(None),
    event_type: str | None = Query(None),
    country_code: str | None = Query(None),
    event_source: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Events from dfm_events_v1."""
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
    if event_source:
        conditions.append("event_source ILIKE :event_source")
        params["event_source"] = f"%{event_source}%"

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
    count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
    count = run_query(db, f"SELECT COUNT(*) AS total FROM dfm_events_v1 WHERE {where}", count_params)
    return {"data": rows, "total": count[0]["total"] if count else 0, "limit": limit, "offset": offset}


@router.get("/entity/{entity_id}/summary")
def entity_events_summary(entity_id: str, db: Session = Depends(get_db)):
    """Aggregated event summary for an entity."""
    summary = run_query(
        db,
        """
        SELECT entity_id, events_total, total_contract_value, first_event, last_event
        FROM v_dfm_entity_events_v1
        WHERE entity_id = :eid
        """,
        {"eid": entity_id},
    )
    raw_events = run_query(
        db,
        """
        SELECT event_id, entity_id, event_type, event_source, event_date,
               country_code, event_value, currency, created_at
        FROM dfm_events_v1
        WHERE entity_id = :eid
        ORDER BY event_date DESC NULLS LAST
        LIMIT 100
        """,
        {"eid": entity_id},
    )
    return {
        "entity_id": entity_id,
        "summary": summary[0] if summary else None,
        "events": raw_events,
    }


@router.get("/rankings")
def events_rankings(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Entities ranked by event activity."""
    rows = run_query(
        db,
        """
        SELECT entity_id, official_name, events_total, procurement_value
        FROM v_dfm_entity_events_rank_v1
        ORDER BY events_total DESC NULLS LAST
        LIMIT :limit
        """,
        {"limit": limit},
    )
    return {"data": rows, "total": len(rows)}
