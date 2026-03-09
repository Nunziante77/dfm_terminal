from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/screener", tags=["screener"])

ALLOWED_SORT_COLUMNS = {
    "entity_name", "entity_id", "rank", "score", "sector",
    "revenue", "contract_value", "priority_score",
}


@router.get("")
def screener(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("rank", description="Column to sort by"),
    sort_dir: str = Query("asc", regex="^(asc|desc)$"),
    sector: str | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """
    Bloomberg-style entity screener from v_dfm_bloomberg_screener_v3.
    Supports filtering, sorting, and pagination.
    """
    # Sanitise sort column against allowlist
    sort_col = sort_by if sort_by in ALLOWED_SORT_COLUMNS else "entity_id"
    direction = "DESC" if sort_dir == "desc" else "ASC"

    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if sector:
        conditions.append("sector ILIKE :sector")
        params["sector"] = f"%{sector}%"
    if search:
        conditions.append("entity_name ILIKE :search")
        params["search"] = f"%{search}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT *
        FROM v_dfm_bloomberg_screener_v3
        WHERE {where}
        ORDER BY {sort_col} {direction}
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    count = run_query(
        db,
        f"SELECT COUNT(*) AS total FROM v_dfm_bloomberg_screener_v3 WHERE {where}",
        {k: v for k, v in params.items() if k not in ("limit", "offset")},
    )
    total = count[0]["total"] if count else 0
    return {"data": rows, "total": total, "limit": limit, "offset": offset}


@router.get("/columns")
def screener_columns(db: Session = Depends(get_db)):
    """Return column names available in the screener view."""
    rows = run_query(
        db,
        """
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'v_dfm_bloomberg_screener_v3'
        ORDER BY ordinal_position
        """,
    )
    return {"columns": rows}
