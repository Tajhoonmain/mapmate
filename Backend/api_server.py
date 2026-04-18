"""
api_server.py — MapMate Hybrid Backend (OCR + CV Fusion)
Run: python api_server.py
"""
import os
import io
from collections import deque

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

import hybrid_infer
from route import NavigationEngine

app = FastAPI(title="MapMate Hybrid Backend", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

base = os.path.dirname(os.path.abspath(__file__))
nav_engine = NavigationEngine(
    os.path.join(base, "graph.json"),
    os.path.join(base, "rooms.json")
)

# Rolling stabilization buffer (majority vote over last 3 predictions)
_history: deque = deque(maxlen=3)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "mode": "Hybrid OCR + Vision"}


# ── Rooms directory ───────────────────────────────────────────────────────────

@app.get("/rooms")
def get_rooms():
    return nav_engine.rooms


# ── Localize ──────────────────────────────────────────────────────────────────

@app.post("/localize")
async def localize(file: UploadFile = File(...)):
    """
    Upload an image → get structured localization result.

    Response:
    {
        "building":    "Brabers",
        "zone":        2,
        "room":        "G4 Offices",
        "source":      "OCR override",
        "confidence":  0.93,
        "message":     "Detected Location: G4 Offices (Brabers) — Confidence: High",
        "status":      "ok"
    }
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        result = hybrid_infer.run(image)

        # Zone stabilization for live-camera use
        _history.append(result["zone"])
        stable_zone = max(set(_history), key=list(_history).count)
        result["zone"] = stable_zone

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Navigate ──────────────────────────────────────────────────────────────────

@app.post("/navigate")
def navigate(data: dict):
    """
    Input:  { "current_zone": 2, "destination": "Lecture Hall 2" }
    Output: { "path": [2,3,4,5,6,7], "next_step": "Move straight", "zones_remaining": 5 }

    Bonus: if already at destination, returns friendly message.
    """
    destination = data.get("destination", "")
    current_zone = data.get("current_zone")

    # Check if user is already there
    dest_zone = nav_engine.get_zone_by_room(destination)
    if dest_zone is not None and int(current_zone) == int(dest_zone):
        return {
            "path": [int(current_zone)],
            "next_step": f"You are already at {destination}",
            "zones_remaining": 0
        }

    path, instruction, remaining = nav_engine.calculate_path(current_zone, destination)
    if path is None:
        raise HTTPException(status_code=404, detail=f"Destination '{destination}' not found in rooms list.")

    return {
        "path": path,
        "next_step": instruction,
        "zones_remaining": remaining
    }


# ── Voice / text destination ──────────────────────────────────────────────────

@app.post("/voice_destination")
def voice_destination(data: dict):
    """
    Input:  { "destination": "g4 offices" }
    Output: { "status": "ok", "zone": 2, "room": "G4 offices" }
    """
    dest = data.get("destination", "")
    zone = nav_engine.get_zone_by_room(dest)
    if zone is None:
        return {"status": "error", "message": f"Room '{dest}' not recognised."}
    return {"status": "ok", "zone": zone, "room": dest}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=False)
