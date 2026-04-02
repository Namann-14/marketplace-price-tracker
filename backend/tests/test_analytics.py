"""Tests for GET /analytics endpoint."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_analytics_returns_correct_structure(client: AsyncClient):
    response = await client.get("/analytics")
    assert response.status_code == 200
    data = response.json()

    # Top-level keys
    assert "by_source" in data
    assert "by_category" in data
    assert "by_brand" in data
    assert "total_products" in data
    assert "total_price_changes" in data

    # Type checks
    assert isinstance(data["by_source"], list)
    assert isinstance(data["by_category"], list)
    assert isinstance(data["by_brand"], list)
    assert isinstance(data["total_products"], int)
    assert isinstance(data["total_price_changes"], int)

    # Item shape checks (if any data exists)
    for item in data["by_source"]:
        assert "source" in item
        assert "count" in item
        assert "avg_price" in item

    for item in data["by_category"]:
        assert "category" in item
        assert "count" in item
        assert "avg_price" in item

    for item in data["by_brand"]:
        assert "brand" in item
        assert "count" in item
