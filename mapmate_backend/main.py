from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

app = FastAPI(title="MapMate Backend API", version="1.0.0")

# CORS Configuration for Stitch UI Frontend
# Allows the frontend to make requests without running into CORS errors
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to Stitch UI domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
async def root():
    return {"message": "MapMate Backend API is running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
# trigger reload
