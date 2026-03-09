from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/rankings", tags=["rankings"])

ALLOWED_SORT = {
    "entity_id", "official_name", "headquarters_country_iso2", "primary_strategic_code",
    "base_score", "final_score", "highest_trl", "supported_op_count", "supported_tc_count",
}


@router.get("")
def get_rankings(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("final_score"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    primary_strategic_code: str | None = Query(None),
    country: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Rankings with scoring layers from v_dfm_rank_with_scoring_layers_v3."""
    sort_col = sort_by if sort_by in ALLOWED_SORT else "final_score"
    direction = "DESC" if sort_dir == "desc" else "ASC"

    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if primary_strategic_code:
        conditions.append("primary_strategic_code ILIKE :psc")
        params["psc"] = f"%{primary_strategic_code}%"
    if country:
        conditions.append("headquarters_country_iso2 ILIKE :country")
        params["country"] = f"%{country}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT entity_id, official_name, headquarters_country_iso2, primary_strategic_code,
               base_score, strategic_weight_multiplier, highest_trl, trl_modifier,
               industrial_modifier, regulatory_signal_code, regulatory_modifier,
               capital_signal_code, capital_modifier, supported_op_count, supported_tc_count,
               depth_modifier, final_score
        FROM v_dfm_rank_with_scoring_layers_v3
        WHERE {where}
        ORDER BY {sort_col} {direction}
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
    count = run_query(db, f"SELECT COUNT(*) AS total FROM v_dfm_rank_with_scoring_layers_v3 WHERE {where}", count_params)
    return {"data": rows, "total": count[0]["total"] if count else 0, "limit": limit, "offset": offset}
