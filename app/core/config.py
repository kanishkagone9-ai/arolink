from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Arolink Healthcare API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # PostgreSQL Database URL
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/arolink_db"
    AUTO_CREATE_TABLES: bool = True

    # Security & Auth placeholders (for auth module)
    SECRET_KEY: str = "temporary-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # ABHA / ABDM Sandbox placeholders (for abha module)
    ABDM_CLIENT_ID: Optional[str] = ""
    ABDM_CLIENT_SECRET: Optional[str] = ""
    ABDM_BASE_URL: str = "https://dev.abdm.gov.in"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
