"""Tests for GET /analytics endpoint."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_analytics_shape(client: AsyncClient):
    response = await client.get("/analytics")
    assert response.status_code == 200
    data = response.json()
    assert "by_source" in data
    assert "by_category" in data
    assert "by_brand" in data
    assert "total_products" in data
    assert "total_price_changes" in data
