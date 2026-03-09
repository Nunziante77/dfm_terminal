from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/ownership", tags=["ownership"])


@router.get("")
def list_ownership(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    controller_country_iso2: str | None = Query(None),
    board_control_flag: bool | None = Query(None),
    has_special_rights: bool | None = Query(None),
    db: Session = Depends(get_db),
):
    """Aggregated ownership data from v_entity_ownership_aggregated_v2."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if controller_country_iso2:
        conditions.append("controller_country_iso2 ILIKE :cc")
        params["cc"] = f"%{controller_country_iso2}%"
    if board_control_flag is not None:
        conditions.append("board_control_flag = :bcf")
        params["bcf"] = board_control_flag
    if has_special_rights is not None:
        conditions.append("has_special_rights = :hsr")
        params["hsr"] = has_special_rights

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT entity_id, controller_name, controller_country_iso2, beneficial_owner_name,
               shareholding_percentage, voting_rights_percentage, has_special_rights,
               board_control_flag, beneficial_owner_verified, total_confidence_weight,
               last_evidence_publication_date, last_evidence_ingested_at
        FROM v_entity_ownership_aggregated_v2
        WHERE {where}
        ORDER BY shareholding_percentage DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    return {"data": rows, "total": len(rows), "limit": limit, "offset": offset}


@router.get("/entity/{entity_id}")
def entity_ownership(entity_id: str, db: Session = Depends(get_db)):
    """Full ownership structure for an entity."""
    ownership = run_query(
        db,
        """
        SELECT entity_id, controller_name, controller_country_iso2, beneficial_owner_name,
               shareholding_percentage, voting_rights_percentage, has_special_rights,
               board_control_flag, beneficial_owner_verified, total_confidence_weight,
               last_evidence_publication_date, last_evidence_ingested_at
        FROM v_entity_ownership_aggregated_v2
        WHERE entity_id = :eid
        ORDER BY shareholding_percentage DESC NULLS LAST
        """,
        {"eid": entity_id},
    )
    return {"entity_id": entity_id, "ownership": ownership, "owner_count": len(ownership)}


@router.get("/fdi")
def list_fdi_signals(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    hq_iso2: str | None = Query(None),
    controller_iso2: str | None = Query(None),
    fdi_escalation_flag_canonical: bool | None = Query(None),
    is_nato_member: bool | None = Query(None),
    db: Session = Depends(get_db),
):
    """FDI signals from v_entity_fdi_signal_v1."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if hq_iso2:
        conditions.append("hq_iso2 ILIKE :hq_iso2")
        params["hq_iso2"] = f"%{hq_iso2}%"
    if controller_iso2:
        conditions.append("controller_iso2 ILIKE :controller_iso2")
        params["controller_iso2"] = f"%{controller_iso2}%"
    if fdi_escalation_flag_canonical is not None:
        conditions.append("fdi_escalation_flag_canonical = :fef")
        params["fef"] = fdi_escalation_flag_canonical
    if is_nato_member is not None:
        conditions.append("is_nato_member = :inm")
        params["inm"] = is_nato_member

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT entity_id, official_name, fdi_level_json, fdi_level_canonical,
               hq_iso2, controller_iso2, hq_risk_tier, controller_risk_tier,
               is_eu_member, is_security_framework_country, is_strategic_partner,
               is_nato_member, fdi_tech_sensitivity_level, sovereignty_risk_multiplier,
               fdi_escalation_flag_canonical
        FROM v_entity_fdi_signal_v1
        WHERE {where}
        ORDER BY sovereignty_risk_multiplier DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    return {"data": rows, "total": len(rows), "limit": limit, "offset": offset}


@router.get("/fdi/entity/{entity_id}")
def entity_fdi(entity_id: str, db: Session = Depends(get_db)):
    """FDI signal + regulatory workflow for a specific entity."""
    signal = run_query(
        db,
        """
        SELECT entity_id, official_name, fdi_level_json, fdi_level_canonical,
               hq_iso2, controller_iso2, hq_risk_tier, controller_risk_tier,
               is_eu_member, is_security_framework_country, is_strategic_partner,
               is_nato_member, fdi_tech_sensitivity_level, sovereignty_risk_multiplier,
               fdi_escalation_flag_canonical
        FROM v_entity_fdi_signal_v1
        WHERE entity_id = :eid
        """,
        {"eid": entity_id},
    )
    workflow = run_query(
        db,
        """
        SELECT entity_id, official_name, hq_iso2, controller_iso2, is_eu_member,
               is_security_framework_country, is_strategic_partner, is_nato_member,
               hq_risk_tier, controller_risk_tier, is_state_controlled,
               is_state_controlled_third_country, is_third_country_controlled,
               fdi_procedure_level, fdi_escalation_flag, fdi_monitoring_flag
        FROM v_fdi_regulatory_workflow_final
        WHERE entity_id = :eid
        """,
        {"eid": entity_id},
    )
    return {
        "entity_id": entity_id,
        "fdi_signal": signal[0] if signal else None,
        "regulatory_workflow": workflow[0] if workflow else None,
    }


@router.get("/fdi/workflow")
def fdi_workflow_list(
    fdi_escalation_flag: bool | None = Query(None),
    fdi_procedure_level: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """FDI regulatory workflow decisions from v_fdi_regulatory_workflow_final."""
    conditions = ["1=1"]
    params: dict = {"limit": limit}

    if fdi_escalation_flag is not None:
        conditions.append("fdi_escalation_flag = :fef")
        params["fef"] = fdi_escalation_flag
    if fdi_procedure_level:
        conditions.append("fdi_procedure_level ILIKE :fpl")
        params["fpl"] = f"%{fdi_procedure_level}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT entity_id, official_name, hq_iso2, controller_iso2, is_eu_member,
               is_security_framework_country, is_strategic_partner, is_nato_member,
               hq_risk_tier, controller_risk_tier, is_state_controlled,
               is_state_controlled_third_country, is_third_country_controlled,
               fdi_procedure_level, fdi_escalation_flag, fdi_monitoring_flag
        FROM v_fdi_regulatory_workflow_final
        WHERE {where}
        ORDER BY fdi_escalation_flag DESC NULLS LAST, entity_id
        LIMIT :limit
        """,
        params,
    )
    return {"data": rows, "total": len(rows)}
