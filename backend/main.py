import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import CORS_ORIGINS, UPLOAD_DIR
from database import init_db

from routes.auth_routes import router as auth_router
from routes.employee_routes import router as employee_router
from routes.attendance_routes import router as attendance_router

app = FastAPI(
    title="AI Face Recognition Attendance System",
    description="InsightFace + FastAPI + SQLAlchemy",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(employee_router)
app.include_router(attendance_router)

os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def root():
    return {
        "message": "AI Face Recognition Attendance System API",
        "version": "1.0.0",
        "status": "running",
    }

@app.get("/health")
def health_check():
    from datetime import datetime
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
