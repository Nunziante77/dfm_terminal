from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/screener", tags=["screener"])

ALLOWED_SORT = {
    "official_name", "entity_id", "hq_country", "ownership_status",
    "tech_count", "project_count", "sanction_link_count", "buyer_contract_count",
    "reg_pass_count", "reg_fail_count", "high_fragility_tech_count",
    "min_tech_remaining_percent", "hhi_structural", "pr_remaining_entities",
}


@router.get("")
def screener(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("official_name"),
    sort_dir: str = Query("asc", pattern="^(asc|desc)$"),
    hq_country: str | None = Query(None),
    ownership_status: str | None = Query(None),
    pr_code: str | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Bloomberg-style screener from v_dfm_bloomberg_screener_v3."""
    sort_col = sort_by if sort_by in ALLOWED_SORT else "official_name"
    direction = "DESC" if sort_dir == "desc" else "ASC"

    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if hq_country:
        conditions.append("hq_country ILIKE :hq_country")
        params["hq_country"] = f"%{hq_country}%"
    if ownership_status:
        conditions.append("ownership_status ILIKE :ownership_status")
        params["ownership_status"] = f"%{ownership_status}%"
    if pr_code:
        conditions.append("pr_code ILIKE :pr_code")
        params["pr_code"] = f"%{pr_code}%"
    if search:
        conditions.append("official_name ILIKE :search")
        params["search"] = f"%{search}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT scenario_code, pr_code, entity_id, pr_label, official_name,
               hq_country, ownership_status, pr_remaining_entities, pr_excluded_entities,
               pr_fragility, tech_count, project_count, reg_pass_count, reg_fail_count,
               reg_unknown_count, sanction_link_count, high_fragility_tech_count,
               min_tech_remaining_percent, hhi_structural, buyer_contract_count
        FROM v_dfm_bloomberg_screener_v3
        WHERE {where}
        ORDER BY {sort_col} {direction}
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
    count = run_query(db, f"SELECT COUNT(*) AS total FROM v_dfm_bloomberg_screener_v3 WHERE {where}", count_params)
    return {"data": rows, "total": count[0]["total"] if count else 0, "limit": limit, "offset": offset}
