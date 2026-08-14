import os
import json
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()

def parse_cors_origins() -> list:
    raw = os.getenv("CORS_ORIGINS", "")
    if not raw:
        return ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://localhost:5174", "*"]
    try:
        if raw.startswith("["):
            return json.loads(raw)
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
    except Exception:
        return ["*"]

class Settings(BaseSettings):
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "KVGCE TAP — Activity Tracking & Management System")
    VERSION: str = os.getenv("VERSION", "1.0.0")
    API_PREFIX: str = os.getenv("API_PREFIX", "/api")
    
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "kvgce_tap")
    
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_jwt_key_kvgce_tap_2026_change_in_production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "gemini-1.5-flash")
    
    CORS_ORIGINS: list = parse_cors_origins()

settings = Settings()
