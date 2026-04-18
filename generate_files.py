import os
import json

base = r"c:\8th semester\fyp\inside brabers\mapmate_repo"

# 1. model_loader.py
# Contains PyTorch model definition and transforms to keep everything encapsulated.
model_loader_code = '''import torch
import torch.nn as nn
from torchvision import models, transforms

class HallwayLocalizer(nn.Module):
    def __init__(self, model_name="resnet18", pretrained=False, num_classes=8):
        super(HallwayLocalizer, self).__init__()
        self.num_classes = num_classes
        if model_name == "resnet18":
            self.model = models.resnet18(weights=None)
            self.model.fc = nn.Linear(self.model.fc.in_features, num_classes)
        elif model_name == "efficientnet_b0":
            self.model = models.efficientnet_b0(weights=None)
            self.model.classifier[1] = nn.Linear(self.model.classifier[1].in_features, num_classes)
        else:
            raise ValueError("Unsupported model")

    def forward(self, x):
        return self.model(x)

def get_transforms():
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225])
    ])
'''

# 2. route.py
route_code = '''import json
import os

class NavigationEngine:
    def __init__(self, graph_path, rooms_path):
        with open(graph_path, 'r') as f:
            self.graph = json.load(f)
        with open(rooms_path, 'r') as f:
            self.rooms = json.load(f)

    def get_zone_by_room(self, room_id):
        normalized_search = room_id.upper().replace(" ", "")
        if "LECTUREHALL" in normalized_search:
            normalized_search = normalized_search.replace("LECTUREHALL", "LH")
        
        for key, zone in self.rooms.items():
            normalized_key = key.upper().replace(" ", "")
            if "LECTUREHALL" in normalized_key:
                normalized_key = normalized_key.replace("LECTUREHALL", "LH")
            if normalized_key == normalized_search:
                return zone
        return None

    def calculate_path(self, start_zone, target_room):
        end_zone = self.get_zone_by_room(target_room)
        
        if end_zone is None:
            return None, "Target room not found", 0

        start_zone = int(start_zone)
        end_zone = int(end_zone)
        
        # Linear hallway shortest path
        if start_zone < end_zone:
            path = list(range(start_zone, end_zone + 1))
            instruction = "Move straight"
        elif start_zone > end_zone:
            path = list(range(start_zone, end_zone - 1, -1))
            instruction = "Turn around"
        else:
            path = [start_zone]
            instruction = "Arrived"

        return path, instruction, len(path) - 1
'''

# 3. api_server.py
server_code = '''import os
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
'''

# 4. infer.py
infer_code = '''import torch
from PIL import Image
import torch.nn.functional as F
import os
import argparse
from model_loader import HallwayLocalizer, get_transforms

def run_inference(image_path):
    device = torch.device('cpu')
    model = HallwayLocalizer(num_classes=8).to(device)
    base = os.path.dirname(os.path.abspath(__file__))
    model.load_state_dict(torch.load(os.path.join(base, "../checkpoints/best.pt"), map_location=device))
    model.eval()
    
    preprocess = get_transforms()
    image = Image.open(image_path).convert('RGB')
    tensor = preprocess(image).unsqueeze(0).to(device)
    
    with torch.no_grad():
        output = model(tensor)
        prob = F.softmax(output, dim=1).squeeze()
        conf, pred = torch.max(prob, dim=0)
        
        print(f"Predicted Zone: {pred.item()}")
        print(f"Confidence: {conf.item()*100:.2f}%")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True)
    args = parser.parse_args()
    run_inference(args.image)
'''

# JSON files
rooms_data = {
  "washrooms": 0,
  "Main Lecture Hall": 0,
  "G5 offices": 1,
  "G4 offices": 2,
  "Exam Hall 1": 3,
  "Old PC Lab": 3,
  "Exam Hall 2": 4,
  "Conference room": 4,
  "Exam Hall 3": 5,
  "New PC Lab": 5,
  "G3 offices": 6,
  "Exam Hall 4": 7,
  "Lecture Hall 2": 7
}

graph_data = {
  "0": [1],
  "1": [0, 2],
  "2": [1, 3],
  "3": [2, 4],
  "4": [3, 5],
  "5": [4, 6],
  "6": [5, 7],
  "7": [6]
}

requirements_txt = """fastapi
uvicorn
python-multipart
torch
torchvision
Pillow
"""

# Frontend Docs
api_usage = """# API Usage for Frontend Development

Base URL: `http://<YOUR_PC_IP>:8000`

### 1. Localize (Upload Image)
`POST /localize`
- **Body**: Form-data with key `file` containing the image.
- **Response**:
```json
{
  "zone": 4,
  "confidence": 0.91,
  "status": "ok"
}
```

### 2. Navigate (Get Route)
`POST /navigate`
- **Body** (JSON):
```json
{
  "current_zone": 4,
  "destination": "Lecture Hall 2"
}
```
- **Response**:
```json
{
  "path": [4, 5, 6, 7],
  "next_step": "Move straight",
  "zones_remaining": 3
}
```

### 3. Rooms Directory
`GET /rooms`
Returns a JSON object mapping human-readable rooms to zones.
"""

frontend_setup = """# Frontend Integration Setup

The backend handles model inference and navigation automatically.
Just ensure your frontend application runs on the same Wi-Fi network as the laptop running this backend.

## Example JavaScript Fetch
```javascript
// Localize
const formData = new FormData();
formData.append('file', imageBlob);
const locres = await fetch('http://192.168.1.X:8000/localize', {
    method: 'POST',
    body: formData
});
const locationData = await locres.json();

// Navigate
const navres = await fetch('http://192.168.1.X:8000/navigate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        current_zone: locationData.zone,
        destination: "Lecture Hall 2"
    })
});
const navData = await navres.json();
```
"""

readme_md = """# MapMate: Offline Indoor Localization

The indoor localization model is successfully trained over an 8-zone linear hallway layout! It provides stabilization routines and immediate navigation routes.

## How to Run the Inference Backend
1. `pip install -r backend/requirements.txt`
2. `python backend/api_server.py`

## Structure
- `/backend`: The FastAPI application, CNN model loader, and map layout rules.
- `/checkpoints`: Contains `best.pt`, the state_dict for our ResNet/EfficientNet model. 
- `/frontend_docs`: Guides for the UI team to connect their app safely to the backend locally.

Start integration testing now!
"""

# Write all files
import json
os.makedirs(os.path.join(base, "backend"), exist_ok=True)
os.makedirs(os.path.join(base, "frontend_docs"), exist_ok=True)

with open(os.path.join(base, "backend", "model_loader.py"), "w") as f: f.write(model_loader_code)
with open(os.path.join(base, "backend", "route.py"), "w") as f: f.write(route_code)
with open(os.path.join(base, "backend", "api_server.py"), "w") as f: f.write(server_code)
with open(os.path.join(base, "backend", "infer.py"), "w") as f: f.write(infer_code)
with open(os.path.join(base, "backend", "requirements.txt"), "w") as f: f.write(requirements_txt)
with open(os.path.join(base, "backend", "graph.json"), "w") as f: json.dump(graph_data, f, indent=2)
with open(os.path.join(base, "backend", "rooms.json"), "w") as f: json.dump(rooms_data, f, indent=2)

with open(os.path.join(base, "frontend_docs", "API_USAGE.md"), "w") as f: f.write(api_usage)
with open(os.path.join(base, "frontend_docs", "FRONTEND_SETUP.md"), "w") as f: f.write(frontend_setup)
with open(os.path.join(base, "README.md"), "w") as f: f.write(readme_md)
