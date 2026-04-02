"""FastAPI application entry point with lifespan and CORS."""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.scheduler import start_scheduler, stop_scheduler
from app.routers import products, refresh, analytics, events, webhooks
from app.services.notification import start_webhook_worker, stop_webhook_worker
from app.database import AsyncSessionLocal
from app.models import ApiUsage

BYPASS_PATHS = {"/docs", "/redoc", "/openapi.json", "/keys", "/health"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    start_scheduler()
    start_webhook_worker()
    yield
    # Shutdown
    stop_webhook_worker()
    stop_scheduler()
    await engine.dispose()


app = FastAPI(
    title="Marketplace Price Monitor",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(refresh.router, prefix="/refresh", tags=["refresh"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(events.router, prefix="/events", tags=["events"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])


@app.middleware("http")
async def api_usage_middleware(request: Request, call_next):
    """Log API usage after the response has been generated to capture actual status_code."""
    response = await call_next(request)
    api_key_id = getattr(request.state, "api_key_id", None)

    if api_key_id is not None:
        async with AsyncSessionLocal() as db:
            usage = ApiUsage(
                api_key_id=api_key_id,
                endpoint=str(request.url.path),
                method=request.method,
                status_code=response.status_code,
            )
            db.add(usage)
            await db.commit()

    return response


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
