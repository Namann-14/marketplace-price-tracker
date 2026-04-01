"""FastAPI application entry point with lifespan and CORS."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.scheduler import start_scheduler, stop_scheduler
from app.routers import products, refresh, analytics, events


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    start_scheduler()
    yield
    # Shutdown
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


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
