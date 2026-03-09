from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/scenario", tags=["scenario"])


@router.get("/entity/{entity_id}")
def entity_scenario(entity_id: str, db: Session = Depends(get_db)):
    """
    Aggregated scenario intelligence for an entity:
    profile + context + ranking + patents + research + procurement + FDI + events.
    """
    profile = run_query(
        db,
        """
        SELECT entity_id, official_name, entity_type_code, hq_country,
               ownership_status, validation_level, is_active
        FROM v_dfm_entity_profile_v1
        WHERE entity_id = :eid
        """,
        {"eid": entity_id},
    )
    ranking = run_query(
        db,
        """
        SELECT entity_id, official_name, headquarters_country_iso2, primary_strategic_code,
               base_score, final_score, highest_trl, supported_op_count, supported_tc_count
        FROM v_dfm_rank_with_scoring_layers_v3
        WHERE entity_id = :eid
        """,
        {"eid": entity_id},
    )
    tech = run_query(
        db,
        """
        SELECT entity_id, dfm_tech_code, patent_count
        FROM v_dfm_entity_tech_from_patents_mv_v1
        WHERE entity_id = :eid
        ORDER BY patent_count DESC
        """,
        {"eid": entity_id},
    )
    research = run_query(
        db,
        """
        SELECT COUNT(*) AS project_count, SUM(ec_contribution) AS total_ec
        FROM v_dfm_entity_research_context_v1
        WHERE entity_id = :eid
        """,
        {"eid": entity_id},
    )
    procurement = run_query(
        db,
        """
        SELECT entity_id, official_name, procurement_total, contracts
        FROM v_dfm_company_procurement_summary_v1
        WHERE entity_id = :eid
        """,
        {"eid": entity_id},
    )
    fdi = run_query(
        db,
        """
        SELECT entity_id, fdi_level_canonical, hq_risk_tier, controller_risk_tier,
               fdi_escalation_flag_canonical, sovereignty_risk_multiplier
        FROM v_entity_fdi_signal_v1
        WHERE entity_id = :eid
        """,
        {"eid": entity_id},
    )
    events = run_query(
        db,
        """
        SELECT entity_id, events_total, total_contract_value, first_event, last_event
        FROM v_dfm_entity_events_v1
        WHERE entity_id = :eid
        """,
        {"eid": entity_id},
    )
    graph_conn = run_query(
        db,
        """
        SELECT COUNT(*) AS edge_count
        FROM v_dfm_graph_edges_v3
        WHERE from_id = :eid OR to_id = :eid
        """,
        {"eid": entity_id},
    )
    normative = run_query(
        db,
        """
        SELECT COUNT(*) AS eval_count,
               COUNT(*) FILTER (WHERE eval_status = 'pass') AS pass_count,
               COUNT(*) FILTER (WHERE eval_status = 'fail') AS fail_count
        FROM v_dfm_entity_normative_eval_v2
        WHERE entity_id = :eid
        """,
        {"eid": entity_id},
    )

    return {
        "entity_id": entity_id,
        "profile": profile[0] if profile else None,
        "ranking": ranking[0] if ranking else None,
        "tech_domains": tech,
        "research": research[0] if research else None,
        "procurement": procurement[0] if procurement else None,
        "fdi": fdi[0] if fdi else None,
        "events": events[0] if events else None,
        "graph_connectivity": graph_conn[0] if graph_conn else {"edge_count": 0},
        "normative_compliance": normative[0] if normative else None,
    }
