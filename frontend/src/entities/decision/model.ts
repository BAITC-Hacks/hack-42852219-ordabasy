import type { DistrictId } from "@/entities/district";
import type { InitiativeId } from "@/entities/initiative";

export interface Decision {
  measureId: InitiativeId;
  districtId: DistrictId | null;
}
