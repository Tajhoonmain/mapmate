import torch
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
