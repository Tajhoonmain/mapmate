"""
api_server.py — MapMate Hybrid Backend (OCR + CV Fusion)
Run: python api_server.py
"""
import os
import io
from collections import deque

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps

# base MUST be defined before DEBUG_DIR so it resolves correctly at startup
base = os.path.dirname(os.path.abspath(__file__))

# Persist uploaded images for byte-level debugging (compare vs smoke-test original)
DEBUG_DIR = os.path.join(base, "debug_uploads")
os.makedirs(DEBUG_DIR, exist_ok=True)

import hybrid_infer
from route import NavigationEngine

app = FastAPI(title="MapMate Hybrid Backend", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# base already defined above
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
    """
    try:
        # 1. Read raw bytes
        contents = await file.read()
        file_size = len(contents)
        
        # 2. Save for debugging (to compare with original)
        debug_path = os.path.join(DEBUG_DIR, f"debug_{file.filename}")
        with open(debug_path, "wb") as f:
            f.write(contents)

        # 3. Load and handle orientation
        raw_image = Image.open(io.BytesIO(contents))
        orig_size = raw_image.size
        
        # This handles mobile uploads where images are rotated via EXIF
        image = ImageOps.exif_transpose(raw_image).convert("RGB")
        processed_size = image.size

        # 4. Run Hybrid Pipeline
        result = hybrid_infer.run(image)

        # Zone stabilization for live-camera use
        _history.append(result["zone"])
        stable_zone = max(set(_history), key=list(_history).count)
        result["zone"] = stable_zone

        # 5. Add Debug Metadata
        result["debug"] = {
            "filename": file.filename,
            "bytes_received": file_size,
            "original_resolution": f"{orig_size[0]}x{orig_size[1]}",
            "processed_resolution": f"{processed_size[0]}x{processed_size[1]}",
            "orientation_fixed": orig_size != processed_size,
            "pipeline": "hybrid_infer (OCR + Vision classifier)",
            "saved_debug_image": debug_path,
            "all_probs": result.get("all_probs", {}),
        }

        print(f"DEBUG: Localized {file.filename} | Size: {file_size} bytes | Res: {processed_size}")
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
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
