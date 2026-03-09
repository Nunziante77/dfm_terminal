from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, run_query

router = APIRouter(prefix="/strategic", tags=["strategic"])


@router.get("/documents")
def list_strategic_documents(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    doc_type: str | None = Query(None),
    issuer: str | None = Query(None),
    strategic_level: str | None = Query(None),
    geographic_scope: str | None = Query(None),
    layer_class: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Strategic documents from dfm_strategic_documents."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if doc_type:
        conditions.append("doc_type ILIKE :doc_type")
        params["doc_type"] = f"%{doc_type}%"
    if issuer:
        conditions.append("issuer ILIKE :issuer")
        params["issuer"] = f"%{issuer}%"
    if strategic_level:
        conditions.append("strategic_level ILIKE :strategic_level")
        params["strategic_level"] = f"%{strategic_level}%"
    if geographic_scope:
        conditions.append("geographic_scope ILIKE :geographic_scope")
        params["geographic_scope"] = f"%{geographic_scope}%"
    if layer_class:
        conditions.append("layer_class ILIKE :layer_class")
        params["layer_class"] = f"%{layer_class}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT doc_id, issuer, doc_type, strategic_level, geographic_scope,
               published_date, created_at, layer_class
        FROM dfm_strategic_documents
        WHERE {where}
        ORDER BY published_date DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
    count = run_query(db, f"SELECT COUNT(*) AS total FROM dfm_strategic_documents WHERE {where}", count_params)
    return {"data": rows, "total": count[0]["total"] if count else 0, "limit": limit, "offset": offset}


@router.get("/documents/{doc_id}")
def get_strategic_document(doc_id: str, db: Session = Depends(get_db)):
    """Single strategic document with its atoms."""
    doc = run_query(
        db,
        """
        SELECT doc_id, issuer, doc_type, strategic_level, geographic_scope,
               published_date, created_at, layer_class
        FROM dfm_strategic_documents
        WHERE doc_id = :doc_id
        """,
        {"doc_id": doc_id},
    )
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found")

    atoms = run_query(
        db,
        """
        SELECT atom_id, doc_id, atom_type, section, excerpt, created_at, atom_schema_version,
               budget_value, currency, timeframe_start, timeframe_end,
               quantitative_value, unit_type, capability_domain, confidence_level
        FROM dfm_strategic_atoms
        WHERE doc_id = :doc_id
        ORDER BY atom_id
        LIMIT 300
        """,
        {"doc_id": doc_id},
    )
    return {"document": doc[0], "atoms": atoms}


@router.get("/atoms")
def list_strategic_atoms(
    doc_id: str | None = Query(None),
    atom_type: str | None = Query(None),
    capability_domain: str | None = Query(None),
    confidence_level: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Strategic atoms with optional filters."""
    conditions = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if doc_id:
        conditions.append("doc_id = :doc_id")
        params["doc_id"] = doc_id
    if atom_type:
        conditions.append("atom_type ILIKE :atom_type")
        params["atom_type"] = f"%{atom_type}%"
    if capability_domain:
        conditions.append("capability_domain ILIKE :capability_domain")
        params["capability_domain"] = f"%{capability_domain}%"
    if confidence_level:
        conditions.append("confidence_level ILIKE :confidence_level")
        params["confidence_level"] = f"%{confidence_level}%"

    where = " AND ".join(conditions)
    rows = run_query(
        db,
        f"""
        SELECT atom_id, doc_id, atom_type, section, excerpt, created_at, atom_schema_version,
               budget_value, currency, timeframe_start, timeframe_end,
               quantitative_value, unit_type, capability_domain, confidence_level
        FROM dfm_strategic_atoms
        WHERE {where}
        ORDER BY atom_id
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    return {"data": rows, "total": len(rows), "limit": limit, "offset": offset}
