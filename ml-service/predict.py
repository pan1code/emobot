import base64
from io import BytesIO

from fastapi import FastAPI
from pydantic import BaseModel
from PIL import Image

from model import EmotionModel


app = FastAPI(title="emobot ml-service")
model = EmotionModel()


class PredictRequest(BaseModel):
    image: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict")
def predict(payload: PredictRequest) -> dict:
    image = decode_image(payload.image)
    scores = model.predict(image)
    emotion = max(scores, key=scores.get)
    return {"emotion": emotion, "scores": scores}


def decode_image(raw_image: str) -> Image.Image:
    if "," in raw_image:
        raw_image = raw_image.split(",", 1)[1]
    image_bytes = base64.b64decode(raw_image)
    return Image.open(BytesIO(image_bytes))
