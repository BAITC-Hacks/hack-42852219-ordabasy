from typing import Annotated

from fastapi import APIRouter, Depends

from app.modules.initiatives.dependencies import get_initiative_service
from app.modules.initiatives.schemas import Initiative
from app.modules.initiatives.service import InitiativeService

router = APIRouter(prefix="/initiatives", tags=["initiatives"])
InitiativeServiceDep = Annotated[InitiativeService, Depends(get_initiative_service)]


@router.get("", response_model=list[Initiative], summary="List city initiatives")
def list_initiatives(service: InitiativeServiceDep) -> list[Initiative]:
    return service.list_initiatives()
