#!/usr/bin/env python3
"""
DFM Terminal — System Healthcheck
Validates: database views, API endpoints, frontend wiring.

Usage:
    cd backend
    python scripts/healthcheck.py [--api-url http://localhost:8000] [--db-url postgresql://...]
"""

import sys
import os
import argparse
import time
from typing import Any

# ── Config ────────────────────────────────────────────────────────────────────
DEFAULT_API = "http://localhost:8000"
DEFAULT_DB = os.environ.get(
    "DATABASE_URL", "postgresql://dfm_user@localhost:5432/dfm_db_semantic"
)

# All views / tables that must exist
REQUIRED_DB_OBJECTS = [
    "v_dfm_entity_profile_v1",
    "v_dfm_entity_context_v1",
    "v_dfm_graph_nodes_v1",
    "v_dfm_graph_edges_v3",
    "v_dfm_bloomberg_screener_v3",
    "v_dfm_rank_with_scoring_layers_v3",
    "v_dfm_priority_tree_v1",
    "v_node_patent_v1",
    "v_dfm_patent_records_canonical_v1",
    "v_company_patent_links_resolved_v1",
    "v_dfm_entity_tech_from_patents_mv_v1",
    "v_dfm_entity_research_context_v1",
    "v_dfm_entity_procurement_ted_v1",
    "v_dfm_ted_awards_v2",
    "v_dfm_ted_awards_linked_v3",
    "v_dfm_company_procurement_summary_v1",
    "v_dfm_procurement_signals_v3",
    "dfm_normative_documents",
    "dfm_normative_atoms",
    "v_dfm_entity_normative_eval_v2",
    "v_normative_doc_pr_profile_v1",
    "v_normative_pr_profile_v1",
    "dfm_strategic_documents",
    "dfm_strategic_atoms",
    "dfm_events_v1",
    "v_dfm_entity_events_v1",
    "v_dfm_entity_events_rank_v1",
    "v_entity_ownership_aggregated_v2",
    "v_entity_fdi_signal_v1",
    "v_fdi_regulatory_workflow_final",
]

# API endpoints to probe (path, min expected HTTP status, description)
API_ENDPOINTS = [
    ("/health",                          200, "Health check"),
    ("/api/v1/search?q=a&limit=1",       200, "Unified search"),
    ("/api/v1/entities?limit=1",          200, "List entities"),
    ("/api/v1/graph/nodes?limit=1",       200, "Graph nodes"),
    ("/api/v1/graph/edges?limit=1",       200, "Graph edges"),
    ("/api/v1/screener?limit=1",          200, "Screener"),
    ("/api/v1/rankings?limit=1",          200, "Rankings"),
    ("/api/v1/priorities?limit=1",        200, "Priorities"),
    ("/api/v1/priorities/distinct",       200, "Priorities distinct"),
    ("/api/v1/patents?limit=1",           200, "Patents list"),
    ("/api/v1/patents/tech-signals?limit=1", 200, "Tech signals"),
    ("/api/v1/research?limit=1",          200, "Research list"),
    ("/api/v1/procurement?limit=1",       200, "Procurement notices"),
    ("/api/v1/procurement/awards?limit=1", 200, "TED awards"),
    ("/api/v1/procurement/awards/linked?limit=1", 200, "Linked awards"),
    ("/api/v1/procurement/summary?limit=1", 200, "Procurement summary"),
    ("/api/v1/procurement/signals",       200, "Procurement signals"),
    ("/api/v1/normative/documents?limit=1", 200, "Normative documents"),
    ("/api/v1/normative/atoms?limit=1",   200, "Normative atoms"),
    ("/api/v1/normative/pr-profile?limit=1", 200, "Normative PR profile"),
    ("/api/v1/strategic/documents?limit=1", 200, "Strategic documents"),
    ("/api/v1/strategic/atoms?limit=1",   200, "Strategic atoms"),
    ("/api/v1/events?limit=1",            200, "Events list"),
    ("/api/v1/events/rankings?limit=1",   200, "Events rankings"),
    ("/api/v1/ownership?limit=1",         200, "Ownership list"),
    ("/api/v1/ownership/fdi?limit=1",     200, "FDI signals"),
    ("/api/v1/ownership/fdi/workflow?limit=1", 200, "FDI workflow"),
    ("/api/v1/compliance?limit=1",        200, "Compliance list"),
    ("/api/v1/timeline?limit=1",          200, "Timeline"),
]

# Frontend routes that must resolve (checked structurally — no browser)
FRONTEND_ROUTES = [
    "/",
    "/screener",
    "/rankings",
    "/priorities",
    "/graph",
    "/compare",
    "/patents",
    "/research",
    "/procurement",
    "/normative",
    "/strategic",
    "/events",
    "/ownership",
    "/compliance",
    "/timeline",
    "/entities/[id]",
]

FRONTEND_PAGE_FILES = [
    "frontend/app/page.tsx",
    "frontend/app/screener/page.tsx",
    "frontend/app/rankings/page.tsx",
    "frontend/app/priorities/page.tsx",
    "frontend/app/graph/page.tsx",
    "frontend/app/compare/page.tsx",
    "frontend/app/patents/page.tsx",
    "frontend/app/research/page.tsx",
    "frontend/app/procurement/page.tsx",
    "frontend/app/normative/page.tsx",
    "frontend/app/normative/[doc_id]/page.tsx",
    "frontend/app/strategic/page.tsx",
    "frontend/app/strategic/[doc_id]/page.tsx",
    "frontend/app/events/page.tsx",
    "frontend/app/ownership/page.tsx",
    "frontend/app/compliance/page.tsx",
    "frontend/app/timeline/page.tsx",
    "frontend/app/entities/[id]/page.tsx",
    "frontend/app/layout.tsx",
    "frontend/lib/api.ts",
    "frontend/lib/types.ts",
]

# ── Helpers ───────────────────────────────────────────────────────────────────
RESET  = "\033[0m"
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"

def ok(msg: str) -> None:
    print(f"  {GREEN}✓{RESET}  {msg}")

def fail(msg: str) -> None:
    print(f"  {RED}✗{RESET}  {msg}")

def warn(msg: str) -> None:
    print(f"  {YELLOW}!{RESET}  {msg}")

def header(title: str) -> None:
    print(f"\n{BOLD}{CYAN}{'─'*60}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'─'*60}{RESET}")


# ── Database check ────────────────────────────────────────────────────────────
def check_database(db_url: str) -> tuple[int, int]:
    try:
        import psycopg2  # type: ignore
    except ImportError:
        warn("psycopg2 not installed — skipping DB checks")
        return 0, 0

    header("DATABASE VIEWS & TABLES")
    passed = failed = 0
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
        """)
        existing = {row[0] for row in cur.fetchall()}
        cur.close()
        conn.close()
    except Exception as e:
        fail(f"Cannot connect to database: {e}")
        return 0, len(REQUIRED_DB_OBJECTS)

    for obj in REQUIRED_DB_OBJECTS:
        if obj in existing:
            ok(obj)
            passed += 1
        else:
            fail(f"{obj}  ← MISSING")
            failed += 1

    return passed, failed


# ── API check ─────────────────────────────────────────────────────────────────
def check_api(api_url: str) -> tuple[int, int]:
    try:
        import urllib.request
        import urllib.error
    except ImportError:
        warn("urllib not available")
        return 0, 0

    header("API ENDPOINTS")
    passed = failed = 0

    for path, expected_status, description in API_ENDPOINTS:
        url = api_url.rstrip("/") + path
        t0 = time.time()
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=5) as resp:
                status = resp.status
                elapsed = int((time.time() - t0) * 1000)
                if status == expected_status:
                    ok(f"{description:<35}  {status}  {elapsed}ms")
                    passed += 1
                else:
                    fail(f"{description:<35}  got {status}, expected {expected_status}")
                    failed += 1
        except urllib.error.HTTPError as e:
            elapsed = int((time.time() - t0) * 1000)
            if e.code == expected_status:
                ok(f"{description:<35}  {e.code}  {elapsed}ms")
                passed += 1
            else:
                fail(f"{description:<35}  HTTP {e.code}  {elapsed}ms")
                failed += 1
        except Exception as e:
            fail(f"{description:<35}  ERROR: {e}")
            failed += 1

    return passed, failed


# ── Frontend wiring check ─────────────────────────────────────────────────────
def check_frontend() -> tuple[int, int]:
    header("FRONTEND FILE WIRING")
    passed = failed = 0

    # Resolve project root (two levels up from scripts/)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))

    for rel_path in FRONTEND_PAGE_FILES:
        abs_path = os.path.join(project_root, rel_path)
        if os.path.isfile(abs_path):
            size = os.path.getsize(abs_path)
            if size > 100:
                ok(f"{rel_path:<55}  {size} bytes")
                passed += 1
            else:
                warn(f"{rel_path:<55}  suspiciously small ({size} bytes)")
                failed += 1
        else:
            fail(f"{rel_path:<55}  NOT FOUND")
            failed += 1

    # Check api.ts exports key functions
    api_ts = os.path.join(project_root, "frontend/lib/api.ts")
    if os.path.isfile(api_ts):
        content = open(api_ts).read()
        required_exports = [
            "unifiedSearch", "listEntities", "getEntityProfile",
            "getEntityPatents", "getEntityResearch", "getEntityProcurement",
            "getEntityNormativeEval", "getEntityEventsSummary",
            "getEntityOwnership", "getEntityFdi",
            "listNormativeDocuments", "listStrategicDocuments",
            "listEvents", "listOwnership", "listFdiSignals",
        ]
        print(f"\n  {CYAN}api.ts exports:{RESET}")
        for fn in required_exports:
            if fn in content:
                ok(f"  {fn}")
                passed += 1
            else:
                fail(f"  {fn}  ← MISSING from api.ts")
                failed += 1

    return passed, failed


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    parser = argparse.ArgumentParser(description="DFM Terminal healthcheck")
    parser.add_argument("--api-url", default=DEFAULT_API)
    parser.add_argument("--db-url",  default=DEFAULT_DB)
    parser.add_argument("--skip-api", action="store_true")
    parser.add_argument("--skip-db",  action="store_true")
    args = parser.parse_args()

    print(f"\n{BOLD}DFM TERMINAL — SYSTEM HEALTHCHECK{RESET}")
    print(f"API: {args.api_url}  |  DB: {args.db_url[:50]}…")

    total_passed = total_failed = 0

    if not args.skip_db:
        p, f = check_database(args.db_url)
        total_passed += p; total_failed += f

    if not args.skip_api:
        p, f = check_api(args.api_url)
        total_passed += p; total_failed += f

    p, f = check_frontend()
    total_passed += p; total_failed += f

    # Summary
    header("SUMMARY")
    total = total_passed + total_failed
    pct = int(100 * total_passed / total) if total else 0
    color = GREEN if total_failed == 0 else (YELLOW if total_failed < 5 else RED)
    print(f"  {color}{BOLD}{total_passed}/{total} checks passed ({pct}%){RESET}")
    if total_failed:
        print(f"  {RED}{total_failed} check(s) failed — review output above{RESET}")
    else:
        print(f"  {GREEN}All systems operational{RESET}")
    print()

    sys.exit(0 if total_failed == 0 else 1)


if __name__ == "__main__":
    main()
