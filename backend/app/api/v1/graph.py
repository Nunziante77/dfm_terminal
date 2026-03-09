from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/nodes")
def get_graph_nodes(
    node_type: str | None = Query(None, description="Filter by node_type"),
    node_id: str | None = Query(None, description="Filter by node_id prefix"),
    limit: int = Query(500, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    """Graph nodes from v_dfm_graph_nodes_v1. Columns: node_type, node_id, node_label."""
    conditions = ["1=1"]
    params: dict = {"limit": limit}

    if node_type:
        conditions.append("node_type ILIKE :node_type")
        params["node_type"] = f"%{node_type}%"
    if node_id:
        conditions.append("node_id ILIKE :node_id")
        params["node_id"] = f"%{node_id}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"SELECT node_type, node_id, node_label FROM v_dfm_graph_nodes_v1 WHERE {where} LIMIT :limit",
        params,
    )
    return {"nodes": rows, "count": len(rows)}


@router.get("/edges")
def get_graph_edges(
    from_id: str | None = Query(None),
    to_id: str | None = Query(None),
    edge_type: str | None = Query(None),
    from_type: str | None = Query(None),
    to_type: str | None = Query(None),
    limit: int = Query(1000, ge=1, le=10000),
    db: Session = Depends(get_db),
):
    """Graph edges from v_dfm_graph_edges_v3. Key columns: from_id, to_id, edge_type."""
    conditions = ["1=1"]
    params: dict = {"limit": limit}

    if from_id:
        conditions.append("from_id = :from_id")
        params["from_id"] = from_id
    if to_id:
        conditions.append("to_id = :to_id")
        params["to_id"] = to_id
    if edge_type:
        conditions.append("edge_type ILIKE :edge_type")
        params["edge_type"] = f"%{edge_type}%"
    if from_type:
        conditions.append("from_type ILIKE :from_type")
        params["from_type"] = f"%{from_type}%"
    if to_type:
        conditions.append("to_type ILIKE :to_type")
        params["to_type"] = f"%{to_type}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT from_type, from_id, to_type, to_id, edge_type, evidence, source_connector, created_at
        FROM v_dfm_graph_edges_v3
        WHERE {where}
        LIMIT :limit
        """,
        params,
    )
    return {"edges": rows, "count": len(rows)}


@router.get("/subgraph/{entity_id}")
def get_entity_subgraph(
    entity_id: str,
    limit: int = Query(300, ge=1, le=2000),
    db: Session = Depends(get_db),
):
    """Ego-network for an entity: its node + all directly connected edges and neighbour nodes."""
    # Node for the entity itself
    entity_nodes = run_query(
        db,
        "SELECT node_type, node_id, node_label FROM v_dfm_graph_nodes_v1 WHERE node_id = :eid LIMIT 10",
        {"eid": entity_id},
    )
    # All edges touching this entity
    edges = run_query(
        db,
        """
        SELECT from_type, from_id, to_type, to_id, edge_type, evidence, source_connector, created_at
        FROM v_dfm_graph_edges_v3
        WHERE from_id = :eid OR to_id = :eid
        LIMIT :limit
        """,
        {"eid": entity_id, "limit": limit},
    )
    # Collect neighbour node IDs
    neighbour_ids = set()
    for e in edges:
        if e["from_id"] != entity_id:
            neighbour_ids.add(e["from_id"])
        if e["to_id"] != entity_id:
            neighbour_ids.add(e["to_id"])

    neighbour_nodes: list = []
    if neighbour_ids:
        placeholders = ", ".join(f":n{i}" for i, _ in enumerate(neighbour_ids))
        nparams = {f"n{i}": v for i, v in enumerate(neighbour_ids)}
        neighbour_nodes = run_query(
            db,
            f"SELECT node_type, node_id, node_label FROM v_dfm_graph_nodes_v1 WHERE node_id IN ({placeholders})",
            nparams,
        )

    all_nodes = entity_nodes + neighbour_nodes
    return {"nodes": all_nodes, "edges": edges, "entity_id": entity_id}
