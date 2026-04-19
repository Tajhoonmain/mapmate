from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
from pathlib import Path
import json
from .schemas import EnvironmentSelectRequest, LocationResponse, NavigateRequest, NavigateResponse
from services.environment import EnvironmentManager
from services.localization import LocalizationService
from services.navigation import NavigationService

router = APIRouter()

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent / "Backend"


@router.get("/health")
def health():
    return {"status": "ok", "mode": "MapMate Hybrid Backend"}


@router.get("/rooms")
def get_rooms():
    """Return the Brabers room→zone map so the frontend dropdown populates."""
    rooms_file = _BACKEND_DIR / "rooms.json"
    if rooms_file.exists():
        return json.loads(rooms_file.read_text())
    # Hardcoded fallback so the dropdown always has options
    return {
        "Washrooms": 0,
        "Main Lecture Hall": 0,
        "G5 Offices": 1,
        "G4 Offices": 2,
        "Exam Hall 1": 3,
        "Old PC Lab": 3,
        "Exam Hall 2": 4,
        "Conference Room": 4,
        "Exam Hall 3": 5,
        "New PC Lab": 5,
        "G3 Offices": 6,
        "Exam Hall 4": 7,
        "Lecture Hall 2": 7,
    }

env_manager = EnvironmentManager()
localization_service = LocalizationService(env_manager)
navigation_service = NavigationService(env_manager)

@router.get("/environments")
async def get_environments():
    return {"environments": env_manager.get_environments()}

@router.post("/select-environment")
async def select_environment(req: EnvironmentSelectRequest):
    try:
        result = env_manager.load_environment(req.environment)
        return result
    except ValueError as e:
        return JSONResponse(status_code=404, content={"error": str(e), "code": 404})
    except Exception as e:
         return JSONResponse(status_code=500, content={"error": str(e), "code": 500})

@router.post("/localize")
async def localize(file: UploadFile = File(...)):
    # Reads raw multipart bytes — no re-encoding
    try:
        contents = await file.read()
        print(f"[/localize] filename={file.filename} size={len(contents)} content_type={file.content_type}")
        result = localization_service.localize(contents)
        if result.get("status") == "failed":
            return JSONResponse(status_code=500, content={"error": result.get("error", "Localization failed"), "code": 500})
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e), "code": 500})

@router.post("/navigate", response_model=NavigateResponse)
async def navigate(req: NavigateRequest):
    try:
        result = navigation_service.get_path(req.destination, getattr(req, "current_zone", None))
        return result
    except ValueError as e:
         return JSONResponse(status_code=400, content={"error": str(e), "code": 400})
    except Exception as e:
         return JSONResponse(status_code=500, content={"error": str(e), "code": 500})
