# MapMate: Offline Indoor Localization

The indoor localization model is successfully trained over an 8-zone linear hallway layout! It provides stabilization routines and immediate navigation routes.

## How to Run the Inference Backend
1. `pip install -r backend/requirements.txt`
2. `python backend/api_server.py`

## Structure
- `/backend`: The FastAPI application, CNN model loader, and map layout rules.
- `/checkpoints`: Contains `best.pt`, the state_dict for our ResNet/EfficientNet model. 
- `/frontend_docs`: Guides for the UI team to connect their app safely to the backend locally.

Start integration testing now!
