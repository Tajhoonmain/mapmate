# MapMate Hybrid Indoor Localization System

## Why Hybrid?

Pure image classification fails when indoor scenes look visually similar (corridors, walls, doors).
Adding OCR allows the system to read physical signs on walls and doors and override the vision model when it is more reliable.

---

## Architecture

```
Image Input
    │
    ├── [OCR Engine]  → extract_text()  → token list
    │       │
    │       └── match against building_metadata.json
    │
    ├── [Vision Model] → predict_zone() → zone + confidence
    │
    └── [Fusion Logic] → fuse()
            │
            ├── OCR matched known room?  → OCR override (conf ~0.85–0.93)
            ├── CV ≥ 0.75 confidence?   → trust CV alone
            ├── CV 0.50–0.74?           → low-confidence warning
            └── Both weak?              → ask for better image
```

---

## Decision Flow: G4 Offices Example

| Step | Input | Output |
|------|-------|--------|
| OCR extracts text | Image of G4 sign | `["G4", "OFFICES"]` |
| Metadata match | `"G4 OFFICES"` → hit | `{building: Brabers, zone: 2}` |
| CV predicts | same image | `Admin, conf: 0.62` |
| Fusion decision | OCR strong, CV weaker | **OCR override wins** |
| Final result | — | `{room: "G4 offices", zone: 2, conf: 0.93}` |

---

## Files Added

| File | Purpose |
|------|---------|
| `ocr_engine.py` | Reads text from image via EasyOCR |
| `model_infer.py` | Isolated vision model prediction |
| `fusion.py` | Combines OCR + CV with rules |
| `hybrid_infer.py` | Single entry point for pipeline |
| `building_metadata.json` | Known rooms/buildings + zone mapping |
| `api_server.py` | Updated FastAPI server using hybrid pipeline |

---

## OCR Engine: EasyOCR

- No Tesseract binary required (pure Python)
- CPU compatible, loads once at server startup
- Falls back gracefully if not installed (CV-only mode)

---

## Frontend Response Format

```json
{
  "building":    "Brabers",
  "zone":        2,
  "room":        "G4 offices",
  "source":      "OCR override",
  "confidence":  0.93,
  "message":     "Detected Location: G4 offices (Brabers) — Confidence: High",
  "status":      "ok"
}
```

Use the `message` field directly in your UI label.

---

## Source Values

| Source string | Meaning |
|--------------|---------|
| `OCR + CV` | OCR matched AND CV agreed on zone |
| `OCR override` | OCR matched but CV disagreed |
| `Vision model` | Strong CV prediction, no OCR match |
| `Vision model (low confidence)` | CV 50–74%, warning shown |
| `Insufficient data` | Both weak, ask for better image |
