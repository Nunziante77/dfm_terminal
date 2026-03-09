from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query
from collections import Counter

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("/summary")
def get_compliance_summary(
    entity_id: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Aggregate PASS/FAIL/UNKNOWN counts for an entity from v_dfm_entity_normative_eval_v2."""
    if not entity_id:
        return {"entity_id": None, "pass_count": None, "fail_count": None, "unknown_count": None, "total_count": None}
    rows = run_query(
        db,
        """
        SELECT
            COUNT(*) FILTER (WHERE eval_status ILIKE 'pass')  AS pass_count,
            COUNT(*) FILTER (WHERE eval_status ILIKE 'fail')  AS fail_count,
            COUNT(*) FILTER (WHERE eval_status NOT ILIKE 'pass' AND eval_status NOT ILIKE 'fail') AS unknown_count,
            COUNT(*) AS total_count
        FROM v_dfm_entity_normative_eval_v2
        WHERE entity_id = :entity_id
        """,
        {"entity_id": entity_id},
    )
    row = rows[0] if rows else {}
    return {
        "entity_id": entity_id,
        "pass_count":    row.get("pass_count", 0),
        "fail_count":    row.get("fail_count", 0),
        "unknown_count": row.get("unknown_count", 0),
        "total_count":   row.get("total_count", 0),
    }


@router.get("")
def list_compliance(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    eval_status: str | None = Query(None),
    doc_id: str | None = Query(None),
    entity_id: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Normative compliance evaluations from v_dfm_entity_normative_eval_v2."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if eval_status:
        conditions.append("e.eval_status ILIKE :eval_status")
        params["eval_status"] = f"%{eval_status}%"
    if doc_id:
        conditions.append("e.doc_id = :doc_id")
        params["doc_id"] = doc_id
    if entity_id:
        conditions.append("e.entity_id = :entity_id")
        params["entity_id"] = entity_id

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT e.entity_id, e.doc_id, e.atom_id, e.eval_status,
               d.title, d.doc_type, d.issuer
        FROM v_dfm_entity_normative_eval_v2 e
        LEFT JOIN dfm_normative_documents d ON d.doc_id = e.doc_id
        WHERE {where}
        ORDER BY e.entity_id, e.doc_id, e.atom_id
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    return {"data": rows, "total": len(rows), "limit": limit, "offset": offset}
