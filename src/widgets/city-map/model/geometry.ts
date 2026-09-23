import type { DistrictId } from "@/entities/district";

export interface DistrictGeometry {
  id: DistrictId;
  points: string;
  labelX: number;
  labelY: number;
}

export const DISTRICT_GEOMETRY: readonly DistrictGeometry[] = [
  { id: "ESIL", points: "322,66 494,92 534,205 420,244 292,174", labelX: 410, labelY: 145 },
  { id: "NURA", points: "494,92 674,118 732,251 534,205", labelX: 608, labelY: 169 },
  { id: "SARYARKA", points: "176,188 292,174 420,244 374,382 192,354 116,271", labelX: 273, labelY: 277 },
  { id: "BAIKONUR", points: "420,244 534,205 632,326 572,444 374,382", labelX: 492, labelY: 329 },
  { id: "ALMATY", points: "632,326 732,251 788,380 692,510 572,444", labelX: 680, labelY: 383 },
] as const;
