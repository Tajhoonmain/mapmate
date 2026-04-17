from pydantic import BaseModel
from typing import List, Optional

class EnvironmentSelectRequest(BaseModel):
    environment: str

class LocationResponse(BaseModel):
    status: str
    position: Optional[List[float]] = None
    confidence: Optional[float] = None
    environment: Optional[str] = None

class NavigateRequest(BaseModel):
    destination: str

class NavigateResponse(BaseModel):
    path: List[List[float]]
    distance: float
    instructions: List[str]
