from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
from .schemas import EnvironmentSelectRequest, LocationResponse, NavigateRequest, NavigateResponse
from services.environment import EnvironmentManager
from services.localization import LocalizationService
from services.navigation import NavigationService

router = APIRouter()

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

@router.post("/localize", response_model=LocationResponse)
async def localize(file: UploadFile = File(...)):
    # Assuming frontend sends camera frame as multipart upload
    try:
        contents = await file.read()
        result = localization_service.localize(contents)
        if result["status"] == "failed":
            return JSONResponse(status_code=500, content={"error": result.get("error", "Localization failed"), "code": 500})
        return result
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "code": 500})

@router.post("/navigate", response_model=NavigateResponse)
async def navigate(req: NavigateRequest):
    try:
        result = navigation_service.get_path(req.destination)
        return result
    except ValueError as e:
         return JSONResponse(status_code=400, content={"error": str(e), "code": 400})
    except Exception as e:
         return JSONResponse(status_code=500, content={"error": str(e), "code": 500})
