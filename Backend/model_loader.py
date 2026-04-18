import torch
import torch.nn as nn
from torchvision import models, transforms


class HallwayLocalizer(nn.Module):
    def __init__(self, model_name="resnet18", pretrained=False, num_classes=8):
        super(HallwayLocalizer, self).__init__()
        self.num_classes = num_classes
        if model_name == "resnet18":
            self.backbone = models.resnet18(weights=None)
            self.backbone.fc = nn.Linear(self.backbone.fc.in_features, num_classes)
        elif model_name == "efficientnet_b0":
            self.backbone = models.efficientnet_b0(weights=None)
            self.backbone.classifier[1] = nn.Linear(
                self.backbone.classifier[1].in_features, num_classes
            )
        else:
            raise ValueError(f"Unsupported model: {model_name}")

    def forward(self, x):
        return self.backbone(x)


def load_model(checkpoint_path: str, num_classes: int = 8, device=None):
    """Load HallwayLocalizer from checkpoint, tolerating backbone. prefix variants."""
    if device is None:
        device = torch.device("cpu")

    model = HallwayLocalizer(num_classes=num_classes).to(device)
    raw = torch.load(checkpoint_path, map_location=device, weights_only=True)

    # Normalise — strip 'model.' prefix from old checkpoints that saved with self.model
    def _strip(prefix, sd):
        return {k[len(prefix):]: v for k, v in sd.items() if k.startswith(prefix)}

    if all(k.startswith("model.") for k in raw):
        raw = _strip("model.", raw)
        # re-add backbone. prefix to match current arch
        raw = {f"backbone.{k}": v for k, v in raw.items()}
    # If there's no prefix at all the keys already match backbone.* directly

    model.load_state_dict(raw, strict=True)
    model.eval()
    return model


def get_transforms():
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])
