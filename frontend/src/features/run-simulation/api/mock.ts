import {
  DISTRICTS,
  type DistrictId,
  type DistrictIndicators,
  type IndicatorCode,
} from "@/entities/district";
import type {
  AIAnalysis,
  DistrictSimulationResult,
  SimulationResult,
} from "@/entities/simulation";

const AFTER_SCORES: Record<DistrictId, number> = {
  ESIL: 63.43,
  ALMATY: 57.5,
  SARYARKA: 56.3,
  BAIKONUR: 57.07,
  NURA: 52.78,
};

const AFTER_PATCHES: Partial<
  Record<DistrictId, Partial<DistrictIndicators>>
> = {
  ESIL: { C2: 74.38 },
  ALMATY: { C2: 64.38 },
  SARYARKA: { E2: 48.75, C1: 47.5, C2: 59.38 },
  BAIKONUR: { C2: 62.38 },
  NURA: { S1: 48, S2: 43.75, B1: 67.5, B2: 51.75, C2: 54.38 },
};

function createDistrictResults(): DistrictSimulationResult[] {
  return DISTRICTS.map((district) => {
    const afterIndicators = {
      ...district.indicators,
      ...AFTER_PATCHES[district.id],
    };
    const indicatorDeltas = (
      Object.keys(district.indicators) as IndicatorCode[]
    )
      .map((indicator) => ({
        indicator,
        before: district.indicators[indicator],
        after: afterIndicators[indicator],
        delta: afterIndicators[indicator] - district.indicators[indicator],
      }))
      .filter(({ delta }) => delta !== 0);

    return {
      districtId: district.id,
      beforeScore: district.score,
      afterScore: AFTER_SCORES[district.id],
      beforeIndicators: district.indicators,
      afterIndicators,
      indicatorDeltas,
    };
  });
}

export const MOCK_SIMULATION_RESULT: SimulationResult = {
  valid: true,
  baselineScore: 52.56,
  finalScore: 56.48,
  scoreDelta: 3.92,
  budgetUsed: 95,
  budgetRemaining: 5,
  criticalBefore: 2,
  criticalAfter: 0,
  weakestDistrictBefore: "NURA",
  weakestDistrictAfter: "NURA",
  districts: createDistrictResults(),
  criticalIndicators: [],
  activatedSynergies: [
    {
      initiativeIds: ["M10", "M12"],
      title: "Safe City + цифровая платформа обращений",
      districtId: "NURA",
    },
  ],
};

export const MOCK_AI_ANALYSIS: AIAnalysis = {
  summary:
    "Сценарий направляет ресурсы в слабейший район и одновременно улучшает качество воздуха в Сарыарке. Это снижает число критических показателей, не игнорируя общегородские сервисы.",
  strengths: [
    "Закрыты оба критических социальных показателя Нуры.",
    "Цифровая платформа улучшает сервис во всех пяти районах.",
    "Safe City усиливается синергией с платформой обращений.",
  ],
  risks: [
    "Транспорт не получил отдельной инвестиции.",
    "Пять условных единиц бюджета не создают дополнительного эффекта.",
  ],
  tradeoffs: [
    "Фокус на социальной инфраструктуре ограничил вложения в транспорт.",
    "Экологический эффект локализован преимущественно в Сарыарке.",
  ],
  recommendations: [
    "В следующем сценарии сравните социальный фокус с транспортной стратегией.",
    "Проверьте, можно ли усилить слабые районы без возврата критических значений.",
  ],
};

export async function getMockSimulation(): Promise<SimulationResult> {
  await new Promise((resolve) => window.setTimeout(resolve, 450));
  return MOCK_SIMULATION_RESULT;
}

export async function getMockAnalysis(): Promise<AIAnalysis> {
  await new Promise((resolve) => window.setTimeout(resolve, 400));
  return MOCK_AI_ANALYSIS;
}
