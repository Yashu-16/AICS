from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "AICS API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    DATABASE_URL: str = "postgresql://aics:aics_pass@localhost:5432/aics"
    ANTHROPIC_API_KEY: str = ""
    ALLOWED_ORIGINS: list = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()