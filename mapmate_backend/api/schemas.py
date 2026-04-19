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
    current_zone: Optional[int] = None

class NavigateResponse(BaseModel):
    path: List[int] = [] # Changed from List[List[float]] to support zones or flexible paths
    distance: float = 0.0
    instructions: List[str] = []
    next_step: Optional[str] = None
    zones_remaining: Optional[int] = None
