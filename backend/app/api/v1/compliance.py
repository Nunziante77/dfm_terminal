from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("")
def get_compliance(
    entity_id: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Regulatory compliance data sourced from entity context view.
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
    return {"data": rows, "total": len(rows), "limit": limit, "offset": offset}
