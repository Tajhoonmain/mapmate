import os
import sys
import torch
import torch.nn.functional as F
from PIL import Image

# Because environment.py might load this dynamically, we must ensure we can import the model
sys.path.append(r"c:\8th semester\fyp\inside brabers\indoor_localization")
try:
    from model import HallwayLocalizer
    from dataset import get_transforms
except ImportError as e:
    print(f"Failed to import localizer dependencies: {e}")

class LC_Brabers:
    # Model instantiation is static so it only happens once when the server boots
    model = None
    val_tfms = None
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # Default model configuration (must match how you trained it)
    P_CHECKPOINT = r"c:\8th semester\fyp\inside brabers\indoor_localization\checkpoints\best.pt"

    @classmethod
    def load_model(cls):
        if cls.model is None:
            # Recreate exactly as in config.yaml
            cls.model = HallwayLocalizer(model_name="resnet18", pretrained=False, mode="classification", num_classes=10)
            cls.model.load_state_dict(torch.load(cls.P_CHECKPOINT, map_location=cls.device))
            cls.model.to(cls.device)
            cls.model.eval()
            
            _, cls.val_tfms = get_transforms((224, 224))
            
    @staticmethod
    def localize_brabers(image_path):
        LC_Brabers.load_model()
        
        try:
            image = Image.open(image_path).convert("RGB")
            img_tensor = LC_Brabers.val_tfms(image).unsqueeze(0).to(LC_Brabers.device)
            
            with torch.no_grad():
                output = LC_Brabers.model(img_tensor)
                
                # Handling Classification Mode from your config.yaml
                probabilities = F.softmax(output, dim=1).squeeze()
                conf, pred = torch.max(probabilities, dim=0)
                
                zone = pred.item()
                confidence = float(conf.item())
                
                # Transform Zone integer into physical map X, Y coordinates
                # Assuming simple linear mapping where zone is X coordinate, and Corridor is Y=0
                map_x = float(zone)
                map_y = 0.0
                
                return {
                    "success": True,
                    "building": "Brabers",
                    "map_x": map_x,
                    "map_y": map_y,
                    "confidence": confidence,
                    "is_simulated": False
                }
                
        except Exception as e:
            print(f"Brabers localization failed: {e}")
            return {"success": False, "error": str(e)}
