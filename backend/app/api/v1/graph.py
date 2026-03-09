from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/nodes")
def get_graph_nodes(
    entity_id: str | None = Query(None, description="Filter nodes by entity"),
    node_type: str | None = Query(None, description="Filter by node type"),
    limit: int = Query(500, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    """Retrieve knowledge graph nodes from v_dfm_graph_nodes_v1."""
    conditions = ["1=1"]
    params: dict = {"limit": limit}

    if entity_id:
        conditions.append("CAST(entity_id AS TEXT) = :entity_id")
        params["entity_id"] = entity_id
    if node_type:
        conditions.append("node_type ILIKE :node_type")
        params["node_type"] = f"%{node_type}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"SELECT * FROM v_dfm_graph_nodes_v1 WHERE {where} LIMIT :limit",
        params,
    )
    return {"nodes": rows, "count": len(rows)}


@router.get("/edges")
def get_graph_edges(
    source_id: str | None = Query(None),
    target_id: str | None = Query(None),
    relationship_type: str | None = Query(None),
    limit: int = Query(1000, ge=1, le=10000),
    db: Session = Depends(get_db),
):
    """Retrieve knowledge graph edges from v_dfm_graph_edges_v3."""
    conditions = ["1=1"]
    params: dict = {"limit": limit}

    if source_id:
        conditions.append("CAST(source_id AS TEXT) = :source_id")
        params["source_id"] = source_id
    if target_id:
        conditions.append("CAST(target_id AS TEXT) = :target_id")
        params["target_id"] = target_id
    if relationship_type:
        conditions.append("relationship_type ILIKE :rel_type")
        params["rel_type"] = f"%{relationship_type}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"SELECT * FROM v_dfm_graph_edges_v3 WHERE {where} LIMIT :limit",
        params,
    )
    return {"edges": rows, "count": len(rows)}


@router.get("/subgraph/{entity_id}")
def get_entity_subgraph(
    entity_id: str,
    depth: int = Query(1, ge=1, le=3),
    limit: int = Query(200, ge=1, le=2000),
    db: Session = Depends(get_db),
):
    """Get the ego-network subgraph around a specific entity."""
    nodes = run_query(
        db,
        "SELECT * FROM v_dfm_graph_nodes_v1 WHERE CAST(entity_id AS TEXT) = :eid LIMIT :limit",
        {"eid": entity_id, "limit": limit},
    )
    edges = run_query(
        db,
        """
        SELECT * FROM v_dfm_graph_edges_v3
        WHERE CAST(source_id AS TEXT) = :eid
           OR CAST(target_id AS TEXT) = :eid
        LIMIT :limit
        """,
        {"eid": entity_id, "limit": limit},
    )
    return {"nodes": nodes, "edges": edges, "entity_id": entity_id, "depth": depth}
