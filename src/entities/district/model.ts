export type DistrictId =
  | "ESIL"
  | "ALMATY"
  | "SARYARKA"
  | "BAIKONUR"
  | "NURA";

export type IndicatorCode =
  | "T1"
  | "T2"
  | "E1"
  | "E2"
  | "S1"
  | "S2"
  | "B1"
  | "B2"
  | "C1"
  | "C2";

export type DevelopmentCategory =
  | "TRANSPORT"
  | "ECOLOGY"
  | "SOCIAL"
  | "SAFETY"
  | "SERVICES";

export type DistrictIndicators = Record<IndicatorCode, number>;

export interface DistrictProblem {
  indicator: IndicatorCode;
  label: string;
  value: number;
}

export interface District {
  id: DistrictId;
  name: string;
  populationShare: number;
  score: number;
  profile: string;
  keyProblem: string;
  indicators: DistrictIndicators;
}

export type QoLSeverity =
  | "CRITICAL"
  | "NEEDS_ATTENTION"
  | "GOOD"
  | "EXCELLENT";

export const QOL_SEVERITY_PRESENTATION: Record<
  QoLSeverity,
  {
    label: string;
    fill: string;
    barClass: string;
    textClass: string;
  }
> = {
  CRITICAL: {
    label: "Критично",
    fill: "#d86f64",
    barClass: "bg-rose-500",
    textClass: "text-rose-700",
  },
  NEEDS_ATTENTION: {
    label: "Требует внимания",
    fill: "#e4ad4f",
    barClass: "bg-amber-500",
    textClass: "text-amber-700",
  },
  GOOD: {
    label: "Хорошо",
    fill: "#57aa8f",
    barClass: "bg-teal-600",
    textClass: "text-teal-700",
  },
  EXCELLENT: {
    label: "Отлично",
    fill: "#267d6b",
    barClass: "bg-emerald-700",
    textClass: "text-emerald-800",
  },
};

export const INDICATOR_LABELS: Record<IndicatorCode, string> = {
  T1: "Разгрузка дорог",
  T2: "Доступность общественного транспорта",
  E1: "Озеленение",
  E2: "Качество воздуха",
  S1: "Школы и детсады",
  S2: "Поликлиники и первичная медпомощь",
  B1: "Безопасность улиц",
  B2: "Безопасность дорожного движения",
  C1: "Надёжность ЖКХ",
  C2: "Скорость решения обращений",
};

export const CATEGORY_LABELS: Record<DevelopmentCategory, string> = {
  TRANSPORT: "Транспорт",
  ECOLOGY: "Экология",
  SOCIAL: "Соцсфера",
  SAFETY: "Безопасность",
  SERVICES: "Сервисы",
};

export const CATEGORY_INDICATORS: Record<
  DevelopmentCategory,
  readonly [IndicatorCode, IndicatorCode]
> = {
  TRANSPORT: ["T1", "T2"],
  ECOLOGY: ["E1", "E2"],
  SOCIAL: ["S1", "S2"],
  SAFETY: ["B1", "B2"],
  SERVICES: ["C1", "C2"],
};

export const DISTRICTS: readonly District[] = [
  {
    id: "ESIL",
    name: "Есиль",
    populationShare: 0.27,
    score: 62.99,
    profile: "Богатый район, но с пробками на мостах и переполненными школами.",
    keyProblem: "Пробки на мостах и переполненные школы",
    indicators: {
      T1: 45, T2: 62, E1: 68, E2: 72, S1: 48,
      S2: 55, B1: 78, B2: 60, C1: 75, C2: 70,
    },
  },
  {
    id: "ALMATY",
    name: "Алматы",
    populationShare: 0.24,
    score: 57.06,
    profile: "Старый ЖКХ и пробки.",
    keyProblem: "Пробки и изношенная инфраструктура ЖКХ",
    indicators: {
      T1: 40, T2: 75, E1: 50, E2: 55, S1: 60,
      S2: 65, B1: 62, B2: 52, C1: 50, C2: 60,
    },
  },
  {
    id: "SARYARKA",
    name: "Сарыарка",
    populationShare: 0.2,
    score: 54.65,
    profile: "Смог от частного сектора, слабое озеленение.",
    keyProblem: "Смог и недостаток зелёных пространств",
    indicators: {
      T1: 50, T2: 70, E1: 42, E2: 40, S1: 62,
      S2: 68, B1: 58, B2: 55, C1: 45, C2: 55,
    },
  },
  {
    id: "BAIKONUR",
    name: "Байконур",
    populationShare: 0.13,
    score: 56.63,
    profile: "Середняк без ярких перекосов.",
    keyProblem: "Сбалансированный район без острого кризиса",
    indicators: {
      T1: 52, T2: 68, E1: 55, E2: 50, S1: 58,
      S2: 60, B1: 52, B2: 58, C1: 55, C2: 58,
    },
  },
  {
    id: "NURA",
    name: "Нура",
    populationShare: 0.16,
    score: 49.18,
    profile: "Главный аутсайдер по соцсфере и транспорту.",
    keyProblem: "Нехватка школ, поликлиник и общественного транспорта",
    indicators: {
      T1: 55, T2: 40, E1: 45, E2: 65, S1: 38,
      S2: 35, B1: 55, B2: 50, C1: 60, C2: 50,
    },
  },
] as const;

export function getDistrict(districtId: DistrictId): District {
  const district = DISTRICTS.find(({ id }) => id === districtId);
  if (!district) {
    throw new Error(`Unknown district: ${districtId}`);
  }
  return district;
}

export function getQoLSeverity(score: number): QoLSeverity {
  if (score < 45) return "CRITICAL";
  if (score < 60) return "NEEDS_ATTENTION";
  if (score < 80) return "GOOD";
  return "EXCELLENT";
}

export function getCriticalIndicatorCount(
  indicators: DistrictIndicators,
): number {
  return Object.values(indicators).filter((value) => value < 40).length;
}

export function getCategoryValue(
  indicators: DistrictIndicators,
  category: DevelopmentCategory,
): number {
  const [first, second] = CATEGORY_INDICATORS[category];
  return (indicators[first] + indicators[second]) / 2;
}

export function getDistrictProblems(district: District): DistrictProblem[] {
  return (Object.entries(district.indicators) as [IndicatorCode, number][])
    .filter(([, value]) => value <= 45)
    .sort(([, left], [, right]) => left - right)
    .slice(0, 3)
    .map(([indicator, value]) => ({
      indicator,
      label: INDICATOR_LABELS[indicator],
      value,
    }));
}
