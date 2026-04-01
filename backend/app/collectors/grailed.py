"""Collector for Grailed marketplace data."""
from app.collectors.base import BaseCollector, NormalizedProduct


class GrailedCollector(BaseCollector):
    source = "grailed"

    def parse(self, raw: dict) -> NormalizedProduct:
        """
        Map a raw Grailed JSON record to a NormalizedProduct.

        Field mappings:
          external_id → last path segment of product_url
          brand       → raw["brand"]
          title       → raw["model"]
          price       → raw["price"]
          currency    → "USD"
          category    → raw["metadata"]["style"]
          size        → raw["size"]
          condition   → None (not present)
          color       → raw["metadata"]["color"]
          is_sold     → raw["metadata"]["is_sold"]
          image_url   → raw["image_url"]
          product_url → raw["product_url"]
        """
        # TODO: implement field extraction
        product_url: str = raw["product_url"]
        external_id = product_url.rstrip("/").split("/")[-1]
        metadata: dict = raw.get("metadata", {})

        return NormalizedProduct(
            source=self.source,
            external_id=external_id,
            brand=raw.get("brand"),
            title=raw["model"],
            price=float(raw["price"]),
            currency="USD",
            category=metadata.get("style"),
            size=raw.get("size"),
            condition=None,
            color=metadata.get("color"),
            is_sold=bool(metadata.get("is_sold", False)),
            image_url=raw.get("image_url"),
            product_url=product_url,
        )
