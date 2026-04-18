"""
model_infer.py — Wraps the trained ResNet checkpoint for zone prediction.
Isolated here so fusion.py can call it cleanly.
"""
import os
import torch
import torch.nn.functional as F
from PIL import Image
from model_loader import load_model, get_transforms

# Zone index → human-readable Brabers zone label
ZONE_LABELS = {
    0: "Entrance / Washrooms / Main Lecture Hall",
    1: "G5 Offices",
    2: "G4 Offices",
    3: "Exam Hall 1 / Old PC Lab",
    4: "Exam Hall 2 / Conference Room",
    5: "Exam Hall 3 / New PC Lab",
    6: "G3 Offices",
    7: "Exam Hall 4 / Lecture Hall 2",
}

_model = None
_device = torch.device("cpu")
_preprocess = get_transforms()


def _load_model():
    global _model
    if _model is None:
        base = os.path.dirname(os.path.abspath(__file__))
        ckpt = os.path.join(base, "../checkpoints/best.pt")
        _model = load_model(ckpt, num_classes=8, device=_device)
    return _model


def predict_zone(image: Image.Image) -> dict:
    """
    Run the vision model on a PIL image.
    Returns:
        {
            "zone": int,
            "zone_label": str,
            "confidence": float,
            "all_probs": {zone: prob, ...}
        }
    """
    model = _load_model()
    tensor = _preprocess(image).unsqueeze(0).to(_device)

    with torch.no_grad():
        output = model(tensor)
        probs = F.softmax(output, dim=1).squeeze()

    conf, pred = torch.max(probs, dim=0)
    zone = pred.item()

    all_probs = {i: round(probs[i].item(), 4) for i in range(len(probs))}

    return {
        "zone": zone,
        "zone_label": ZONE_LABELS.get(zone, f"Zone {zone}"),
        "confidence": round(conf.item(), 4),
        "all_probs": all_probs,
    }
