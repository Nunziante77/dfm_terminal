from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/capabilities", tags=["capabilities"])


@router.get("/demand")
def get_capability_demand(
    dfm_tech_code: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Capability demand by technology — total procurement and supplier count (v_dfm_defence_technology_market_v3)."""
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
        ORDER BY contracts DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    return {"data": rows, "total": len(rows), "limit": limit, "offset": offset}


@router.get("/gaps")
def get_capability_gaps(
    supply_chain_role: str | None = Query(None),
    dfm_tech_code: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Capability gaps by supply chain role and technology (v_dfm_procurement_supply_chain_v4)."""
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
        FROM v_dfm_procurement_supply_chain_v4
        WHERE {where}
        ORDER BY procurement_value DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    return {"data": rows, "total": len(rows), "limit": limit, "offset": offset}


@router.get("/by-technology")
def get_capabilities_by_technology(
    country_code: str | None = Query(None),
    dfm_tech_code: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Capability demand by country and technology (v_dfm_defence_technology_demand_by_country_v2)."""
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
