"""
fusion.py — Combines OCR tokens + vision model prediction into a single result.

Decision rules (in priority order):
  1. OCR matched a known room/building  → OCR override (highest priority)
  2. OCR matched a building but not room → blend with CV zone
  3. CV confidence >= 0.75 only          → trust CV alone
  4. CV confidence 0.50-0.75             → low-confidence warning
  5. Both weak                           → ask for better image
"""
import json
import os
from typing import Optional


def _load_metadata() -> dict:
    base = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(base, "building_metadata.json"), "r") as f:
        return json.load(f)


_metadata = None


def get_metadata() -> dict:
    global _metadata
    if _metadata is None:
        _metadata = _load_metadata()
    return _metadata


# ── helpers ──────────────────────────────────────────────────────────────────

def _match_tokens(tokens: list[str]) -> Optional[dict]:
    """
    Try to match OCR tokens against building_metadata.json.
    Tries multi-token combos (e.g. 'G4 OFFICES') first, then single tokens.
    Returns the best metadata hit or None.
    """
    meta = get_metadata()

    # Try two-word combos first (e.g. "G4 OFFICES", "EXAM HALL 1")
    for i in range(len(tokens) - 1):
        key = f"{tokens[i]} {tokens[i+1]}"
        if key in meta:
            return meta[key]
        # Also try three-word
        if i + 2 < len(tokens):
            key3 = f"{tokens[i]} {tokens[i+1]} {tokens[i+2]}"
            if key3 in meta:
                return meta[key3]

    # Single token fallback
    for tok in tokens:
        if tok in meta:
            return meta[tok]

    return None


def _confidence_label(conf: float) -> str:
    if conf >= 0.85:
        return "High"
    if conf >= 0.60:
        return "Medium"
    return "Low"


def _user_message(result: dict) -> str:
    source = result.get("source", "")
    conf   = result.get("confidence", 0)
    room   = result.get("room", "")
    bldg   = result.get("building", "")

    if result.get("status") == "unclear":
        return "Need a wider view or clearer angle for confirmation."

    if "OCR" in source:
        return f"Detected Location: {room} ({bldg}) — Confidence: {_confidence_label(conf)}"

    if conf >= 0.75:
        return f"Detected Location: Zone {result.get('zone')} — {room} — Confidence: {_confidence_label(conf)}"

    return f"Location uncertain — please point camera at a room sign or corridor landmark."


# ── main fusion function ──────────────────────────────────────────────────────

def fuse(ocr_result: dict, cv_result: dict) -> dict:
    """
    Fuse OCR and CV results into one structured localization output.

    Args:
        ocr_result: output of ocr_engine.extract_text()
        cv_result:  output of model_infer.predict_zone()

    Returns a dict suitable for the /localize API response.
    """
    tokens       = ocr_result.get("tokens", [])
    ocr_available = ocr_result.get("available", False)

    cv_zone      = cv_result["zone"]
    cv_conf      = cv_result["confidence"]
    cv_label     = cv_result["zone_label"]

    # ── Rule 1: OCR matches a known entry ────────────────────────────────────
    if ocr_available and tokens:
        match = _match_tokens(tokens)
        if match:
            # Blend confidence: OCR match weight 0.7  +  CV support weight 0.3
            # Boost if CV zone agrees with OCR zone
            ocr_conf = 0.85
            if match.get("zone") == cv_zone:
                fused_conf = round(min(ocr_conf + 0.08, 1.0), 4)
                source = "OCR + CV"
            else:
                fused_conf = round(ocr_conf, 4)
                source = "OCR override"

            result = {
                "building":   match.get("building", "Unknown"),
                "zone":       match.get("zone", cv_zone),
                "room":       match.get("room", "Unknown"),
                "source":     source,
                "confidence": fused_conf,
                "ocr_tokens": tokens,
                "cv_zone":    cv_zone,
                "cv_confidence": cv_conf,
                "status":     "ok",
            }
            result["message"] = _user_message(result)
            return result

    # ── Rule 2: CV is confident ───────────────────────────────────────────────
    if cv_conf >= 0.75:
        result = {
            "building":   "Brabers",
            "zone":       cv_zone,
            "room":       cv_label,
            "source":     "Vision model",
            "confidence": cv_conf,
            "ocr_tokens": tokens,
            "cv_zone":    cv_zone,
            "cv_confidence": cv_conf,
            "status":     "ok",
        }
        result["message"] = _user_message(result)
        return result

    # ── Rule 3: Medium CV confidence ─────────────────────────────────────────
    if cv_conf >= 0.50:
        result = {
            "building":   "Brabers",
            "zone":       cv_zone,
            "room":       cv_label,
            "source":     "Vision model (low confidence)",
            "confidence": cv_conf,
            "ocr_tokens": tokens,
            "cv_zone":    cv_zone,
            "cv_confidence": cv_conf,
            "status":     "low_confidence",
        }
        result["message"] = _user_message(result)
        return result

    # ── Rule 4: Both weak ────────────────────────────────────────────────────
    result = {
        "building":   "Unknown",
        "zone":       cv_zone,
        "room":       "Unclear",
        "source":     "Insufficient data",
        "confidence": cv_conf,
        "ocr_tokens": tokens,
        "cv_zone":    cv_zone,
        "cv_confidence": cv_conf,
        "status":     "unclear",
    }
    result["message"] = _user_message(result)
    return result
