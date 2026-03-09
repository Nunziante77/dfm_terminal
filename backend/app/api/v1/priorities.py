from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/priorities", tags=["priorities"])


@router.get("")
def get_priorities(
    parent_id: str | None = Query(None, description="Filter by parent node"),
    depth: int | None = Query(None, description="Maximum tree depth to return"),
    db: Session = Depends(get_db),
):
    """Full priority tree from v_dfm_priority_tree_v1."""
    conditions = ["1=1"]
    params: dict = {}

    if parent_id:
        conditions.append("CAST(parent_id AS TEXT) = :parent_id")
        params["parent_id"] = parent_id
    if depth is not None:
        conditions.append("level <= :depth")
        params["depth"] = depth

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"SELECT * FROM v_dfm_priority_tree_v1 WHERE {where} ORDER BY level, parent_id",
        params,
    )
    return {"data": rows, "total": len(rows)}


@router.get("/root")
def get_root_priorities(db: Session = Depends(get_db)):
    """Return only top-level (root) priority nodes."""
    rows = run_query(
        db,
        "SELECT * FROM v_dfm_priority_tree_v1 WHERE parent_id IS NULL ORDER BY level",
    )
    return {"data": rows, "total": len(rows)}
