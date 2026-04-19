from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
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

# ── 1. API Routes ─────────────────────────────────────────────────────────────
app.include_router(router)

# ── 2. React SPA (only when a production build exists) ───────────────────────
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "mapmate_frontend", "dist")

# All API path prefixes — the SPA fallback must NEVER serve HTML for these
_API_PATHS = {
    "rooms", "health", "localize", "navigate",
    "select-environment", "environments",
    "docs", "openapi.json", "redoc",
}

if os.path.isdir(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(request: Request, full_path: str):
        # If the first segment of the path is an API endpoint, return 404 JSON
        # so the browser/fetch sees a proper error instead of HTML.
        first_segment = full_path.split("/")[0]
        if first_segment in _API_PATHS:
            return JSONResponse({"error": f"API route /{full_path} not found"}, status_code=404)

        # Serve real static files (favicon, manifest, etc.)
        static_file = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(static_file):
            return FileResponse(static_file)

        # React Router deep-links → always serve index.html
        index = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index):
            return FileResponse(index)

        return HTMLResponse("<h1>Build not found</h1>", status_code=404)

else:
    # No frontend build (pure API / local dev mode)
    @app.get("/", include_in_schema=False)
    def root():
        return HTMLResponse(
            "<h1>MapMate Backend API is running.</h1>"
            "<p>API docs: <a href='/docs'>/docs</a></p>"
        )
