from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Faultline"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database connection parameters
    POSTGRES_USER: str = "faultline"
    POSTGRES_PASSWORD: str = "faultline"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "faultline"

    DATABASE_URL: Optional[str] = None
    SYNC_DATABASE_URL: Optional[str] = None

    # Demo project details for local development / testing
    DEMO_PROJECT_NAME: str = "Demo Project"
    DEMO_PROJECT_API_KEY: str = "fl_demo_key_9f8e7d6c5b4a"

    # ML Pipeline Settings
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_BATCH_SIZE: int = 64
    CLUSTERING_ALGORITHM: str = "dbscan"  # 'dbscan' or 'hdbscan'
    DBSCAN_EPS: float = 0.20
    DBSCAN_MIN_SAMPLES: int = 3
    HDBSCAN_MIN_CLUSTER_SIZE: int = 3
    HDBSCAN_MIN_SAMPLES: int = 2
    INCREMENTAL_ASSIGNMENT_THRESHOLD: float = 0.25
    PENDING_RECLUSTER_THRESHOLD: int = 20
    ENABLE_OLLAMA_SUMMARY: bool = False
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:latest"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def async_database_url(self) -> str:
        if self.DATABASE_URL:
            # Handle potential docker env formatting
            if self.DATABASE_URL.startswith("postgresql://"):
                return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
            return self.DATABASE_URL
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def sync_database_url(self) -> str:
        url = self.SYNC_DATABASE_URL
        if not url and self.DATABASE_URL:
            if self.DATABASE_URL.startswith("postgresql+asyncpg://"):
                url = self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
            else:
                url = self.DATABASE_URL
        if not url:
            url = (
                f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
                f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url


settings = Settings()
