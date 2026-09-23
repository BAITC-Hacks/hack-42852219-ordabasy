import {
  CATEGORY_LABELS,
  QOL_SEVERITY_PRESENTATION,
  getCategoryValue,
  getQoLSeverity,
  type DevelopmentCategory,
  type District,
  type DistrictIndicators,
} from "@/entities/district";

export type MapLayer = "QOL" | DevelopmentCategory;

export const MAP_LAYER_OPTIONS: readonly {
  id: MapLayer;
  label: string;
  shortLabel: string;
}[] = [
  { id: "QOL", label: "Общий QoL", shortLabel: "QoL" },
  { id: "TRANSPORT", label: CATEGORY_LABELS.TRANSPORT, shortLabel: "Транспорт" },
  { id: "ECOLOGY", label: CATEGORY_LABELS.ECOLOGY, shortLabel: "Экология" },
  { id: "SOCIAL", label: CATEGORY_LABELS.SOCIAL, shortLabel: "Соцсфера" },
  { id: "SAFETY", label: CATEGORY_LABELS.SAFETY, shortLabel: "Безопасность" },
  { id: "SERVICES", label: CATEGORY_LABELS.SERVICES, shortLabel: "Сервисы" },
] as const;

export function getDistrictLayerValue(
  district: District,
  layer: MapLayer,
  score = district.score,
  indicators: DistrictIndicators = district.indicators,
): number {
  return layer === "QOL"
    ? score
    : getCategoryValue(indicators, layer);
}

export function getDistrictMapStyle(value: number, selected: boolean) {
  const severity = getQoLSeverity(value);
  return {
    fill: QOL_SEVERITY_PRESENTATION[severity].fill,
    fillOpacity: selected ? 0.38 : 0.24,
    severity,
  };
}
