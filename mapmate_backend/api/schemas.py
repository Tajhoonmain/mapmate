from pydantic import BaseModel
from typing import List, Optional

class EnvironmentSelectRequest(BaseModel):
    environment: str

class LocationResponse(BaseModel):
    status: str
    position: Optional[List[float]] = None
    confidence: Optional[float] = None
    environment: Optional[str] = None
    # Brabers classifier fields
    zone: Optional[int] = None
    zone_label: Optional[str] = None
    building: Optional[str] = None
    source: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None
    debug: Optional[dict] = None

class NavigateRequest(BaseModel):
    destination: str

class NavigateResponse(BaseModel):
    path: List[List[float]]
    distance: float
    instructions: List[str]
