"""
ocr_engine.py — Lightweight EasyOCR wrapper for MapMate.
Extracts text tokens from an image for metadata matching.
"""
import re
from typing import Optional
import numpy as np
from PIL import Image


def _load_reader():
    """Lazy-load EasyOCR so the server still starts if GPU/drivers missing."""
    try:
        import easyocr
        return easyocr.Reader(["en"], gpu=False, verbose=False)
    except ImportError:
        return None


# Singleton — only instantiated once per server lifetime
_reader = None


def get_reader():
    global _reader
    if _reader is None:
        _reader = _load_reader()
    return _reader


def extract_text(image: Image.Image) -> dict:
    """
    Run OCR on a PIL image.

    Returns:
        {
            "tokens": ["G4", "OFFICES"],   # uppercase clean tokens
            "raw":    ["G4 Offices"],      # raw EasyOCR strings
            "available": True              # False if EasyOCR not installed
        }
    """
    reader = get_reader()
    if reader is None:
        return {"tokens": [], "raw": [], "available": False}

    img_np = np.array(image)

    try:
        results = reader.readtext(img_np, detail=0, paragraph=True)
    except Exception:
        results = []

    raw_texts = [str(r).strip() for r in results if r]
    tokens = []
    for text in raw_texts:
        # split on whitespace/punctuation, uppercase, filter noise
        parts = re.split(r"[\s\-_/]+", text.upper())
        tokens.extend([p for p in parts if len(p) >= 2])

    return {"tokens": tokens, "raw": raw_texts, "available": True}
