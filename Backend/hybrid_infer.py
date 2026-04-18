"""
hybrid_infer.py — Top-level pipeline: OCR + CV → Fusion → Result
Call run(image) from api_server.py.
"""
from PIL import Image
from ocr_engine import extract_text
from model_infer import predict_zone
from fusion import fuse


def run(image: Image.Image) -> dict:
    """
    Full hybrid inference pipeline on a PIL image.
    Returns fused localization result dict.
    """
    ocr_result = extract_text(image)
    cv_result  = predict_zone(image)
    return fuse(ocr_result, cv_result)
