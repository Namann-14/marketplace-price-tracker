"""Pydantic v2 request/response schemas."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict


# ── Price History ─────────────────────────────────────────────────────────────

class PriceHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    recorded_at: datetime
    price: float


# ── Product ───────────────────────────────────────────────────────────────────

class ProductBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    external_id: str
    brand: str | None
    title: str
    category: str | None
    size: str | None
    condition: str | None
    color: str | None
    is_sold: bool
    image_url: str | None
    product_url: str
    currency: str
    current_price: float | None
    last_seen: datetime | None
    created_at: datetime


class ProductDetail(ProductBase):
    price_history: list[PriceHistoryItem] = []


class ProductListResponse(BaseModel):
    items: list[ProductBase]
    total: int
    page: int
    limit: int


# ── Analytics ─────────────────────────────────────────────────────────────────

class SourceStat(BaseModel):
    source: str
    count: int
    avg_price: float | None


class CategoryStat(BaseModel):
    category: str | None
    count: int
    avg_price: float | None


class BrandStat(BaseModel):
    brand: str | None
    count: int


class AnalyticsResponse(BaseModel):
    by_source: list[SourceStat]
    by_category: list[CategoryStat]
    by_brand: list[BrandStat]
    total_products: int
    total_price_changes: int


# ── Refresh ───────────────────────────────────────────────────────────────────

class RefreshResponse(BaseModel):
    status: str


# ── Price Change Event ────────────────────────────────────────────────────────

class PriceChangeEventSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    old_price: float | None
    new_price: float
    source: str | None
    detected_at: datetime
    delivered: bool
