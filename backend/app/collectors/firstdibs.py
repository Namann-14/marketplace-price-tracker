"""Collector for 1stDibs marketplace data."""
import re
from app.collectors.base import BaseCollector, NormalizedProduct


class FirstDibsCollector(BaseCollector):
    source = "1stdibs"

    def parse(self, raw: dict) -> NormalizedProduct:
        """
        Map a raw 1stDibs JSON record to a NormalizedProduct.

        Field mappings (verified against real data):
          external_id → segment after "id-" in product_url  (e.g. "v_3093883")
                        Falls back to product_id UUID if pattern not found.
          brand       → raw["brand"]
          title       → raw["model"]
          price       → raw["price"]  (USD value)
          currency    → "USD"
          category    → raw["metadata"]["garment_type"] if present, else None
                        Note: real data often lacks garment_type; condition_display
                        is present instead.
          size        → raw["size"]  (may be null)
          condition   → raw["metadata"]["condition"] if present,
                        else raw["metadata"]["condition_display"]
          color       → None
          is_sold     → False
          image_url   → raw["main_images"][0]["url"] if main_images else None
          product_url → raw["product_url"]
        """
        product_url: str = raw["product_url"]

        # Extract external_id from URL segment after "id-"
        match = re.search(r"/id-([^/]+)", product_url)
        external_id = match.group(1) if match else (
            raw.get("product_id") or product_url.rstrip("/").split("/")[-1]
        )

        metadata: dict = raw.get("metadata", {})

        # condition: prefer metadata.condition, fallback to condition_display
        condition: str | None = (
            metadata.get("condition") or metadata.get("condition_display")
        )

        main_images = raw.get("main_images", [])
        image_url: str | None = main_images[0]["url"] if main_images else None

        return NormalizedProduct(
            source=self.source,
            external_id=external_id,
            brand=raw.get("brand"),
            title=raw["model"],
            price=float(raw["price"]),
            currency="USD",
            category=metadata.get("garment_type"),
            size=raw.get("size"),
            condition=condition,
            color=None,
            is_sold=False,
            image_url=image_url,
            product_url=product_url,
        )
