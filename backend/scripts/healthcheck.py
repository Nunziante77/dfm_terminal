#!/usr/bin/env python3
"""
DFM Terminal — System Healthcheck
Validates: database views, API endpoints (all 12 surfaces), frontend wiring.

Usage:
    cd backend
    python scripts/healthcheck.py [--api-url http://localhost:8000] [--db-url postgresql://...]
"""

import sys
import os
import argparse
import time

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
    # Strategic Intelligence
    "v_dfm_defence_supply_chain_v3",
    "v_dfm_defence_supply_chain_signal_v1",
    "v_dfm_supply_chain_classifier_v2",
    "v_dfm_defence_supply_chain_map_v2",
    "v_dfm_defence_technology_market_v3",
    "v_dfm_defence_technology_demand_by_country_v2",
    "v_dfm_pr_concentration_index_v2",
    "v_dfm_entity_tech_union_v1",
    "v_dfm_pr_autonomy_gap_flags_v1",
    "v_dfm_pr_autonomy_gap_v1",
    "v_dfm_procurement_supply_chain_v4",
]

# ── API endpoints to probe ─────────────────────────────────────────────────────
# Organised by the 12 official DFM Terminal surfaces.
# (path, expected_status, surface_label, description)
API_ENDPOINTS = [
    # Health
    ("/health",                                       200, "HEALTH",       "Health check"),

    # Surface 1 — Entities
    ("/api/v1/entities?limit=1",                      200, "ENTITIES",     "List entities"),
    ("/api/v1/entities/compare/multi?ids=A,B",        400, "ENTITIES",     "Compare entities (400 = expected for fake IDs)"),

    # Surface 2 — Strategic Priorities
    ("/api/v1/priorities?limit=1",                    200, "PRIORITIES",   "Priority tree"),
    ("/api/v1/priorities/distinct",                   200, "PRIORITIES",   "Distinct priorities"),
    ("/api/v1/priorities/TEST-PR/nodes",              200, "PRIORITIES",   "Priority nodes (empty OK)"),
    ("/api/v1/priorities/TEST-PR/entities",           200, "PRIORITIES",   "Priority entity alignment"),
    ("/api/v1/priorities/TEST-PR/normative",          200, "PRIORITIES",   "Priority normative coverage"),

    # Surface 3 — Strategic Ranking
    ("/api/v1/rankings?limit=1",                      200, "RANKING",      "Rankings"),
    ("/api/v1/screener?limit=1",                      200, "RANKING",      "Bloomberg screener"),

    # Surface 4 — Knowledge Graph
    ("/api/v1/graph/nodes?limit=1",                   200, "GRAPH",        "Graph nodes"),
    ("/api/v1/graph/edges?limit=1",                   200, "GRAPH",        "Graph edges"),
    ("/api/v1/graph/subgraph/TEST-ENTITY",            200, "GRAPH",        "Entity subgraph (empty OK)"),

    # Surface 5 — Patents & Technology
    ("/api/v1/patents?limit=1",                       200, "PATENTS",      "Patent records"),
    ("/api/v1/patents/tech-signals?limit=1",          200, "PATENTS",      "Tech signals"),
    ("/api/v1/patents/entity/TEST-ENTITY",            200, "PATENTS",      "Entity patents (empty OK)"),
    ("/api/v1/patents/entity/TEST-ENTITY/tech",       200, "PATENTS",      "Entity tech domains (empty OK)"),

    # Surface 6 — Research & Grants
    ("/api/v1/research?limit=1",                      200, "RESEARCH",     "Research participations"),
    ("/api/v1/research/entity/TEST-ENTITY",           200, "RESEARCH",     "Entity research (empty OK)"),

    # Surface 7 — Procurement
    ("/api/v1/procurement?limit=1",                   200, "PROCURE",      "Procurement notices"),
    ("/api/v1/procurement/awards?limit=1",            200, "PROCURE",      "TED awards"),
    ("/api/v1/procurement/awards/linked?limit=1",     200, "PROCURE",      "Linked awards"),
    ("/api/v1/procurement/summary?limit=1",           200, "PROCURE",      "Procurement summary"),
    ("/api/v1/procurement/signals",                   200, "PROCURE",      "Procurement signals"),

    # Surface 8 — Normative / Regulatory Admissibility
    ("/api/v1/normative/documents?limit=1",           200, "NORMATIVE",    "Normative documents"),
    ("/api/v1/normative/atoms?limit=1",               200, "NORMATIVE",    "Normative atoms"),
    ("/api/v1/normative/pr-profile?limit=1",          200, "NORMATIVE",    "Normative PR profile"),
    ("/api/v1/normative/entity/TEST-ENTITY/eval",     200, "NORMATIVE",    "Entity normative eval (empty OK)"),
    ("/api/v1/compliance?limit=1",                    200, "NORMATIVE",    "Admissibility matrix"),

    # Surface 9 — Ownership & FDI
    ("/api/v1/ownership?limit=1",                     200, "OWNERSHIP",    "Ownership list"),
    ("/api/v1/ownership/fdi?limit=1",                 200, "OWNERSHIP",    "FDI signals"),
    ("/api/v1/ownership/fdi/workflow?limit=1",        200, "OWNERSHIP",    "FDI workflow"),

    # Surface 10 — Events & Temporal
    ("/api/v1/events?limit=1",                        200, "EVENTS",       "Events list"),
    ("/api/v1/events/rankings?limit=1",               200, "EVENTS",       "Events rankings"),
    ("/api/v1/timeline?limit=1",                      200, "EVENTS",       "Timeline"),

    # Surface 11 — Scenarios
    ("/api/v1/scenario/entity/TEST-ENTITY",           200, "SCENARIOS",    "Entity scenario (empty OK)"),

    # Surface 12 — Unified Search
    ("/api/v1/search?q=a&limit=1",                    200, "SEARCH",       "Unified search"),

    # Surface 13 — Supply Chain Intelligence
    ("/api/v1/supply-chain/network?limit=1",          200, "SUPPLY CHAIN", "Supply chain network"),
    ("/api/v1/supply-chain/dependencies?limit=1",     200, "SUPPLY CHAIN", "Supply chain dependencies"),
    ("/api/v1/supply-chain/centrality?limit=1",       200, "SUPPLY CHAIN", "Supply chain centrality"),
    ("/api/v1/supply-chain/entity/TEST-ENTITY",       200, "SUPPLY CHAIN", "Entity supply chain (empty OK)"),

    # Surface 14 — Technology Landscape
    ("/api/v1/technology/clusters?limit=1",           200, "TECHNOLOGY",   "Technology clusters"),
    ("/api/v1/technology/concentration?limit=1",      200, "TECHNOLOGY",   "Technology concentration"),
    ("/api/v1/technology/vulnerabilities?limit=1",    200, "TECHNOLOGY",   "Technology vulnerabilities"),
    ("/api/v1/technology/entity/TEST-ENTITY",         200, "TECHNOLOGY",   "Entity technology (empty OK)"),

    # Surface 15 — Strategic Autonomy
    ("/api/v1/autonomy/index?limit=1",                200, "AUTONOMY",     "Autonomy index"),
    ("/api/v1/autonomy/gaps?limit=1",                 200, "AUTONOMY",     "Autonomy gaps"),
    ("/api/v1/autonomy/dependencies?limit=1",         200, "AUTONOMY",     "Autonomy dependencies"),

    # Surface 16 — Capability Demand
    ("/api/v1/capabilities/demand?limit=1",           200, "CAPABILITIES", "Capability demand"),
    ("/api/v1/capabilities/gaps?limit=1",             200, "CAPABILITIES", "Capability gaps"),
    ("/api/v1/capabilities/by-technology?limit=1",    200, "CAPABILITIES", "Capabilities by technology"),
]

# Frontend files to verify exist and are non-trivial
FRONTEND_PAGE_FILES = [
    # Core
    "frontend/app/page.tsx",
    "frontend/app/screener/page.tsx",
    "frontend/app/rankings/page.tsx",
    "frontend/app/priorities/page.tsx",
    "frontend/app/graph/page.tsx",
    "frontend/app/compare/page.tsx",
    "frontend/app/scenarios/page.tsx",
    # Intelligence
    "frontend/app/patents/page.tsx",
    "frontend/app/research/page.tsx",
    "frontend/app/procurement/page.tsx",
    "frontend/app/ownership/page.tsx",
    # Regulatory
    "frontend/app/normative/page.tsx",
    "frontend/app/normative/[doc_id]/page.tsx",
    "frontend/app/strategic/page.tsx",
    "frontend/app/strategic/[doc_id]/page.tsx",
    "frontend/app/compliance/page.tsx",
    # Temporal
    "frontend/app/events/page.tsx",
    "frontend/app/timeline/page.tsx",
    # Strategic Intelligence
    "frontend/app/supply-chain/page.tsx",
    "frontend/app/technology/page.tsx",
    "frontend/app/autonomy/page.tsx",
    "frontend/app/capabilities/page.tsx",
    # Detail
    "frontend/app/entities/[id]/page.tsx",
    # Shell
    "frontend/app/layout.tsx",
    "frontend/lib/api.ts",
    "frontend/lib/types.ts",
]

# api.ts exports that must exist
REQUIRED_API_EXPORTS = [
    # Search
    "unifiedSearch",
    # Entities
    "listEntities", "getEntityProfile", "getEntityContext", "getEntityRanking",
    "compareEntities",
    # Graph
    "getGraphNodes", "getGraphEdges", "getEntitySubgraph",
    # Screener / Rankings / Priorities
    "getScreener", "getRankings",
    "getPriorities", "getDistinctPriorities", "getPriorityNodes",
    "getPriorityEntities", "getPriorityNormative",
    # Patents
    "listPatents", "getEntityPatents", "getEntityTechFromPatents", "getTechSignals",
    # Research
    "listResearch", "getEntityResearch",
    # Procurement
    "listProcurement", "listLinkedAwards", "getEntityProcurement",
    "getProcurementSummary", "getProcurementSignals",
    # Normative
    "listNormativeDocuments", "getNormativeDocument", "listNormativeAtoms",
    "getEntityNormativeEval", "getNormativePrProfile",
    # Strategic
    "listStrategicDocuments", "getStrategicDocument", "listStrategicAtoms",
    # Events
    "listEvents", "getEntityEventsSummary", "getEventsRankings",
    # Ownership
    "listOwnership", "getEntityOwnership",
    "listFdiSignals", "getEntityFdi", "getFdiWorkflow",
    # Scenario
    "getEntityScenario",
    # Compliance / Timeline
    "listCompliance", "getTimeline",
    # Supply Chain
    "getSupplyChainNetwork", "getSupplyChainDependencies", "getSupplyChainCentrality", "getEntitySupplyChain",
    # Technology
    "getTechnologyClusters", "getTechnologyConcentration", "getTechnologyVulnerabilities", "getEntityTechnology",
    # Autonomy
    "getAutonomyIndex", "getAutonomyGaps", "getAutonomyDependencies",
    # Capabilities
    "getCapabilityDemand", "getCapabilityGaps", "getCapabilitiesByTechnology",
]

# ── Colour helpers ─────────────────────────────────────────────────────────────
RESET  = "\033[0m"
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"

def ok(msg):   print(f"  {GREEN}✓{RESET}  {msg}")
def fail(msg): print(f"  {RED}✗{RESET}  {msg}")
def warn(msg): print(f"  {YELLOW}!{RESET}  {msg}")
def header(title):
    print(f"\n{BOLD}{CYAN}{'─'*60}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'─'*60}{RESET}")


# ── Database check ─────────────────────────────────────────────────────────────
def check_database(db_url):
    try:
        import psycopg2
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


# ── API check ──────────────────────────────────────────────────────────────────
def check_api(api_url):
    import urllib.request
    import urllib.error

    header("API ENDPOINTS (12 SURFACES)")
    passed = failed = 0
    current_surface = None

    for path, expected_status, surface, description in API_ENDPOINTS:
        if surface != current_surface:
            current_surface = surface
            print(f"\n  {CYAN}── {surface}{RESET}")

        url = api_url.rstrip("/") + path
        t0 = time.time()
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=5) as resp:
                status = resp.status
                elapsed = int((time.time() - t0) * 1000)
                if status == expected_status:
                    ok(f"{description:<50}  {status}  {elapsed}ms")
                    passed += 1
                else:
                    fail(f"{description:<50}  got {status}, expected {expected_status}")
                    failed += 1
        except urllib.error.HTTPError as e:
            elapsed = int((time.time() - t0) * 1000)
            if e.code == expected_status:
                ok(f"{description:<50}  {e.code}  {elapsed}ms")
                passed += 1
            else:
                fail(f"{description:<50}  HTTP {e.code}  {elapsed}ms")
                failed += 1
        except Exception as e:
            fail(f"{description:<50}  ERROR: {e}")
            failed += 1

    return passed, failed


# ── Frontend wiring check ──────────────────────────────────────────────────────
def check_frontend():
    header("FRONTEND FILE WIRING")
    passed = failed = 0

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))

    for rel_path in FRONTEND_PAGE_FILES:
        abs_path = os.path.join(project_root, rel_path)
        if os.path.isfile(abs_path):
            size = os.path.getsize(abs_path)
            if size > 100:
                ok(f"{rel_path:<60}  {size} bytes")
                passed += 1
            else:
                warn(f"{rel_path:<60}  suspiciously small ({size} bytes)")
                failed += 1
        else:
            fail(f"{rel_path:<60}  NOT FOUND")
            failed += 1

    # Check api.ts exports
    api_ts = os.path.join(project_root, "frontend/lib/api.ts")
    if os.path.isfile(api_ts):
        content = open(api_ts).read()
        print(f"\n  {CYAN}api.ts exports:{RESET}")
        for fn in REQUIRED_API_EXPORTS:
            if fn in content:
                ok(f"  {fn}")
                passed += 1
            else:
                fail(f"  {fn}  ← MISSING from api.ts")
                failed += 1

    return passed, failed


# ── Surface coverage summary ───────────────────────────────────────────────────
def print_surface_map():
    header("12 OFFICIAL SURFACES — COVERAGE MAP")
    surfaces = [
        ("1",  "ENTITIES",                  "list, profile, context, ranking, compare"),
        ("2",  "STRATEGIC PRIORITIES",      "tree, distinct, nodes, entity-alignment, normative-coverage"),
        ("3",  "STRATEGIC RANKING",         "scoring layers, country/code filters"),
        ("4",  "KNOWLEDGE GRAPH",           "nodes, edges, ego-network subgraph"),
        ("5",  "PATENTS & TECHNOLOGY",      "canonical records, links, tech-from-patents, signals"),
        ("6",  "RESEARCH & GRANTS",         "EC participations, entity summary, project participants"),
        ("7",  "PROCUREMENT",               "TED notices, awards, linked awards, summary, signals"),
        ("8",  "NORMATIVE ADMISSIBILITY",   "documents, atoms, entity eval, PR profile, compliance matrix"),
        ("9",  "OWNERSHIP & FDI",           "ownership, FDI signals, regulatory workflow"),
        ("10", "EVENTS & TEMPORAL",         "events, entity summary, rankings, timeline"),
        ("11", "SCENARIOS",                 "entity scenario (9-query aggregate), multi-entity comparison"),
        ("12", "UNIFIED SEARCH",            "cross-domain: entities, patents, procurement, normative, strategic"),
        ("13", "SUPPLY CHAIN INTELLIGENCE", "network by role/tech, entity-level exposure, centrality classification"),
        ("14", "TECHNOLOGY LANDSCAPE",      "tech clusters, concentration index (HHI), country demand map"),
        ("15", "STRATEGIC AUTONOMY",        "autonomy gaps, EU vs non-EU distribution, concentration index"),
        ("16", "CAPABILITY DEMAND",         "demand by tech, supply chain gaps, country-tech breakdown"),
    ]
    for num, name, endpoints in surfaces:
        print(f"  {GREEN}{num:>2}.{RESET}  {CYAN}{name:<30}{RESET}  {endpoints}")


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="DFM Terminal healthcheck")
    parser.add_argument("--api-url", default=DEFAULT_API)
    parser.add_argument("--db-url",  default=DEFAULT_DB)
    parser.add_argument("--skip-api", action="store_true")
    parser.add_argument("--skip-db",  action="store_true")
    parser.add_argument("--surface-map", action="store_true", help="Print surface coverage map and exit")
    args = parser.parse_args()

    if args.surface_map:
        print_surface_map()
        print()
        return

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

    print_surface_map()

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
