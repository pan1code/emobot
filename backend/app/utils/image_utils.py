import base64


def strip_data_url(raw_image: str) -> str:
    if "," in raw_image:
        return raw_image.split(",", 1)[1]
    return raw_image


def decode_base64_image(raw_image: str) -> bytes:
    return base64.b64decode(strip_data_url(raw_image))
