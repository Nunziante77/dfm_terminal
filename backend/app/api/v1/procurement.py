from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/procurement", tags=["procurement"])


@router.get("")
def list_procurement(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    country_code: str | None = Query(None),
    cpv_main: str | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """TED procurement notices from v_dfm_entity_procurement_ted_v1."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if country_code:
        conditions.append("country_code ILIKE :country_code")
        params["country_code"] = f"%{country_code}%"
    if cpv_main:
        conditions.append("cpv_main ILIKE :cpv_main")
        params["cpv_main"] = f"%{cpv_main}%"
    if search:
        conditions.append("(title ILIKE :search OR authority_name ILIKE :search)")
        params["search"] = f"%{search}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT contract_id, notice_id, published_at, country_code,
               authority_name, cpv_main, contract_value, currency, title, promoted_at
        FROM v_dfm_entity_procurement_ted_v1
        WHERE {where}
        ORDER BY published_at DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
    # Cap the count scan at 50 000 rows to avoid full-table scans on large views
    count = run_query(
        db,
        f"SELECT COUNT(*) AS total FROM (SELECT 1 FROM v_dfm_entity_procurement_ted_v1 WHERE {where} LIMIT 50000) _c",
        count_params,
    )
    return {"data": rows, "total": count[0]["total"] if count else 0, "limit": limit, "offset": offset}


@router.get("/awards")
def list_awards(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    country_code: str | None = Query(None),
    cpv_main: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """TED contract awards from v_dfm_ted_awards_v2 (supplier-level, unlinked)."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if country_code:
        conditions.append("country_code ILIKE :country_code")
        params["country_code"] = f"%{country_code}%"
    if cpv_main:
        conditions.append("cpv_main ILIKE :cpv_main")
        params["cpv_main"] = f"%{cpv_main}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT supplier_name, contract_value, country_code, cpv_main
        FROM v_dfm_ted_awards_v2
        WHERE {where}
        ORDER BY contract_value DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    return {"data": rows, "total": len(rows), "limit": limit, "offset": offset}


@router.get("/awards/linked")
def list_linked_awards(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    entity_id: str | None = Query(None),
    country_code: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """TED awards linked to entities from v_dfm_ted_awards_linked_v3."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if entity_id:
        conditions.append("entity_id = :entity_id")
        params["entity_id"] = entity_id
    if country_code:
        conditions.append("country_code ILIKE :country_code")
        params["country_code"] = f"%{country_code}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT entity_id, supplier_name, contract_value, country_code, cpv_main, score
        FROM v_dfm_ted_awards_linked_v3
        WHERE {where}
        ORDER BY contract_value DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
    # Cap the count scan at 50 000 rows to avoid full-table scans on large views
    count = run_query(
        db,
        f"SELECT COUNT(*) AS total FROM (SELECT 1 FROM v_dfm_ted_awards_linked_v3 WHERE {where} LIMIT 50000) _c",
        count_params,
    )
    return {"data": rows, "total": count[0]["total"] if count else 0, "limit": limit, "offset": offset}


@router.get("/entity/{entity_id}")
def entity_procurement(entity_id: str, limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db)):
    """Procurement awards for a specific entity from linked view."""
    awards = run_query(
        db,
        """
        SELECT entity_id, supplier_name, contract_value, country_code, cpv_main, score
        FROM v_dfm_ted_awards_linked_v3
        WHERE entity_id = :eid
        ORDER BY contract_value DESC NULLS LAST
        LIMIT :limit
        """,
        {"eid": entity_id, "limit": limit},
    )
    summary = run_query(
        db,
        """
        SELECT entity_id, official_name, procurement_total, contracts
        FROM v_dfm_company_procurement_summary_v1
        WHERE entity_id = :eid
        """,
        {"eid": entity_id},
    )
    return {
        "entity_id": entity_id,
        "awards": awards,
        "summary": summary[0] if summary else None,
        "award_count": len(awards),
    }


@router.get("/summary")
def procurement_summary(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Aggregated procurement summary per entity."""
    rows = run_query(
        db,
        """
        SELECT entity_id, official_name, procurement_total, contracts
        FROM v_dfm_company_procurement_summary_v1
        ORDER BY procurement_total DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        {"limit": limit, "offset": offset},
    )
    return {"data": rows, "total": len(rows)}


@router.get("/signals")
def procurement_signals(db: Session = Depends(get_db)):
    """Procurement signals by technology code from v_dfm_procurement_signals_v3."""
    rows = run_query(
        db,
        "SELECT dfm_tech_code, procurement_value, contracts FROM v_dfm_procurement_signals_v3 ORDER BY procurement_value DESC NULLS LAST",
    )
    return {"data": rows, "total": len(rows)}
