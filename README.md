# MapMate
An advanced AI-powered offline indoor navigation system bridging top-tier Frontend interfaces with robust Computer Vision localization structures.

## Overview
MapMate enables precise building-to-building AR tracking without reliance on continuous cloud processing or GPS arrays. Utilizing precomputed descriptor point cloud models (.npy) injected dynamically over NetworkX topological routing graphs, the system delivers high accuracy orientation tracking mapped entirely on your localized campus models.

### Currently Supported Environments (MVP)
- **Library** (Main Archive Wing)
- **Admin** (Central Operations)

> **Note on Indoor Modeling:** Room-to-room topological mapping and pathfinding inside buildings are deliberately disabled structurally in this version. This MVP focuses extensively on exterior/entrance-level accurate routing logic.

## Project Structure
- **`Backend/`**: Real active computer vision `.npy` models and OpenCVPnP modules.
- **`mapmate_backend/`**: FastAPI routing logic managing the pipeline inference APIs.
- **`mapmate_frontend/`**: The fully React-based front-end incorporating the interactive Map HUD, Dynamic Tracking routines, and Sensor algorithms.

## Running Locally

**Backend (Python 3.10+)**
```bash
cd mapmate_backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```
**Frontend (Node.js)**
```bash
cd mapmate_frontend
npm install
npm run dev
```

## Render Deployment
MapMate is natively structured for Render infrastructure via a provided `render.yaml`. 
To deploy, connect your GitHub repository directly to Render using their Blueprint system. Render will automatically spin up two services: The Uvicorn REST API, and the React Vite deployment container.

## Future Roadmap
- Expansion to FCSE and MECH Departments.
- Support for internal navigation (hall-to-hall tracking and specific room arrival arrays).
- Extended graph geometries and floor elevation matrices.
