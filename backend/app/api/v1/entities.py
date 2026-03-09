from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/entities", tags=["entities"])


@router.get("")
def list_entities(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    hq_country: str | None = Query(None),
    ownership_status: str | None = Query(None),
    is_active: bool | None = Query(None),
    db: Session = Depends(get_db),
):
    """List entities from v_dfm_entity_profile_v1."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if hq_country:
        conditions.append("hq_country ILIKE :hq_country")
        params["hq_country"] = f"%{hq_country}%"
    if ownership_status:
        conditions.append("ownership_status ILIKE :ownership_status")
        params["ownership_status"] = f"%{ownership_status}%"
    if is_active is not None:
        conditions.append("is_active = :is_active")
        params["is_active"] = is_active

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT entity_id, official_name, entity_type_code, name_norm,
               hq_country, ownership_status, validation_level, is_active
        FROM v_dfm_entity_profile_v1
        WHERE {where}
        ORDER BY official_name
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    count_row = run_query(
        db,
        f"SELECT COUNT(*) AS total FROM v_dfm_entity_profile_v1 WHERE {where}",
        {k: v for k, v in params.items() if k not in ("limit", "offset")},
    )
    return {"data": rows, "total": count_row[0]["total"] if count_row else 0, "limit": limit, "offset": offset}


@router.get("/compare/multi")
def compare_entities(
    ids: str = Query(..., description="Comma-separated entity IDs"),
    db: Session = Depends(get_db),
):
    """Compare multiple entities (max 10)."""
    id_list = [i.strip() for i in ids.split(",") if i.strip()]
    if len(id_list) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 entity IDs")
    if len(id_list) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 entities")

    placeholders = ", ".join(f":id{i}" for i in range(len(id_list)))
    params = {f"id{i}": v for i, v in enumerate(id_list)}

    profiles = run_query(
        db,
        f"""
        SELECT entity_id, official_name, entity_type_code, hq_country, ownership_status,
               validation_level, is_active
        FROM v_dfm_entity_profile_v1
        WHERE entity_id IN ({placeholders})
        """,
        params,
    )
    rankings = run_query(
        db,
        f"""
        SELECT entity_id, official_name, headquarters_country_iso2, primary_strategic_code,
               base_score, final_score, highest_trl, supported_op_count, supported_tc_count
        FROM v_dfm_rank_with_scoring_layers_v3
        WHERE entity_id IN ({placeholders})
        """,
        params,
    )
    tech = run_query(
        db,
        f"""
        SELECT entity_id, dfm_tech_code, patent_count
        FROM v_dfm_entity_tech_from_patents_mv_v1
        WHERE entity_id IN ({placeholders})
        """,
        params,
    )
    screener = run_query(
        db,
        f"""
        SELECT entity_id, reg_pass_count, reg_fail_count, sanction_link_count,
               buyer_contract_count, pr_fragility, tech_count, hhi_structural
        FROM v_dfm_bloomberg_screener_v3
        WHERE entity_id IN ({placeholders})
        """,
        params,
    )
    return {
        "profiles": profiles,
        "rankings": rankings,
        "tech_from_patents": tech,
        "screener": screener,
        "entity_ids": id_list,
    }


@router.get("/{entity_id}/profile")
def get_entity_profile(entity_id: str, db: Session = Depends(get_db)):
    rows = run_query(
        db,
        """
        SELECT entity_id, official_name, entity_type_code, name_norm,
               hq_country, ownership_status, validation_level, is_active
        FROM v_dfm_entity_profile_v1
        WHERE entity_id = :eid
        """,
        {"eid": entity_id},
    )
    if not rows:
        raise HTTPException(status_code=404, detail=f"Entity '{entity_id}' not found")
    return rows[0]


@router.get("/{entity_id}/context")
def get_entity_context(entity_id: str, db: Session = Depends(get_db)):
    rows = run_query(
        db,
        """
        SELECT entity_id, official_name, hq_country, ownership_status,
               dfm_tech_code, pr_code, normative_atom_id, normative_eval_evidence,
               sanction_entity_id, project_id
        FROM v_dfm_entity_context_v1
        WHERE entity_id = :eid
        """,
        {"eid": entity_id},
    )
    if not rows:
        raise HTTPException(status_code=404, detail=f"Context for entity '{entity_id}' not found")
    # context view can return multiple rows (one per tech/project/atom combo)
    return {"entity_id": entity_id, "context_rows": rows, "count": len(rows)}


@router.get("/{entity_id}/ranking")
def get_entity_ranking(entity_id: str, db: Session = Depends(get_db)):
    rows = run_query(
        db,
        """
        SELECT entity_id, official_name, headquarters_country_iso2, primary_strategic_code,
               base_score, strategic_weight_multiplier, highest_trl, trl_modifier,
               industrial_modifier, regulatory_signal_code, regulatory_modifier,
               capital_signal_code, capital_modifier, supported_op_count, supported_tc_count,
               depth_modifier, final_score
        FROM v_dfm_rank_with_scoring_layers_v3
        WHERE entity_id = :eid
        """,
        {"eid": entity_id},
    )
    if not rows:
        raise HTTPException(status_code=404, detail=f"Ranking for entity '{entity_id}' not found")
    return rows[0]
