# MapMate — Offline Indoor Localization & Navigation

MapMate is a mobile-first, offline-capable indoor navigation system for multi-building university campuses.

## System Version: 2.0 — Hybrid OCR + Vision Model

### How It Works

1. Camera frame → OCR reads any sign text on walls or doors
2. Same frame → ResNet18 predicts hallway zone
3. Fusion engine combines both signals with priority rules
4. API returns structured location + navigation instructions

### Why Hybrid?

Pure image classifiers fail on visually similar indoor scenes.
OCR can read "G4 Offices" directly off the door sign → immediate high-confidence location override.

---

## Quick Start

```bash
pip install -r backend/requirements.txt
python backend/api_server.py
```

Server runs at `http://0.0.0.0:8000`

---

## Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Check server status |
| `/rooms` | GET | List all known rooms |
| `/localize` | POST | Upload image → get location |
| `/navigate` | POST | Get route to destination |
| `/voice_destination` | POST | Resolve room name to zone |

---

## Localize Response Example

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

Show `message` field directly in your navigation UI.

---

## Project Structure

```
mapmate/
├── backend/
│   ├── api_server.py         # FastAPI server (v2 hybrid)
│   ├── hybrid_infer.py       # Pipeline entry point
│   ├── ocr_engine.py         # EasyOCR text extraction
│   ├── model_infer.py        # ResNet18 zone prediction
│   ├── fusion.py             # OCR + CV fusion logic
│   ├── building_metadata.json# Room → zone knowledge base
│   ├── model_loader.py       # Model architecture + transforms
│   ├── route.py              # Linear hallway routing
│   ├── rooms.json            # Brabers room → zone map
│   ├── graph.json            # Zone adjacency graph
│   └── requirements.txt
├── checkpoints/
│   └── best.pt               # Trained ResNet18 weights
├── frontend_docs/
│   ├── API_USAGE.md
│   ├── FRONTEND_SETUP.md
│   └── HYBRID_SYSTEM.md
└── README.md
```

---

## Model Info

- Architecture: ResNet18 (transfer learning)
- Classes: 8 zones (Brabers building)
- Training accuracy: ~83%
- Inference: CPU-only, ~200ms per frame
