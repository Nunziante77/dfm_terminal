from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/priorities", tags=["priorities"])


@router.get("")
def get_priorities(
    pr_id: str | None = Query(None, description="Filter by strategic priority ID"),
    node_level: str | None = Query(None, description="Filter by node_level"),
    limit: int = Query(500, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    """Priority tree from v_dfm_priority_tree_v1. Columns: pr_id, node_id, node_level."""
    conditions = ["1=1"]
    params: dict = {"limit": limit}

    if pr_id:
        conditions.append("pr_id = :pr_id")
        params["pr_id"] = pr_id
    if node_level:
        conditions.append("node_level = :node_level")
        params["node_level"] = node_level

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"SELECT pr_id, node_id, node_level FROM v_dfm_priority_tree_v1 WHERE {where} ORDER BY pr_id, node_level LIMIT :limit",
        params,
    )
    return {"data": rows, "total": len(rows)}


@router.get("/distinct")
def get_distinct_priorities(db: Session = Depends(get_db)):
    """Return distinct pr_id values (top-level strategic priorities)."""
    rows = run_query(db, "SELECT DISTINCT pr_id FROM v_dfm_priority_tree_v1 ORDER BY pr_id")
    return {"data": rows, "total": len(rows)}


@router.get("/{pr_id}/nodes")
def get_priority_nodes(pr_id: str, db: Session = Depends(get_db)):
    """All nodes within a given strategic priority."""
    rows = run_query(
        db,
        "SELECT pr_id, node_id, node_level FROM v_dfm_priority_tree_v1 WHERE pr_id = :pr_id ORDER BY node_level",
        {"pr_id": pr_id},
    )
    return {"data": rows, "total": len(rows), "pr_id": pr_id}
