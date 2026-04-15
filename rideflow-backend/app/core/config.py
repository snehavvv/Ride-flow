import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RideFlow Production API"
    VERSION: str = "2.0.0"
    
    # Security
    SECRET_KEY: str = os.getenv("JWT_SECRET", "super_secret_production_key_here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./rideflow.db")

settings = Settings()
