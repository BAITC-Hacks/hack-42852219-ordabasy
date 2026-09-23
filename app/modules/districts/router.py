from typing import Annotated

from fastapi import APIRouter, Depends

from app.modules.districts.dependencies import get_district_service
from app.modules.districts.schemas import District
from app.modules.districts.service import DistrictService

router = APIRouter(prefix="/districts", tags=["districts"])
DistrictServiceDep = Annotated[DistrictService, Depends(get_district_service)]


@router.get("", response_model=list[District], summary="List Astana districts")
def list_districts(service: DistrictServiceDep) -> list[District]:
    return service.list_districts()


@router.get("/{district_id}", response_model=District, summary="Get a district")
def get_district(district_id: str, service: DistrictServiceDep) -> District:
    return service.get_district(district_id)

