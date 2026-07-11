from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="billOS AI Service",
    description="AI endpoints for the billOS platform",
    version="0.1.0",
)

class HealthCheck(BaseModel):
    status: str
    version: str

@app.get("/ai/health", response_model=HealthCheck, tags=["Health"])
async def health_check() -> HealthCheck:
    return HealthCheck(status="healthy", version="0.1.0")

@app.get("/", tags=["Health"])
async def root() -> dict[str, str]:
    return {"message": "Welcome to billOS AI Service. See /docs for API documentation."}
