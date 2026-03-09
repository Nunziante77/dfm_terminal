from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/research", tags=["research"])


@router.get("")
def list_research(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    hq_country: str | None = Query(None),
    role: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Research project participations from v_dfm_entity_research_context_v1."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if hq_country:
        conditions.append("hq_country ILIKE :hq_country")
        params["hq_country"] = f"%{hq_country}%"
    if role:
        conditions.append("role ILIKE :role")
        params["role"] = f"%{role}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT entity_id, official_name, hq_country, project_id, role,
               ec_contribution, participation_created_at
        FROM v_dfm_entity_research_context_v1
        WHERE {where}
        ORDER BY ec_contribution DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
    count = run_query(db, f"SELECT COUNT(*) AS total FROM v_dfm_entity_research_context_v1 WHERE {where}", count_params)
    return {"data": rows, "total": count[0]["total"] if count else 0, "limit": limit, "offset": offset}


@router.get("/entity/{entity_id}")
def entity_research(entity_id: str, db: Session = Depends(get_db)):
    """All research participations for a specific entity."""
    rows = run_query(
        db,
        """
        SELECT entity_id, official_name, hq_country, project_id, role,
               ec_contribution, participation_created_at
        FROM v_dfm_entity_research_context_v1
        WHERE entity_id = :eid
        ORDER BY participation_created_at DESC NULLS LAST
        """,
        {"eid": entity_id},
    )
    total_ec = sum(float(r["ec_contribution"] or 0) for r in rows)
    return {"data": rows, "total": len(rows), "entity_id": entity_id, "total_ec_contribution": total_ec}


@router.get("/project/{project_id}")
def project_participants(project_id: str, db: Session = Depends(get_db)):
    """All participants in a given research project."""
    rows = run_query(
        db,
        """
        SELECT entity_id, official_name, hq_country, project_id, role,
               ec_contribution, participation_created_at
        FROM v_dfm_entity_research_context_v1
        WHERE project_id = :pid
        ORDER BY ec_contribution DESC NULLS LAST
        """,
        {"pid": project_id},
    )
    return {"data": rows, "total": len(rows), "project_id": project_id}
