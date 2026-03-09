from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/entities", tags=["entities"])


@router.get("")
def list_entities(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List all entities from the entity profile view."""
    rows = run_query(
        db,
        "SELECT * FROM v_dfm_entity_profile_v1 LIMIT :limit OFFSET :offset",
        {"limit": limit, "offset": offset},
    )
    count = run_query(db, "SELECT COUNT(*) AS total FROM v_dfm_entity_profile_v1")
    total = count[0]["total"] if count else 0
    return {"data": rows, "total": total, "limit": limit, "offset": offset}


@router.get("/{entity_id}/profile")
def get_entity_profile(entity_id: str, db: Session = Depends(get_db)):
    """Full entity profile from v_dfm_entity_profile_v1."""
    rows = run_query(
        db,
        "SELECT * FROM v_dfm_entity_profile_v1 WHERE CAST(entity_id AS TEXT) = :eid",
        {"eid": entity_id},
    )
    if not rows:
        raise HTTPException(status_code=404, detail=f"Entity '{entity_id}' not found")
    return rows[0]


@router.get("/{entity_id}/context")
def get_entity_context(entity_id: str, db: Session = Depends(get_db)):
    """Entity context/intelligence from v_dfm_entity_context_v1."""
    rows = run_query(
        db,
        "SELECT * FROM v_dfm_entity_context_v1 WHERE CAST(entity_id AS TEXT) = :eid",
        {"eid": entity_id},
    )
    if not rows:
        raise HTTPException(status_code=404, detail=f"Context for entity '{entity_id}' not found")
    return rows[0]


@router.get("/{entity_id}/ranking")
def get_entity_ranking(entity_id: str, db: Session = Depends(get_db)):
    """Ranking and scoring layers for a specific entity."""
    rows = run_query(
        db,
        """
        SELECT *
        FROM v_dfm_rank_with_scoring_layers_v3
        WHERE CAST(entity_id AS TEXT) = :eid
        """,
        {"eid": entity_id},
    )
    if not rows:
        raise HTTPException(status_code=404, detail=f"Ranking for entity '{entity_id}' not found")
    return rows[0]


@router.get("/compare/multi")
def compare_entities(
    ids: str = Query(..., description="Comma-separated entity IDs"),
    db: Session = Depends(get_db),
):
    """Compare multiple entities side-by-side."""
    id_list = [i.strip() for i in ids.split(",") if i.strip()]
    if len(id_list) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 entity IDs")
    if len(id_list) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 entities for comparison")

    placeholders = ", ".join(f":id{i}" for i in range(len(id_list)))
    params = {f"id{i}": v for i, v in enumerate(id_list)}

    profiles = run_query(
        db,
        f"SELECT * FROM v_dfm_entity_profile_v1 WHERE CAST(entity_id AS TEXT) IN ({placeholders})",
        params,
    )
    rankings = run_query(
        db,
        f"""
        SELECT * FROM v_dfm_rank_with_scoring_layers_v3
        WHERE CAST(entity_id AS TEXT) IN ({placeholders})
        """,
        params,
    )
    return {"profiles": profiles, "rankings": rankings, "entity_ids": id_list}
