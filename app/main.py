from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api import api_router
from app.core.config import BASE_DIR, get_settings
from app.core.exceptions import register_exception_handlers
from app.modules.health.router import router as health_router
from app.modules.simulations.public_router import router as simulator_router


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        description=(
            "API for an AI-assisted simulator of Astana city management. "
            "The Quality of Life Score is calculated deterministically."
        ),
        version="0.1.0",
        debug=settings.debug,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(application)
    application.include_router(api_router, prefix=settings.api_v1_prefix)
    application.include_router(simulator_router, prefix="/api")
    application.include_router(health_router, prefix="/api")

    web_dir = BASE_DIR / "web"
    if web_dir.is_dir():
        application.mount("/static", StaticFiles(directory=web_dir), name="static")

        @application.get("/", include_in_schema=False)
        def frontend() -> FileResponse:
            return FileResponse(web_dir / "index.html", headers={"Cache-Control": "no-cache"})

    return application


app = create_app()
