from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/supply-chain", tags=["supply_chain"])


@router.get("/network")
def get_supply_chain_network(
    supply_chain_role: str | None = Query(None),
    dfm_tech_code: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Aggregated supply chain network by role and technology (v_dfm_defence_supply_chain_v3)."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if supply_chain_role:
        conditions.append("supply_chain_role ILIKE :supply_chain_role")
        params["supply_chain_role"] = f"%{supply_chain_role}%"
    if dfm_tech_code:
        conditions.append("dfm_tech_code ILIKE :dfm_tech_code")
        params["dfm_tech_code"] = f"%{dfm_tech_code}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT supply_chain_role, dfm_tech_code, contracts, procurement_value
        FROM v_dfm_defence_supply_chain_v3
        WHERE {where}
        ORDER BY procurement_value DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
    count = run_query(
        db,
        f"SELECT COUNT(*) AS total FROM (SELECT 1 FROM v_dfm_defence_supply_chain_v3 WHERE {where} LIMIT 10000) _c",
        count_params,
    )
    return {"data": rows, "total": count[0]["total"] if count else 0, "limit": limit, "offset": offset}


@router.get("/dependencies")
def get_supply_chain_dependencies(
    supply_chain_role: str | None = Query(None),
    dfm_tech_code: str | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Entity-level supply chain dependencies (v_dfm_defence_supply_chain_signal_v1)."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if supply_chain_role:
        conditions.append("supply_chain_role ILIKE :supply_chain_role")
        params["supply_chain_role"] = f"%{supply_chain_role}%"
    if dfm_tech_code:
        conditions.append("dfm_tech_code ILIKE :dfm_tech_code")
        params["dfm_tech_code"] = f"%{dfm_tech_code}%"
    if search:
        conditions.append("official_name ILIKE :search")
        params["search"] = f"%{search}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT entity_id, official_name, supply_chain_role, dfm_tech_code,
               procurement_value, contracts
        FROM v_dfm_defence_supply_chain_signal_v1
        WHERE {where}
        ORDER BY procurement_value DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
    count = run_query(
        db,
        f"SELECT COUNT(*) AS total FROM (SELECT 1 FROM v_dfm_defence_supply_chain_signal_v1 WHERE {where} LIMIT 50000) _c",
        count_params,
    )
    return {"data": rows, "total": count[0]["total"] if count else 0, "limit": limit, "offset": offset}


@router.get("/centrality")
def get_supply_chain_centrality(
    supply_chain_role: str | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Entity supply chain role classification (v_dfm_supply_chain_classifier_v2)."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if supply_chain_role:
        conditions.append("supply_chain_role ILIKE :supply_chain_role")
        params["supply_chain_role"] = f"%{supply_chain_role}%"
    if search:
        conditions.append("official_name ILIKE :search")
        params["search"] = f"%{search}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT entity_id, official_name, supply_chain_role
        FROM v_dfm_supply_chain_classifier_v2
        WHERE {where}
        ORDER BY supply_chain_role, official_name
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
    count = run_query(
        db,
        f"SELECT COUNT(*) AS total FROM (SELECT 1 FROM v_dfm_supply_chain_classifier_v2 WHERE {where} LIMIT 50000) _c",
        count_params,
    )
    return {"data": rows, "total": count[0]["total"] if count else 0, "limit": limit, "offset": offset}


@router.get("/fragility")
def get_supply_chain_fragility(
    pr_code: str | None = Query(None),
    scenario_code: str | None = Query(None),
    pr_fragility: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Priority-level supply chain fragility from v_dfm_pr_full_supply_chain_enriched_v2."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if pr_code:
        conditions.append("pr_code ILIKE :pr_code")
        params["pr_code"] = f"%{pr_code}%"
    if scenario_code:
        conditions.append("scenario_code ILIKE :scenario_code")
        params["scenario_code"] = f"%{scenario_code}%"
    if pr_fragility:
        conditions.append("pr_fragility ILIKE :pr_fragility")
        params["pr_fragility"] = f"%{pr_fragility}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT pr_code, entity_id, tech_code, scenario_code,
               pr_fragility, tech_fragility, tech_remaining_percent
        FROM v_dfm_pr_full_supply_chain_enriched_v2
        WHERE {where}
        ORDER BY pr_fragility DESC NULLS LAST, tech_remaining_percent ASC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
    count = run_query(
        db,
        f"SELECT COUNT(*) AS total FROM (SELECT 1 FROM v_dfm_pr_full_supply_chain_enriched_v2 WHERE {where} LIMIT 50000) _c",
        count_params,
    )
    return {"data": rows, "total": count[0]["total"] if count else 0, "limit": limit, "offset": offset}


@router.get("/entity/{entity_id}")
def get_entity_supply_chain(
    entity_id: str,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Supply chain exposure for a specific entity (v_dfm_defence_supply_chain_signal_v1)."""
    rows = run_query(
        db,
        """
        SELECT entity_id, official_name, supply_chain_role, dfm_tech_code,
               procurement_value, contracts
        FROM v_dfm_defence_supply_chain_signal_v1
        WHERE entity_id = :eid
        ORDER BY procurement_value DESC NULLS LAST
        LIMIT :limit
        """,
        {"eid": entity_id, "limit": limit},
    )
    # Also get tech-based supply chain map for this entity
    tech_map = run_query(
        db,
        """
        SELECT dfm_tech_code, entity_id, official_name, supply_chain_role,
               procurement_total, contracts
        FROM v_dfm_defence_supply_chain_map_v2
        WHERE entity_id = :eid
        ORDER BY procurement_total DESC NULLS LAST
        LIMIT :limit
        """,
        {"eid": entity_id, "limit": limit},
    )
    return {
        "entity_id": entity_id,
        "supply_chain": rows,
        "tech_map": tech_map,
        "supply_chain_count": len(rows),
    }
