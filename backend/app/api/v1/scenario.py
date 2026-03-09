from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/scenario", tags=["scenario"])


@router.get("/entity/{entity_id}")
def entity_scenario(entity_id: str, db: Session = Depends(get_db)):
    """
    Aggregate scenario intelligence for an entity:
    combines profile, context, rankings, and graph connectivity.
    """
    profile = run_query(
        db,
        "SELECT * FROM v_dfm_entity_profile_v1 WHERE CAST(entity_id AS TEXT) = :eid",
        {"eid": entity_id},
    )
    context = run_query(
        db,
        "SELECT * FROM v_dfm_entity_context_v1 WHERE CAST(entity_id AS TEXT) = :eid",
        {"eid": entity_id},
    )
    ranking = run_query(
        db,
        "SELECT * FROM v_dfm_rank_with_scoring_layers_v3 WHERE CAST(entity_id AS TEXT) = :eid",
        {"eid": entity_id},
    )
    connections = run_query(
        db,
        """
        SELECT COUNT(*) AS edge_count
        FROM v_dfm_graph_edges_v3
        WHERE CAST(source_id AS TEXT) = :eid OR CAST(target_id AS TEXT) = :eid
        """,
        {"eid": entity_id},
    )
    return {
        "entity_id": entity_id,
        "profile": profile[0] if profile else None,
        "context": context[0] if context else None,
        "ranking": ranking[0] if ranking else None,
        "graph_connectivity": connections[0] if connections else {"edge_count": 0},
    }
