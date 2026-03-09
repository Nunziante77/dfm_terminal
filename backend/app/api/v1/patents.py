from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/patents", tags=["patents"])


@router.get("")
def list_patents(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    family_id: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Patent records from v_dfm_patent_records_canonical_v1."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if family_id:
        conditions.append("family_id = :family_id")
        params["family_id"] = family_id

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"SELECT patent_id, family_id, cpc_codes FROM v_dfm_patent_records_canonical_v1 WHERE {where} LIMIT :limit OFFSET :offset",
        params,
    )
    return {"data": rows, "total": len(rows), "limit": limit, "offset": offset}


@router.get("/entity/{entity_id}")
def entity_patents(
    entity_id: str,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """All patents linked to an entity via v_company_patent_links_resolved_v1 + canonical metadata."""
    links = run_query(
        db,
        """
        SELECT l.patent_id, l.entity_id, l.link_type, l.confidence_score, l.evidence_text,
               p.family_id, p.cpc_codes
        FROM v_company_patent_links_resolved_v1 l
        LEFT JOIN v_dfm_patent_records_canonical_v1 p ON p.patent_id = l.patent_id
        WHERE l.entity_id = :eid
        ORDER BY l.confidence_score DESC
        LIMIT :limit
        """,
        {"eid": entity_id, "limit": limit},
    )
    return {"data": links, "total": len(links), "entity_id": entity_id}


@router.get("/entity/{entity_id}/tech")
def entity_tech_from_patents(entity_id: str, db: Session = Depends(get_db)):
    """Technology domains inferred from entity's patents."""
    rows = run_query(
        db,
        """
        SELECT entity_id, dfm_tech_code, patent_count
        FROM v_dfm_entity_tech_from_patents_mv_v1
        WHERE entity_id = :eid
        ORDER BY patent_count DESC
        """,
        {"eid": entity_id},
    )
    return {"data": rows, "total": len(rows), "entity_id": entity_id}


@router.get("/tech-signals")
def tech_signals(
    dfm_tech_code: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Technology signals aggregated by entity from patent data."""
    conditions = ["1=1"]
    params: dict = {"limit": limit}
    if dfm_tech_code:
        conditions.append("dfm_tech_code = :tc")
        params["tc"] = dfm_tech_code
    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT entity_id, dfm_tech_code, patent_count
        FROM v_dfm_entity_tech_from_patents_mv_v1
        WHERE {where}
        ORDER BY patent_count DESC
        LIMIT :limit
        """,
        params,
    )
    return {"data": rows, "total": len(rows)}
