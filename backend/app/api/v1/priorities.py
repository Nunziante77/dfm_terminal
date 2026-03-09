from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/priorities", tags=["priorities"])


@router.get("")
def get_priorities(
    pr_id: str | None = Query(None, description="Filter by strategic priority ID"),
    node_level: str | None = Query(None, description="Filter by node_level"),
    limit: int = Query(500, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    """Priority tree from v_dfm_priority_tree_v1. Columns: pr_id, node_id, node_level."""
    conditions = ["1=1"]
    params: dict = {"limit": limit}

    if pr_id:
        conditions.append("pr_id = :pr_id")
        params["pr_id"] = pr_id
    if node_level:
        conditions.append("node_level = :node_level")
        params["node_level"] = node_level

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"SELECT pr_id, node_id, node_level FROM v_dfm_priority_tree_v1 WHERE {where} ORDER BY pr_id, node_level LIMIT :limit",
        params,
    )
    return {"data": rows, "total": len(rows)}


@router.get("/distinct")
def get_distinct_priorities(db: Session = Depends(get_db)):
    """Return distinct pr_id values with entity and node counts."""
    rows = run_query(
        db,
        """
        SELECT
            t.pr_id,
            COUNT(DISTINCT t.node_id)                                  AS node_count,
            COUNT(DISTINCT r.entity_id)                                AS entity_count,
            COUNT(DISTINCT np.doc_id)                                  AS normative_doc_count
        FROM v_dfm_priority_tree_v1 t
        LEFT JOIN v_dfm_rank_with_scoring_layers_v3 r
               ON r.primary_strategic_code = t.pr_id
        LEFT JOIN v_normative_doc_pr_profile_v1 np
               ON np.priority_code = t.pr_id
        GROUP BY t.pr_id
        ORDER BY t.pr_id
        """,
    )
    return {"data": rows, "total": len(rows)}


@router.get("/{pr_id}/nodes")
def get_priority_nodes(pr_id: str, db: Session = Depends(get_db)):
    """All nodes within a given strategic priority."""
    rows = run_query(
        db,
        "SELECT pr_id, node_id, node_level FROM v_dfm_priority_tree_v1 WHERE pr_id = :pr_id ORDER BY node_level",
        {"pr_id": pr_id},
    )
    return {"data": rows, "total": len(rows), "pr_id": pr_id}


@router.get("/{pr_id}/entities")
def get_priority_entities(
    pr_id: str,
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """
    Entities whose primary strategic code matches this priority.
    Uses v_dfm_rank_with_scoring_layers_v3.primary_strategic_code.
    Also checks v_dfm_bloomberg_screener_v3.pr_code for screener-linked entities.
    """
    rows = run_query(
        db,
        """
        SELECT
            entity_id,
            official_name,
            headquarters_country_iso2,
            primary_strategic_code,
            final_score,
            highest_trl,
            supported_op_count,
            supported_tc_count
        FROM v_dfm_rank_with_scoring_layers_v3
        WHERE primary_strategic_code = :pr_id
        ORDER BY final_score DESC NULLS LAST
        LIMIT :limit
        """,
        {"pr_id": pr_id, "limit": limit},
    )
    return {"data": rows, "total": len(rows), "pr_id": pr_id}


@router.get("/{pr_id}/normative")
def get_priority_normative(
    pr_id: str,
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """
    Normative documents covering this strategic priority.
    v_normative_doc_pr_profile_v1 has: doc_id, priority_code, mapping_type,
    total_atoms, pr_atoms, coverage_percent.
    title/issuer/doc_type/published_date come from dfm_normative_documents via JOIN.
    """
    rows = run_query(
        db,
        """
        SELECT
            p.doc_id,
            p.priority_code,
            p.mapping_type,
            p.total_atoms,
            p.pr_atoms,
            p.coverage_percent,
            d.title,
            d.issuer,
            d.doc_type,
            d.published_date
        FROM v_normative_doc_pr_profile_v1 p
        LEFT JOIN dfm_normative_documents d ON d.doc_id = p.doc_id
        WHERE p.priority_code = :pr_id
        ORDER BY p.coverage_percent DESC NULLS LAST
        LIMIT :limit
        """,
        {"pr_id": pr_id, "limit": limit},
    )
    return {"data": rows, "total": len(rows), "pr_id": pr_id}
