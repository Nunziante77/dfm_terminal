from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/rankings", tags=["rankings"])


@router.get("")
def get_rankings(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    layer: str | None = Query(None, description="Filter by scoring layer"),
    db: Session = Depends(get_db),
):
    """
    Rankings with multi-layer scoring from v_dfm_rank_with_scoring_layers_v3.
    """
    rows = run_query(
        db,
        "SELECT * FROM v_dfm_rank_with_scoring_layers_v3 LIMIT :limit OFFSET :offset",
        {"limit": limit, "offset": offset},
    )
    return {"data": rows, "total": len(rows), "limit": limit, "offset": offset}


@router.get("/columns")
def rankings_columns(db: Session = Depends(get_db)):
    """Return available scoring columns/layers."""
    rows = run_query(
        db,
        """
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'v_dfm_rank_with_scoring_layers_v3'
        ORDER BY ordinal_position
        """,
    )
    return {"columns": rows}
