from __future__ import annotations

from dataclasses import dataclass

from PIL import Image, ImageStat


@dataclass
class EmotionModel:
    """Small replaceable model.

    For the coursework architecture this gives a working Python ML service.
    Later you can replace `predict` with a real neural network call.
    """

    def predict(self, image: Image.Image) -> dict[str, float]:
        image = image.convert("RGB").resize((96, 96))
        r, g, b = ImageStat.Stat(image).mean
        brightness = (r + g + b) / (3 * 255)
        warmth = max(0.0, (r - b) / 255)
        redness = max(0.0, (r - (g + b) / 2) / 255)
        blueness = max(0.0, (b - r) / 255)

        happy = 0.15 + warmth * 1.2 + brightness * 0.25
        angry = 0.10 + redness * 1.5
        sad = 0.10 + blueness * 1.2 + max(0.0, 0.45 - brightness) * 0.6
        calm = 0.35 + max(0.0, 0.70 - abs(brightness - 0.55)) * 0.4

        return normalize({"sad": sad, "happy": happy, "angry": angry, "calm": calm})


def normalize(scores: dict[str, float]) -> dict[str, float]:
    total = sum(scores.values()) or 1.0
    return {key: value / total for key, value in scores.items()}
