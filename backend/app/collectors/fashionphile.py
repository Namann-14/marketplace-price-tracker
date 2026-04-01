"""Collector for Fashionphile marketplace data."""
from app.collectors.base import BaseCollector, NormalizedProduct


class FashionphileCollector(BaseCollector):
    source = "fashionphile"

    def parse(self, raw: dict) -> NormalizedProduct:
        """
        Map a raw Fashionphile JSON record to a NormalizedProduct.

        Field mappings (verified against real data):
          external_id → raw["product_id"]  (UUID string)
          brand       → raw["brand"] if present, else raw["brand_id"]
          title       → raw["model"] if present; fallback: last URL slug title-cased
          price       → raw["price"]
          currency    → raw["currency"]  (always "USD" in real data)
          category    → raw["metadata"]["garment_type"] if present, else None
          size        → None  (not in Fashionphile data)
          condition   → raw["condition"]  (e.g. "Shows Wear")
          color       → None
          is_sold     → False
          image_url   → raw["image_url"] if present, else main_images[0]["url"]
          product_url → raw["product_url"]
        """
        product_url: str = raw["product_url"]
        metadata: dict = raw.get("metadata", {})

        # Title: prefer top-level "model", fall back to slug-derived title
        title: str = raw.get("model") or (
            product_url.rstrip("/").split("/")[-1].replace("-", " ").title()
        )

        # Brand: prefer top-level "brand" (e.g. "Tiffany"), fallback to brand_id
        brand: str | None = raw.get("brand") or raw.get("brand_id")

        # Image: prefer top-level image_url, fall back to main_images
        image_url: str | None = raw.get("image_url")
        if not image_url:
            main_images = raw.get("main_images", [])
            image_url = main_images[0]["url"] if main_images else None

        return NormalizedProduct(
            source=self.source,
            external_id=str(raw["product_id"]),
            brand=brand,
            title=title,
            price=float(raw["price"]),
            currency=raw.get("currency", "USD"),
            category=metadata.get("garment_type"),
            size=None,
            condition=raw.get("condition"),
            color=None,
            is_sold=False,
            image_url=image_url,
            product_url=product_url,
        )
