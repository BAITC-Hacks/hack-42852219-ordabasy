from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_prefix="APP_",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "AstanaInnovation"
    env: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    simulation_budget: int = 100
    required_initiatives: int = 5
    data_dir: Path = BASE_DIR / "app" / "data"


@lru_cache
def get_settings() -> Settings:
    return Settings()

