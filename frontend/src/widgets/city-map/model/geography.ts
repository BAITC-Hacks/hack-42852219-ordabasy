import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";

import type { DistrictId } from "@/entities/district";

export interface DistrictGeography {
  id: DistrictId;
  positions: LatLngExpression[];
  labelPosition: LatLngExpression;
}

export const ASTANA_CENTER: LatLngExpression = [51.14, 71.46];

export const ASTANA_MAP_BOUNDS: LatLngBoundsExpression = [
  [50.99, 71.17],
  [51.3, 71.73],
];

// Simplified visual boundaries for the synthetic five-district scenario.
// They are geographically placed over Astana but are not legal cadastral data.
export const DISTRICT_GEOGRAPHY: readonly DistrictGeography[] = [
  {
    id: "SARYARKA",
    positions: [
      [51.245, 71.205],
      [51.285, 71.405],
      [51.225, 71.435],
      [51.175, 71.47],
      [51.17, 71.355],
      [51.155, 71.225],
    ],
    labelPosition: [51.21, 71.31],
  },
  {
    id: "BAIKONUR",
    positions: [
      [51.285, 71.405],
      [51.29, 71.56],
      [51.225, 71.59],
      [51.175, 71.47],
      [51.225, 71.435],
    ],
    labelPosition: [51.242, 71.505],
  },
  {
    id: "ALMATY",
    positions: [
      [51.225, 71.59],
      [51.245, 71.7],
      [51.11, 71.72],
      [51.075, 71.6],
      [51.145, 71.57],
      [51.175, 71.47],
    ],
    labelPosition: [51.16, 71.635],
  },
  {
    id: "NURA",
    positions: [
      [51.155, 71.225],
      [51.17, 71.355],
      [51.175, 71.47],
      [51.105, 71.485],
      [51.02, 71.43],
      [50.995, 71.25],
      [51.06, 71.18],
    ],
    labelPosition: [51.08, 71.3],
  },
  {
    id: "ESIL",
    positions: [
      [51.175, 71.47],
      [51.145, 71.57],
      [51.075, 71.6],
      [51.015, 71.54],
      [51.02, 71.43],
      [51.105, 71.485],
    ],
    labelPosition: [51.075, 71.51],
  },
] as const;
