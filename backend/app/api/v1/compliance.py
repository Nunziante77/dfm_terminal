from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query
from collections import Counter

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("")
def list_compliance(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    eval_status: str | None = Query(None),
    doc_id: str | None = Query(None),
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
