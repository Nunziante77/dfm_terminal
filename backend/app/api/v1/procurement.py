from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/procurement", tags=["procurement"])


@router.get("")
def get_procurement(
    entity_id: str | None = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Procurement intelligence sourced from bloomberg screener view,
    filtered for contract/award columns.
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
        FROM v_dfm_bloomberg_screener_v3
        WHERE {where}
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    return {"data": rows, "total": len(rows), "limit": limit, "offset": offset}
