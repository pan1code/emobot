from __future__ import annotations

import base64
from dataclasses import dataclass
from io import BytesIO

from PIL import Image, ImageStat


@dataclass
class EmotionModel:
    """Lightweight fallback model for the Python backend."""

    def predict(self, raw_image: str) -> dict[str, float]:
        image = decode_image(raw_image).convert("RGB").resize((96, 96))
        r, g, b = ImageStat.Stat(image).mean
        brightness = (r + g + b) / (3 * 255)
        warmth = max(0.0, (r - b) / 255)
        redness = max(0.0, (r - (g + b) / 2) / 255)
        blueness = max(0.0, (b - r) / 255)

        return normalize_scores(
            {
                "sad": 0.10 + blueness * 1.2 + max(0.0, 0.45 - brightness) * 0.6,
                "happy": 0.15 + warmth * 1.2 + brightness * 0.25,
                "angry": 0.10 + redness * 1.5,
                "calm": 0.35 + max(0.0, 0.70 - abs(brightness - 0.55)) * 0.4,
            }
        )


def decode_image(raw_image: str) -> Image.Image:
    if "," in raw_image:
        raw_image = raw_image.split(",", 1)[1]
    image_bytes = base64.b64decode(raw_image)
    return Image.open(BytesIO(image_bytes))


def normalize_scores(scores: dict[str, float]) -> dict[str, float]:
    total = sum(scores.values()) or 1.0
    return {key: value / total for key, value in scores.items()}
