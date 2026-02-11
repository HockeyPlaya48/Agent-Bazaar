# Agent Bazaar Backend

FastAPI backend for the Agent Bazaar AI agent marketplace.

## Setup

### 1. Install dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase project URL and anon key.

### 3. Create tables and seed data

Copy the contents of `schema.sql` and run it in the **Supabase SQL Editor**. This single file creates all tables, indexes, RLS policies, and seeds the database with 10 agents, 3 bundles, and 5 reviews.

```bash
# Or if you prefer to seed via Python script:
python seed.py
```

### 4. Run the server

```bash
uvicorn main:app --reload --port 8000
```

API docs at `http://localhost:8000/docs`.

## Project Structure

```
backend/
├── main.py              # FastAPI app, CORS, router includes
├── config.py            # Supabase client + env vars
├── models.py            # Pydantic models (AgentListing, Bundle, Review, etc.)
├── schema.sql           # Full SQL: tables + indexes + RLS + seed data
├── seed.py              # Python seed script (alternative to SQL seed)
├── requirements.txt     # Python dependencies
├── .env.example         # Environment template
└── routers/
    ├── agents.py        # GET /agents, GET /agents/{slug}
    ├── bundles.py       # GET /bundles, GET /bundles/{slug}
    ├── reviews.py       # GET /reviews?agent_id=
    ├── purchases.py     # POST /purchases/agent, POST /purchases/bundle
    ├── dev.py           # Developer portal: stats, agents, submit
    ├── waitlist.py      # POST /atlas/waitlist
    └── health.py        # GET /health
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root — API info |
| GET | `/api/health` | Health check |
| GET | `/api/agents` | List agents (filter/sort/search) |
| GET | `/api/agents/{slug}` | Get agent by slug |
| GET | `/api/bundles` | List bundles with agents |
| GET | `/api/bundles/{slug}` | Get bundle by slug |
| GET | `/api/reviews?agent_id=` | Reviews for agent |
| POST | `/api/purchases/agent` | Purchase agent |
| POST | `/api/purchases/bundle` | Purchase bundle |
| GET | `/api/purchases?user_id=` | Purchase history |
| GET | `/api/purchases/agents?user_id=` | Purchased agents |
| GET | `/api/dev/stats?developer_name=` | Developer stats |
| GET | `/api/dev/agents?developer_name=` | Developer's agents |
| POST | `/api/dev/agents` | Submit new agent |
| POST | `/api/atlas/waitlist` | Join Atlas waitlist |

### Query Parameters for GET /api/agents

- `category` — Filter by category (productivity, marketing, personal, ecommerce, dev-tools, finance)
- `sort` — Sort order: `popular`, `highest-rated`, `price-low`, `price-high`
- `search` — Search agents by name or tags

## Database Schema

6 tables total — see `schema.sql` for full DDL:

- **agent_listings** — 10 marketplace agents with pricing, ratings, developer info
- **bundles** — 3 agent bundle packs
- **bundle_agents** — Junction table (which agents in which bundles)
- **reviews** — User reviews per agent
- **purchases** — Purchase records (agent or bundle)
- **atlas_waitlist** — Atlas beta waitlist signups with goals

## Deployment

Set `SUPABASE_URL` and `SUPABASE_KEY` as environment variables, then:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```
