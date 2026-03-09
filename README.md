# DFM Terminal

Strategic intelligence terminal combining Bloomberg-style screening, Govini-style defense industrial intelligence, and Palantir-style knowledge graph exploration.

## Architecture

```
dfm_terminal/
├── backend/        FastAPI · PostgreSQL views · SQLAlchemy
├── frontend/       Next.js 14 · TailwindCSS · TanStack Query · React Flow
└── infra/          Docker Compose
```

## Database

Connects to `dfm_db_semantic` via `DATABASE_URL` in `.env`:

```
DATABASE_URL=postgresql://dfm_user@localhost:5432/dfm_db_semantic
```

**Views used:**

| View | Module |
|------|--------|
| `v_dfm_entity_profile_v1` | Global search, Entity intelligence |
| `v_dfm_entity_context_v1` | Context, Compliance, Timeline |
| `v_dfm_graph_nodes_v1` | Knowledge graph nodes |
| `v_dfm_graph_edges_v3` | Knowledge graph edges |
| `v_dfm_bloomberg_screener_v3` | Screener, Procurement |
| `v_dfm_rank_with_scoring_layers_v3` | Rankings, Entity ranking tab |
| `v_dfm_priority_tree_v1` | Strategic priorities |

## Running locally

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Terminal: http://localhost:3000

### Docker Compose

```bash
cd infra
docker compose up --build
```

## Modules

| Route | Module | Source view |
|-------|---------|-------------|
| `/` | Global Search | `v_dfm_entity_profile_v1` |
| `/entities/[id]` | Company Intelligence | profile + context + ranking + graph |
| `/screener` | Bloomberg Screener | `v_dfm_bloomberg_screener_v3` |
| `/rankings` | Rankings | `v_dfm_rank_with_scoring_layers_v3` |
| `/priorities` | Strategic Priority Explorer | `v_dfm_priority_tree_v1` |
| `/graph` | Knowledge Graph | nodes + edges views |
| `/compare` | Multi-Entity Comparison | profile + ranking |
| `/procurement` | Procurement Intelligence | `v_dfm_bloomberg_screener_v3` |
| `/compliance` | Regulatory Compliance | `v_dfm_entity_context_v1` |
| `/timeline` | Event Timeline | `v_dfm_entity_context_v1` |

## API endpoints

```
GET /api/v1/search?q=&limit=
GET /api/v1/entities
GET /api/v1/entities/{id}/profile
GET /api/v1/entities/{id}/context
GET /api/v1/entities/{id}/ranking
GET /api/v1/entities/compare/multi?ids=
GET /api/v1/graph/nodes
GET /api/v1/graph/edges
GET /api/v1/graph/subgraph/{id}
GET /api/v1/screener
GET /api/v1/screener/columns
GET /api/v1/rankings
GET /api/v1/priorities
GET /api/v1/priorities/root
GET /api/v1/procurement
GET /api/v1/compliance
GET /api/v1/timeline
GET /api/v1/timeline/entity/{id}
GET /api/v1/scenario/entity/{id}
GET /health
```
