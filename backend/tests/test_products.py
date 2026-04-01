"""Tests for GET /products and GET /products/{id} endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_products_empty(client: AsyncClient):
    response = await client.get("/products")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_get_product_not_found(client: AsyncClient):
    response = await client.get("/products/99999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_products_pagination_defaults(client: AsyncClient):
    response = await client.get("/products?page=1&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["limit"] == 5
