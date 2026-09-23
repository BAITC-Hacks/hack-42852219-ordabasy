import type {
  DistrictId,
  DistrictIndicators,
} from "@/entities/district";

export interface CityMapProps {
  selectedDistrictId: DistrictId;
  onSelectDistrict: (districtId: DistrictId) => void;
  scores?: Partial<Record<DistrictId, number>>;
  indicators?: Partial<Record<DistrictId, DistrictIndicators>>;
  markerDistrictIds?: DistrictId[];
  criticalCounts?: Partial<Record<DistrictId, number>>;
  cityCriticalCount?: number;
}
