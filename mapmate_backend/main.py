from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from api.routes import router
import os

app = FastAPI(title="MapMate App", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Essential Backend API Routes
app.include_router(router)

# Mount React Frontend
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "mapmate_frontend", "dist")

@app.get("/{full_path:path}")
async def serve_react_app(request: Request, full_path: str):
    # Try serving the literal static file
    file_path = os.path.join(FRONTEND_DIR, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
        
    # Provide React Router mapping via index.html for Single Page App
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
        
    return HTMLResponse("<h1>MapMate Backend API is running.</h1><p>Frontend build not found. If on Render, ensure your build command includes 'npm run build'.</p>", status_code=200)
