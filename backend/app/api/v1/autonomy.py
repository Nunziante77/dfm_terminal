from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/autonomy", tags=["autonomy"])


@router.get("/index")
def get_autonomy_index(
    scenario_code: str | None = Query(None),
    pr_code: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Strategic autonomy index — concentration per priority (v_dfm_pr_concentration_index_v2).
    Higher HHI_structural indicates higher concentration risk / lower autonomy."""
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


@router.get("/gaps")
def get_autonomy_gaps(
    scenario_code: str | None = Query(None),
    pr_code: str | None = Query(None),
    autonomy_flag: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Flagged strategic autonomy gaps (v_dfm_pr_autonomy_gap_flags_v1).
    autonomy_flag values indicate degree of EU self-sufficiency per priority."""
    conditions = ["1=1"]
    params: dict = {"limit": limit}

    if scenario_code:
        conditions.append("scenario_code = :scenario_code")
        params["scenario_code"] = scenario_code
    if pr_code:
        conditions.append("pr_code ILIKE :pr_code")
        params["pr_code"] = f"%{pr_code}%"
    if autonomy_flag:
        conditions.append("autonomy_flag ILIKE :autonomy_flag")
        params["autonomy_flag"] = f"%{autonomy_flag}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT scenario_code, pr_code, eu_entities_remaining,
               non_eu_entities_remaining, autonomy_flag
        FROM v_dfm_pr_autonomy_gap_flags_v1
        WHERE {where}
        ORDER BY non_eu_entities_remaining DESC NULLS LAST
        LIMIT :limit
        """,
        params,
    )
    return {"data": rows, "total": len(rows)}


@router.get("/dependencies")
def get_autonomy_dependencies(
    scenario_code: str | None = Query(None),
    pr_code: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """EU vs non-EU entity distribution per strategic priority (v_dfm_pr_autonomy_gap_v1)."""
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
        SELECT scenario_code, pr_code, eu_entities_remaining, non_eu_entities_remaining
        FROM v_dfm_pr_autonomy_gap_v1
        WHERE {where}
        ORDER BY non_eu_entities_remaining DESC NULLS LAST
        LIMIT :limit
        """,
        params,
    )
    return {"data": rows, "total": len(rows)}
