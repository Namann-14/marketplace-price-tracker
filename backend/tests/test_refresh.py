"""Tests for POST /refresh endpoint and price-history creation on price change."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Product, PriceHistory
from app.services.ingestion import _upsert_product
from app.collectors.base import NormalizedProduct


@pytest.mark.asyncio
async def test_refresh_returns_started(client: AsyncClient):
    response = await client.post("/refresh")
    assert response.status_code == 200
    assert response.json()["status"] == "refresh started"


@pytest.mark.asyncio
async def test_refresh_creates_price_history_on_price_change(db_session: AsyncSession):
    """When a product's price changes _upsert_product inserts a price_history row and a price_change_event."""
    # Insert original product at price 100
    original = NormalizedProduct(
        source="grailed",
        external_id="upsert-price-test-1",
        brand="TestBrand",
        title="Price Change Test Product",
        price=100.0,
        currency="USD",
        category="Apparel",
        size=None,
        condition=None,
        color=None,
        is_sold=False,
        image_url=None,
        images=None,
        product_url="https://grailed.com/listings/upsert-price-test-1",
    )
    await _upsert_product(db_session, original)

    # Count price_history rows before the change
    result = await db_session.execute(
        select(Product).where(
            Product.source == "grailed",
            Product.external_id == "upsert-price-test-1",
        )
    )
    product = result.scalar_one()
    history_before = await db_session.execute(
        select(PriceHistory).where(PriceHistory.product_id == product.id)
    )
    count_before = len(history_before.scalars().all())

    # Now upsert again with a DIFFERENT price
    updated = NormalizedProduct(
        source="grailed",
        external_id="upsert-price-test-1",
        brand="TestBrand",
        title="Price Change Test Product",
        price=150.0,  # price changed
        currency="USD",
        category="Apparel",
        size=None,
        condition=None,
        color=None,
        is_sold=False,
        image_url=None,
        images=None,
        product_url="https://grailed.com/listings/upsert-price-test-1",
    )
    await _upsert_product(db_session, updated)

    # Refresh the DB session to see the new data
    await db_session.refresh(product)
    history_after = await db_session.execute(
        select(PriceHistory).where(PriceHistory.product_id == product.id)
    )
    count_after = len(history_after.scalars().all())

    assert product.current_price == 150.0
    assert count_after == count_before + 1
