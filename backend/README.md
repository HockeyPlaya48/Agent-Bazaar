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

### 3. Create Supabase tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Agent listings table
CREATE TABLE agent_listings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT DEFAULT '',
    category TEXT NOT NULL,
    price NUMERIC DEFAULT 0,
    price_type TEXT DEFAULT 'lifetime',
    original_price NUMERIC DEFAULT 0,
    icon TEXT DEFAULT '',
    screenshots TEXT[] DEFAULT '{}',
    demo_url TEXT DEFAULT '',
    install_type TEXT DEFAULT 'api',
    atlas_compatible BOOLEAN DEFAULT false,
    developer_name TEXT DEFAULT '',
    rating NUMERIC DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Bundles table
CREATE TABLE bundles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC DEFAULT 0,
    original_price NUMERIC DEFAULT 0,
    category TEXT DEFAULT '',
    atlas_hint TEXT DEFAULT '',
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Bundle-to-agent junction table
CREATE TABLE bundle_agents (
    bundle_id TEXT REFERENCES bundles(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agent_listings(id) ON DELETE CASCADE,
    PRIMARY KEY (bundle_id, agent_id)
);

-- Reviews table
CREATE TABLE reviews (
    id TEXT PRIMARY KEY,
    agent_id TEXT REFERENCES agent_listings(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    rating NUMERIC NOT NULL,
    comment TEXT DEFAULT '',
    date TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Purchases table
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT DEFAULT 'anonymous',
    agent_id TEXT REFERENCES agent_listings(id),
    bundle_id TEXT REFERENCES bundles(id),
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Atlas waitlist table
CREATE TABLE atlas_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    goals TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_agent_listings_slug ON agent_listings(slug);
CREATE INDEX idx_agent_listings_category ON agent_listings(category);
CREATE INDEX idx_agent_listings_featured ON agent_listings(featured);
CREATE INDEX idx_agent_listings_developer ON agent_listings(developer_name);
CREATE INDEX idx_bundles_slug ON bundles(slug);
CREATE INDEX idx_reviews_agent_id ON reviews(agent_id);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
```

### 4. Seed the database

```bash
python seed.py
```

This inserts 10 agents, 3 bundles, 9 bundle-agent mappings, and 5 reviews.

### 5. Run the server

```bash
uvicorn main:app --reload --port 8000
```

API docs at `http://localhost:8000/docs`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
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

## Deployment

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```
