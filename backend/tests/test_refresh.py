"""Tests for POST /refresh endpoint."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_refresh_returns_started(client: AsyncClient):
    response = await client.post("/refresh")
    assert response.status_code == 200
    assert response.json()["status"] == "refresh started"
