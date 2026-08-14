from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import db_manager
from app.routes import auth, student, faculty, admin, assessments, activities, ai, notifications

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await db_manager.connect_to_database()
    # Auto-seed if fallback in-memory db is empty
    users_col = db_manager.get_collection("users")
    if hasattr(users_col, "data") and len(users_col.data) == 0:
        from seed import seed_database
        await seed_database()

@app.get("/")
def read_root():
    return {
        "success": True,
        "message": "Welcome to KVGCE TAP — Activity Tracking & Management System API",
        "version": settings.VERSION
    }

@app.get("/api/health")
def health_check():
    return {
        "success": True,
        "message": "KVGCE TAP API is running"
    }

# Register API Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(student.router, prefix=settings.API_PREFIX)
app.include_router(faculty.router, prefix=settings.API_PREFIX)
app.include_router(admin.router, prefix=settings.API_PREFIX)
app.include_router(assessments.router, prefix=settings.API_PREFIX)
app.include_router(activities.router, prefix=settings.API_PREFIX)
app.include_router(ai.router, prefix=settings.API_PREFIX)
app.include_router(notifications.router, prefix=settings.API_PREFIX)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
