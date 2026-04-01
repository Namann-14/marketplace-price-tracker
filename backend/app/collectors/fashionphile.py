"""Collector for Fashionphile marketplace data."""
from app.collectors.base import BaseCollector, NormalizedProduct


class FashionphileCollector(BaseCollector):
    source = "fashionphile"

    def parse(self, raw: dict) -> NormalizedProduct:
        """
        Map a raw Fashionphile JSON record to a NormalizedProduct.

        Field mappings:
          external_id → raw["product_id"]
          brand       → raw["brand_id"]
          title       → last URL path segment of product_url, hyphens→spaces, title-case
          price       → raw["price"]
          currency    → raw["currency"]
          category    → raw["metadata"]["garment_type"]
          size        → None
          condition   → raw["condition"]
          color       → None
          is_sold     → False
          image_url   → raw["image_url"]
          product_url → raw["product_url"]
        """
        # TODO: implement field extraction
        product_url: str = raw["product_url"]
        slug = product_url.rstrip("/").split("/")[-1]
        title = slug.replace("-", " ").title()
        metadata: dict = raw.get("metadata", {})

        return NormalizedProduct(
            source=self.source,
            external_id=str(raw["product_id"]),
            brand=raw.get("brand_id"),
            title=title,
            price=float(raw["price"]),
            currency=raw.get("currency", "USD"),
            category=metadata.get("garment_type"),
            size=None,
            condition=raw.get("condition"),
            color=None,
            is_sold=False,
            image_url=raw.get("image_url"),
            product_url=product_url,
        )
