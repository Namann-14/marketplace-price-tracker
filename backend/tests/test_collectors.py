"""Tests for collector parse() methods."""
import pytest
from app.collectors.grailed import GrailedCollector
from app.collectors.fashionphile import FashionphileCollector
from app.collectors.firstdibs import FirstDibsCollector


GRAILED_SAMPLE = {
    "brand": "Nike",
    "model": "Air Max 90",
    "price": 150.0,
    "size": "L",
    "image_url": "https://example.com/img.jpg",
    "product_url": "https://www.grailed.com/listings/83672676",
    "metadata": {"style": "Sneakers", "color": "White", "is_sold": False},
}

FASHIONPHILE_SAMPLE = {
    "product_id": "FP123",
    "brand_id": "Louis Vuitton",
    "price": 1200.0,
    "currency": "USD",
    "condition": "Good",
    "image_url": "https://example.com/fp.jpg",
    "product_url": "https://www.fashionphile.com/p/louis-vuitton-neverfull-mm",
    "metadata": {"garment_type": "Bags"},
}

FIRSTDIBS_SAMPLE = {
    "brand": "Gucci",
    "model": "GG Marmont",
    "price": 900.0,
    "size": "One Size",
    "image_url": None,
    "main_images": [{"url": "https://example.com/1stdibs.jpg"}],
    "product_url": "https://www.1stdibs.com/fashion/handbags/non-leather-handbags/id-v_3093883",
    "metadata": {"garment_type": "Bags", "condition": "Excellent"},
}


def test_grailed_parse():
    collector = GrailedCollector()
    result = collector.parse(GRAILED_SAMPLE)
    assert result.source == "grailed"
    assert result.external_id == "83672676"
    assert result.brand == "Nike"
    assert result.title == "Air Max 90"
    assert result.price == 150.0
    assert result.color == "White"
    assert result.is_sold is False


def test_fashionphile_parse():
    collector = FashionphileCollector()
    result = collector.parse(FASHIONPHILE_SAMPLE)
    assert result.source == "fashionphile"
    assert result.external_id == "FP123"
    assert result.title == "Louis Vuitton Neverfull Mm"
    assert result.price == 1200.0
    assert result.is_sold is False


def test_firstdibs_parse():
    collector = FirstDibsCollector()
    result = collector.parse(FIRSTDIBS_SAMPLE)
    assert result.source == "1stdibs"
    assert result.external_id == "v_3093883"
    assert result.brand == "Gucci"
    assert result.image_url == "https://example.com/1stdibs.jpg"
    assert result.condition == "Excellent"
