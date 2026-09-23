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
  /** Highlights every district at once, for a city-wide measure that isn't tied to one district. */
  highlightAll?: boolean;
}
