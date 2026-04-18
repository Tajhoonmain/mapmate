import os
from collections import deque
import io

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn.functional as F
from PIL import Image

from model_loader import HallwayLocalizer, get_transforms
from route import NavigationEngine

app = FastAPI(title="MapMate Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

base = os.path.dirname(os.path.abspath(__file__))
nav_engine = NavigationEngine(os.path.join(base, "graph.json"), os.path.join(base, "rooms.json"))

# Prediction stabilizing buffer
prediction_history = deque(maxlen=3)

# CPU inference for laptop
device = torch.device("cpu")
model = HallwayLocalizer(num_classes=8).to(device)
model_path = os.path.join(base, "../checkpoints/best.pt")
model.load_state_dict(torch.load(model_path, map_location=device, weights_only=True))
model.eval()

preprocess = get_transforms()

@app.get("/health")
def health():
    return {"status": "ok", "device": str(device)}

@app.get("/rooms")
def get_rooms():
    return nav_engine.rooms

@app.post("/localize")
async def localize(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        input_tensor = preprocess(image).unsqueeze(0).to(device)

        with torch.no_grad():
            output = model(input_tensor)
            probabilities = F.softmax(output, dim=1).squeeze()
            if probabilities.dim() == 0:
                probabilities = probabilities.unsqueeze(0)
            conf, pred = torch.max(probabilities, dim=0)
            raw_zone = pred.item()

            prediction_history.append(raw_zone)
            stable_zone = max(set(prediction_history), key=list(prediction_history).count)

            return {
                "zone": stable_zone,
                "confidence": round(conf.item(), 4),
                "status": "ok" # Format requested by user
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/navigate")
def navigate(data: dict):
    path, instruction, remaining = nav_engine.calculate_path(
        data.get("current_zone"), 
        data.get("destination")
    )
    if path is None:
        raise HTTPException(status_code=404, detail="Destination not found")

    return {
        "path": path,
        "next_step": instruction,
        "zones_remaining": remaining
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=False)
