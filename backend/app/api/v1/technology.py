from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/technology", tags=["technology"])


@router.get("/clusters")
def get_technology_clusters(
    dfm_tech_code: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Technology market landscape — demand by tech code (v_dfm_defence_technology_market_v3)."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if dfm_tech_code:
        conditions.append("dfm_tech_code ILIKE :dfm_tech_code")
        params["dfm_tech_code"] = f"%{dfm_tech_code}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT dfm_tech_code, contracts, procurement_value, suppliers
        FROM v_dfm_defence_technology_market_v3
        WHERE {where}
        ORDER BY procurement_value DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    return {"data": rows, "total": len(rows), "limit": limit, "offset": offset}


@router.get("/concentration")
def get_technology_concentration(
    scenario_code: str | None = Query(None),
    pr_code: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Industrial concentration index per strategic priority (v_dfm_pr_concentration_index_v2)."""
    conditions = ["1=1"]
    params: dict = {"limit": limit}

    if scenario_code:
        conditions.append("scenario_code = :scenario_code")
        params["scenario_code"] = scenario_code
    if pr_code:
        conditions.append("pr_code ILIKE :pr_code")
        params["pr_code"] = f"%{pr_code}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT scenario_code, pr_code, entity_count, total_tech_counts, hhi_structural
        FROM v_dfm_pr_concentration_index_v2
        WHERE {where}
        ORDER BY hhi_structural DESC NULLS LAST
        LIMIT :limit
        """,
        params,
    )
    return {"data": rows, "total": len(rows)}


@router.get("/vulnerabilities")
def get_technology_vulnerabilities(
    country_code: str | None = Query(None),
    dfm_tech_code: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Technology demand by country — exposure map (v_dfm_defence_technology_demand_by_country_v2)."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if country_code:
        conditions.append("country_code ILIKE :country_code")
        params["country_code"] = f"%{country_code}%"
    if dfm_tech_code:
        conditions.append("dfm_tech_code ILIKE :dfm_tech_code")
        params["dfm_tech_code"] = f"%{dfm_tech_code}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT country_code, dfm_tech_code, contracts, procurement_value
        FROM v_dfm_defence_technology_demand_by_country_v2
        WHERE {where}
        ORDER BY procurement_value DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    return {"data": rows, "total": len(rows), "limit": limit, "offset": offset}


@router.get("/entity/{entity_id}")
def get_entity_technology(
    entity_id: str,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Technology exposure for a specific entity (v_dfm_entity_tech_union_v1)."""
    rows = run_query(
        db,
        """
        SELECT entity_id, dfm_tech_code, patent_count, source_layer
        FROM v_dfm_entity_tech_union_v1
        WHERE entity_id = :eid
        ORDER BY patent_count DESC NULLS LAST
        LIMIT :limit
        """,
        {"eid": entity_id, "limit": limit},
    )
    return {
        "entity_id": entity_id,
        "tech_domains": rows,
        "tech_count": len(rows),
    }
