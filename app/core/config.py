from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_prefix="APP_",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = Field(
        default="AstanaInnovation",
        validation_alias=AliasChoices("APP_APP_NAME", "APP_NAME"),
    )
    env: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = Field(default_factory=lambda: [
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:5173", "http://127.0.0.1:5173",
    ])
    # Budget and decision limits live exclusively in the versioned dataset rules.
    data_dir: Path = BASE_DIR / "app" / "data"
    public_api_base_url: str = "/api"
    analysis_mode: Literal["remote", "mock", "disabled"] = "remote"


@lru_cache
def get_settings() -> Settings:
    return Settings()
