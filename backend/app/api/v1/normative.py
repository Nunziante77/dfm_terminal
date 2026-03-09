from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/normative", tags=["normative"])


@router.get("/documents")
def list_normative_documents(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    doc_type: str | None = Query(None),
    issuer: str | None = Query(None),
    language_code: str | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Normative documents from dfm_normative_documents."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if doc_type:
        conditions.append("doc_type ILIKE :doc_type")
        params["doc_type"] = f"%{doc_type}%"
    if issuer:
        conditions.append("issuer ILIKE :issuer")
        params["issuer"] = f"%{issuer}%"
    if language_code:
        conditions.append("language_code = :language_code")
        params["language_code"] = language_code
    if search:
        conditions.append("(title ILIKE :search OR issuer ILIKE :search OR doc_id ILIKE :search)")
        params["search"] = f"%{search}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT doc_id, eli, source_url, title, published_date, language_code,
               issuer, doc_type, ingested_at, last_seen_at, version_no
        FROM dfm_normative_documents
        WHERE {where}
        ORDER BY published_date DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
    count = run_query(db, f"SELECT COUNT(*) AS total FROM dfm_normative_documents WHERE {where}", count_params)
    return {"data": rows, "total": count[0]["total"] if count else 0, "limit": limit, "offset": offset}


@router.get("/documents/{doc_id}")
def get_normative_document(doc_id: str, db: Session = Depends(get_db)):
    """Single normative document with its atoms."""
    doc = run_query(
        db,
        """
        SELECT doc_id, eli, source_url, title, published_date, language_code,
               issuer, doc_type, ingested_at, last_seen_at, version_no
        FROM dfm_normative_documents
        WHERE doc_id = :doc_id
        """,
        {"doc_id": doc_id},
    )
    if not doc:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found")

    atoms = run_query(
        db,
        """
        SELECT atom_id, doc_id, article_ref, paragraph_ref, section, article_no,
               subject_text, predicate_text, object_text, condition_text,
               threshold_value, threshold_unit, comparator, authority_text,
               applies_to_text, excerpt, atom_text, created_at, updated_at
        FROM dfm_normative_atoms
        WHERE doc_id = :doc_id
        ORDER BY article_no NULLS LAST, atom_id
        LIMIT 200
        """,
        {"doc_id": doc_id},
    )
    profile = run_query(
        db,
        """
        SELECT doc_id, doc_type, language_code, issuer, total_atoms,
               priority_code, mapping_type, pr_atoms, coverage_percent
        FROM v_normative_doc_pr_profile_v1
        WHERE doc_id = :doc_id
        """,
        {"doc_id": doc_id},
    )
    return {"document": doc[0], "atoms": atoms, "pr_profile": profile}


@router.get("/atoms")
def list_normative_atoms(
    doc_id: str | None = Query(None),
    atom_type: str | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Normative atoms from dfm_normative_atoms."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if doc_id:
        conditions.append("doc_id = :doc_id")
        params["doc_id"] = doc_id
    if atom_type:
        conditions.append("CAST(atom_type AS TEXT) ILIKE :atom_type")
        params["atom_type"] = f"%{atom_type}%"
    if search:
        conditions.append("(subject_text ILIKE :search OR excerpt ILIKE :search OR atom_text ILIKE :search)")
        params["search"] = f"%{search}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT atom_id, doc_id, article_ref, paragraph_ref, section, article_no,
               subject_text, predicate_text, object_text, condition_text,
               threshold_value, threshold_unit, comparator, authority_text,
               applies_to_text, excerpt, atom_text, created_at, updated_at
        FROM dfm_normative_atoms
        WHERE {where}
        ORDER BY atom_id
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    return {"data": rows, "total": len(rows), "limit": limit, "offset": offset}


@router.get("/entity/{entity_id}/eval")
def entity_normative_eval(entity_id: str, db: Session = Depends(get_db)):
    """Normative compliance evaluation for an entity."""
    rows = run_query(
        db,
        """
        SELECT e.entity_id, e.doc_id, e.atom_id, e.eval_status,
               d.title, d.doc_type, d.issuer
        FROM v_dfm_entity_normative_eval_v2 e
        LEFT JOIN dfm_normative_documents d ON d.doc_id = e.doc_id
        WHERE e.entity_id = :eid
        ORDER BY e.doc_id, e.atom_id
        """,
        {"eid": entity_id},
    )
    from collections import Counter
    status_counts = dict(Counter(r["eval_status"] for r in rows))
    return {"entity_id": entity_id, "evaluations": rows, "total": len(rows), "status_summary": status_counts}


@router.get("/pr-profile")
def normative_pr_profile(
    priority_code: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Normative coverage by strategic priority."""
    conditions = ["1=1"]
    params: dict = {"limit": limit}
    if priority_code:
        conditions.append("priority_code ILIKE :priority_code")
        params["priority_code"] = f"%{priority_code}%"
    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT doc_id, priority_code, mapping_type, total_atoms, pr_atoms, coverage_percent
        FROM v_normative_pr_profile_v1
        WHERE {where}
        ORDER BY coverage_percent DESC NULLS LAST
        LIMIT :limit
        """,
        params,
    )
    return {"data": rows, "total": len(rows)}
