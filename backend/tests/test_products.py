"""Tests for GET /products and GET /products/{id} endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Product, PriceHistory


async def _insert_product(db: AsyncSession, **kwargs) -> Product:
    defaults = dict(
        source="grailed",
        external_id="test-123",
        brand="TestBrand",
        title="Test Product Title",
        category="Apparel",
        current_price=250.0,
        currency="USD",
        product_url="https://grailed.com/listings/test-123",
        is_sold=False,
    )
    defaults.update(kwargs)
    p = Product(**defaults)
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return p


@pytest.mark.asyncio
async def test_get_products_returns_list(client: AsyncClient):
    response = await client.get("/products")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "limit" in data


@pytest.mark.asyncio
async def test_filter_by_source(client: AsyncClient, db_session: AsyncSession):
    await _insert_product(db_session, source="fashionphile", external_id="fp-filter-1", title="Fashionphile Item")
    response = await client.get("/products?source=fashionphile")
    assert response.status_code == 200
    data = response.json()
    assert all(item["source"] == "fashionphile" for item in data["items"])


@pytest.mark.asyncio
async def test_filter_by_price_range(client: AsyncClient, db_session: AsyncSession):
    await _insert_product(db_session, external_id="cheap-1", title="Cheap Item", current_price=50.0)
    await _insert_product(db_session, external_id="expensive-1", title="Expensive Item", current_price=2000.0)
    response = await client.get("/products?min_price=100&max_price=500")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert 100 <= item["current_price"] <= 500


@pytest.mark.asyncio
async def test_get_product_by_id(client: AsyncClient, db_session: AsyncSession):
    product = await _insert_product(db_session, external_id="detail-product-1", title="Detail Product")
    response = await client.get(f"/products/{product.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == product.id
    assert data["title"] == "Detail Product"
    assert "price_history" in data


@pytest.mark.asyncio
async def test_get_product_invalid_id_returns_404(client: AsyncClient):
    response = await client.get("/products/999999999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_products_pagination(client: AsyncClient):
    response = await client.get("/products?page=1&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["limit"] == 5
    assert len(data["items"]) <= 5
