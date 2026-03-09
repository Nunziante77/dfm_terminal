from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
def unified_search(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
    domain: str = Query("all", description="all | entities | patents | procurement | normative | strategic"),
    db: Session = Depends(get_db),
):
    """Unified search across entities, patents, procurement, normative and strategic documents."""
    pattern = f"%{q}%"
    results: dict = {}

    if domain in ("all", "entities"):
        results["entities"] = run_query(
            db,
            """
            SELECT entity_id, official_name, entity_type_code, hq_country, ownership_status, is_active
            FROM v_dfm_entity_profile_v1
            WHERE official_name ILIKE :p OR name_norm ILIKE :p OR entity_id ILIKE :p
            LIMIT :lim
            """,
            {"p": pattern, "lim": limit},
        )

    if domain in ("all", "patents"):
        results["patents"] = run_query(
            db,
            """
            SELECT p.patent_id, p.family_id, p.cpc_codes, l.entity_id, l.link_type, l.confidence_score
            FROM v_dfm_patent_records_canonical_v1 p
            LEFT JOIN v_company_patent_links_resolved_v1 l ON l.patent_id = p.patent_id
            WHERE p.patent_id ILIKE :p OR p.family_id ILIKE :p
            LIMIT :lim
            """,
            {"p": pattern, "lim": limit},
        )

    if domain in ("all", "procurement"):
        results["procurement"] = run_query(
            db,
            """
            SELECT contract_id, notice_id, published_at, country_code,
                   authority_name, cpv_main, contract_value, currency, title
            FROM v_dfm_entity_procurement_ted_v1
            WHERE title ILIKE :p OR authority_name ILIKE :p OR cpv_main ILIKE :p
            LIMIT :lim
            """,
            {"p": pattern, "lim": limit},
        )

    if domain in ("all", "normative"):
        results["normative"] = run_query(
            db,
            """
            SELECT doc_id, title, doc_type, issuer, published_date, language_code
            FROM dfm_normative_documents
            WHERE title ILIKE :p OR issuer ILIKE :p OR doc_id ILIKE :p
            LIMIT :lim
            """,
            {"p": pattern, "lim": limit},
        )

    if domain in ("all", "strategic"):
        results["strategic"] = run_query(
            db,
            """
            SELECT doc_id, issuer, doc_type, strategic_level, geographic_scope, published_date, layer_class
            FROM dfm_strategic_documents
            WHERE issuer ILIKE :p OR doc_type ILIKE :p OR doc_id ILIKE :p OR geographic_scope ILIKE :p
            LIMIT :lim
            """,
            {"p": pattern, "lim": limit},
        )

    total = sum(len(v) for v in results.values())
    return {"query": q, "domain": domain, "total": total, "results": results}
