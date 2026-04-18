import torch
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
