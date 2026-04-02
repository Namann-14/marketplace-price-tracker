# Marketplace Price Tracker

A high-performance full-stack system for monitoring cross-marketplace product pricing.

This platform aggregates listing data from secondary markets including Grailed, Fashionphile, and 1stdibs into a unified tracking interface. It automatically detects price variations across sources, structures them into an immutable event log, and surfaces real-time analytics to a responsive React dashboard.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Setup (Without Docker)](#local-setup-without-docker)
  - [Running with Docker](#running-with-docker)
  - [Running Tests](#running-tests)
- [API Documentation](#api-documentation)
- [Design Decisions](#design-decisions)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests-1)
- [Known Limitations](#known-limitations)
- [Tech Stack](#tech-stack)

## Architecture Overview

The system centers on an asynchronous FastAPI backend backed by SQLite and SQLAlchemy. Authorized users can trigger a refresh process which fans out to individual data collectors. These collectors parse local market datasets, ingest listings into the primary database, and isolate identified price drops into an immutable event log. The React client polls this event log and core analytics endpoints to generate a unified, real-time analytics dashboard.

```text
  [JSON Data Files] → [Collectors] → [Ingestion Service] → [SQLite DB]
                                              ↓
                                   [Price Change Detection]
                                              ↓
                                   [price_change_events table]
                                              ↓
                                    [GET /events endpoint]
                                              ↓
                                      [React Frontend]
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker + Docker Compose (optional)

### Local Setup (Without Docker)

1. Clone repo
2. `cd backend`, create venv, activate it
3. `pip install -r requirements.txt`
4. `alembic upgrade head`
5. `python seed_keys.py`  → copy the printed API key
6. `python seed_demo.py`  → loads sample data + demo price history
7. `uvicorn app.main:app --reload`
8. new terminal → `cd frontend`
9. create `.env` with `VITE_API_KEY=<your key>`
10. `npm install && npm run dev`
11. open `http://localhost:5173`

### Running with Docker

1. `cp backend/.env.example backend/.env`  → fill in API key
2. `docker-compose up --build`
3. `docker-compose exec backend python seed_keys.py`
4. `docker-compose exec backend python seed_demo.py`
5. open `http://localhost:5173`

### Running Tests

```bash
cd backend
pytest tests/ -v
pytest tests/ -v --tb=short
```

## API Documentation

Note that Swagger UI is available at http://localhost:8000/docs for interactive testing.

### `POST /refresh`
Initiates a data ingestion cycle across all active collectors.
**Auth:** API Key
**Query Params:** None

```bash
curl -X POST http://localhost:8000/refresh \
  -H "X-API-Key: your_api_key_here"
```

```json
{
  "status": "success",
  "processed": 142,
  "price_changes_detected": 15
}
```

### `GET /products`
Retrieves paginated, filterable product catalog.
**Auth:** API Key
**Query Params:** `skip` (int), `limit` (int), `source` (str), `min_price` (float), `max_price` (float)

```bash
curl "http://localhost:8000/products?limit=2" \
  -H "X-API-Key: your_api_key_here"
```

```json
{
  "items": [
    {
      "id": "prod_1",
      "source": "Grailed",
      "external_id": "gr_993",
      "title": "Rick Owens Geobasket",
      "brand": "Rick Owens",
      "current_price": 550.00,
      "images": ["url1.jpg"]
    }
  ],
  "total": 142
}
```

### `GET /products/{id}`
Returns details for a specific product including recent price history.
**Auth:** API Key
**Query Params:** None

```bash
curl http://localhost:8000/products/prod_1 \
  -H "X-API-Key: your_api_key_here"
```

```json
{
  "id": "prod_1",
  "title": "Rick Owens Geobasket",
  "current_price": 550.00,
  "history": [
    {
      "price": 600.00,
      "recorded_at": "2024-01-01T12:00:00Z"
    },
    {
      "price": 550.00,
      "recorded_at": "2024-02-01T12:00:00Z"
    }
  ]
}
```

### `GET /analytics`
Generates top-level aggregated statistics for the dashboard.
**Auth:** API Key
**Query Params:** None

```bash
curl http://localhost:8000/analytics \
  -H "X-API-Key: your_api_key_here"
```

```json
{
  "total_products": 142,
  "active_sources": 3,
  "recent_price_drops": 15,
  "average_price_by_source": {
    "Grailed": 250.50,
    "Fashionphile": 1200.00
  }
}
```

### `GET /events`
Polls the event log for new price reduction notifications.
**Auth:** API Key
**Query Params:** `since` (iso datetime), `limit` (int)

```bash
curl "http://localhost:8000/events?limit=5" \
  -H "X-API-Key: your_api_key_here"
```

```json
[
  {
    "event_id": "evt_99",
    "product_id": "prod_1",
    "old_price": 600.00,
    "new_price": 550.00,
    "created_at": "2024-02-01T12:00:00Z"
  }
]
```

### `POST /keys`
Creates a new API Key for integration access.
**Auth:** None (or existing admin key dependent on environment)
**Query Params:** None

```bash
curl -X POST http://localhost:8000/keys \
  -d '{"name": "production_client"}' \
  -H "Content-Type: application/json"
```

```json
{
  "key_id": "key_abc123",
  "raw_key": "sk_live_verylongsecretkey",
  "name": "production_client",
  "created_at": "2024-01-01T10:00:00Z"
}
```

---

## Design Decisions

### 1. Database Schema
The database employs a tightly normalized 5-table design. We employ a strict `UNIQUE(source, external_id)` constraint on the products table to guarantee deduplication at ingestion. The `price_history` table operates as a separate append-only ledger decoupling core product metadata from temporal pricing variability. An `api_usage` table granularly records system interactions per request to enable accurate rate limiting and load analytics.

### 2. How Does Price History Scale?
Performance heavily degrades with unbounded history tables. We address this directly:
- **Current Load:** Indexed on `(product_id, recorded_at DESC)`. Queries execute in `O(log n)` time.
- **At 1M+ rows:** The path forward involves partitioning `price_history` by month using PostgreSQL range partitioning schema.
- **Retention Strategy:** Implementation of a retention policy archiving rows older than 1 year to cold storage.
- **Application Level Defenses:** By default, data access points fetch the last 100 entries only — no full table scans.
- **Current Runtime Environment:** The system uses SQLite configured in WAL mode, enabling concurrent reads without blocking writes.
- **Migration:** Transition to PostgreSQL at a later scaling milestone requires only changing `DATABASE_URL`.

### 3. Notification System: Event Log over Alternatives
We implemented an event log (`price_change_events` table + `GET /events` polling) over alternative realtime paradigms:
- **Webhooks:** Requires consumer to expose HTTP endpoint, delivery failures are hard to retry, adds consumer-side infrastructure burden.
- **SSE/WebSockets:** Overkill for this use case, connection management complexity, not needed for batch price monitoring.
- **Message Queues (Redis/Kafka):** Heavy infrastructure, not justified at this scale.

**Event Log Advantages:** Zero data loss (persisted in DB), queryable history, no blocking of the fetch process (async background task), consumers can poll at their own cadence, simple retry by re-querying `delivered=False` rows.

### 4. Extending to 100+ Data Sources
The architecture isolates supplier implementations leveraging a `BaseCollector` ABC pattern:
- Each source = one class that extends `BaseCollector` and implements `parse()`.
- Ingestion service iterates `ALL_COLLECTORS` list — no other changes needed.
- Adding a new source = add one file, register in `__init__.py`.
- At 100+ sources: run collectors concurrently with `asyncio.gather()`.
- At true scale: move to a worker queue (Celery + Redis) where each collector is an independent task.

### 5. Same Product Across Sources
The system treats cross-source listings as separate distinct products (different `external_id`, different `source`). Reasoning: same physical item can have different conditions, prices, and seller contexts across platforms. Merging would require fuzzy matching on title+brand which introduces false positives. This is documented as a known limitation with a suggested fix via future vector-database integration.

### 6. Authentication
The API utilizes API keys passed via `X-API-Key` header. Secrets are bcrypt hashed in DB. All requests logged to `api_usage` with endpoint, method, status code. Why not JWT: no need for token expiry or refresh flows in this use case. Simple and auditable.

---

## Project Structure

```text
marketplace-price-tracker/
├── backend/                  # FastAPI Application root
│   ├── alembic/              # Database migration definitions directory
│   ├── app/                  # Primary backend application module
│   │   ├── collectors/       # Individual marketplace data parsing scripts
│   │   ├── routers/          # API endpoint controllers (products, events, analytics)
│   │   ├── services/         # Core business logic (ingestion, price tracking)
│   │   ├── auth.py           # Authentication dependency and key validation
│   │   ├── database.py       # SQLAlchemy engine and session configurations
│   │   ├── main.py           # FastAPI application entrypoint and middleware
│   │   ├── models.py         # SQLAlchemy ORM table definitions
│   │   ├── scheduler.py      # Background task coordination for refreshing
│   │   └── schemas.py        # Pydantic data validation models
│   ├── data/                 # Raw JSON marketplace datasets
│   ├── tests/                # Automated pytest test suites
│   ├── alembic.ini           # Alembic configuration
│   ├── Dockerfile            # Container definition for backend
│   ├── requirements.txt      # Python dependencies
│   ├── seed_demo.py          # Script for injecting sample development data
│   └── seed_keys.py          # Script generating initial API admin keys
├── frontend/                 # React UI Application root
│   ├── src/                  # React source files
│   │   ├── components/       # Reusable UI elements
│   │   ├── hooks/            # Custom React logic hooks
│   │   ├── lib/              # API clients and utility functions
│   │   ├── pages/            # Top-level React view components
│   │   ├── App.tsx           # Application routing layout
│   │   ├── index.css         # Global TailwindCSS definitions
│   │   └── main.tsx          # React DOM mounting entrypoint
│   ├── package.json          # Node dependency configurations
│   ├── vite.config.ts        # Vite build tool configuration
│   └── Dockerfile            # Container definition for frontend
└── docker-compose.yml        # Orchestration layer for multi-container deployment
```

## Running Tests

Automated testing operates via `pytest` executing targeted test modules:
- `test_analytics.py`: Validates analytic aggregation mapping, verifying output metrics like recent drop sums.
- `test_auth.py`: Verifies credential protections including rejection of invalid API keys and correct parsing.
- `test_collectors.py`: Certifies correct data structure mappings parsing JSON from distinct mocked markets.
- `test_products.py`: Tests the central data access endpoints verifying robust 404 handling on bad IDs and validating precise price range filter calculations.
- `test_refresh.py`: Triggers ingestion routines evaluating precise price change detection metrics heavily on re-ingest logic cycles.

## Known Limitations

- No live scraping (reads local JSON files only)
- Cross-source product deduplication not implemented (by design, documented above)
- SQLite not suitable for high-concurrency production workload
- No token expiry on API keys
- Frontend has no pagination animation
- Notification polling instead of push (acceptable tradeoff, documented)

**Future Improvements:** Setup structured PostgreSQL migration mappings, construct functional real scraper integration, engineer fuzzy product matching across environments, and architect consumer webhook support features.

## Tech Stack

| Layer | Technology | Version | Reason |
| --- | --- | --- | --- |
| **Backend** | FastAPI (Python) | 3.11 | High performance async capabilities and native models via Pydantic |
| **Database** | SQLite + SQLAlchemy | 2.x | Removes setup friction while providing a massive feature ceiling |
| **Migrations** | Alembic | 1.13+ | Safe and heavily proven execution environment for structural data |
| **Frontend** | React + Vite | 18+ | Fast reload cycles and dominant industry standard ecosystem |
| **Styling** | TailwindCSS | 3.x | Eliminates cascading bugs while executing performant inline classes |
| **Charts** | Recharts | 2.x | Reliable and customizable React-native dataviz abstraction |
| **Virtualization** | Docker | 27+ | Complete execution replication independent of host OS variations |
| **Testing** | pytest | 8.x | Lightweight straightforward fixtures perfectly matching Python tests |
