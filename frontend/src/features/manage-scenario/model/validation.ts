import type { Decision } from "@/entities/decision";
import type { DevelopmentCategory, DistrictId } from "@/entities/district";
import {
  getInitiative,
  type Initiative,
  type InitiativeId,
} from "@/entities/initiative";
import type { ValidationError } from "@/entities/simulation";
import {
  INITIAL_BUDGET,
  MAX_CATEGORY_DECISIONS,
  MAX_DECISIONS,
} from "@/shared/config";

export interface ScenarioMetrics {
  budgetUsed: number;
  budgetRemaining: number;
  categoryCounts: Record<DevelopmentCategory, number>;
}

const EMPTY_CATEGORY_COUNTS: Record<DevelopmentCategory, number> = {
  TRANSPORT: 0,
  ECOLOGY: 0,
  SOCIAL: 0,
  SAFETY: 0,
  SERVICES: 0,
};

export function getScenarioMetrics(decisions: Decision[]): ScenarioMetrics {
  const categoryCounts = { ...EMPTY_CATEGORY_COUNTS };
  const budgetUsed = decisions.reduce((total, decision) => {
    const initiative = getInitiative(decision.measureId);
    categoryCounts[initiative.category] += 1;
    return total + initiative.cost;
  }, 0);

  return {
    budgetUsed,
    budgetRemaining: INITIAL_BUDGET - budgetUsed,
    categoryCounts,
  };
}

function hasDecision(
  decisions: Decision[],
  measureId: InitiativeId,
  districtId?: DistrictId | null,
): boolean {
  return decisions.some(
    (decision) =>
      decision.measureId === measureId &&
      (districtId === undefined || decision.districtId === districtId),
  );
}

export function validateScenario(
  decisions: Decision[],
  requireExactlyFive = true,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const { budgetUsed, categoryCounts } = getScenarioMetrics(decisions);
  const ids = decisions.map(({ measureId }) => measureId);

  if (requireExactlyFive && decisions.length !== MAX_DECISIONS) {
    errors.push({
      code: "DECISION_COUNT",
      message: `Нужно выбрать ровно ${MAX_DECISIONS} решений.`,
    });
  }

  if (decisions.length > MAX_DECISIONS) {
    errors.push({
      code: "TOO_MANY_DECISIONS",
      message: `Можно выбрать только ${MAX_DECISIONS} решений.`,
    });
  }

  if (new Set(ids).size !== ids.length) {
    errors.push({
      code: "DUPLICATE_INITIATIVE",
      message: "Каждую инициативу можно выбрать только один раз.",
    });
  }

  if (budgetUsed > INITIAL_BUDGET) {
    errors.push({
      code: "BUDGET_EXCEEDED",
      message: `Бюджет превышен на ${budgetUsed - INITIAL_BUDGET} ед.`,
    });
  }

  for (const [category, count] of Object.entries(categoryCounts)) {
    if (count > MAX_CATEGORY_DECISIONS) {
      errors.push({
        code: "CATEGORY_LIMIT",
        message: `Достигнут лимит: максимум ${MAX_CATEGORY_DECISIONS} меры из направления ${category}.`,
      });
    }
  }

  for (const decision of decisions) {
    const initiative = getInitiative(decision.measureId);
    if (initiative.scope === "DISTRICT" && !decision.districtId) {
      errors.push({
        code: "DISTRICT_REQUIRED",
        message: `Для инициативы «${initiative.name}» нужен район.`,
      });
    }
    if (initiative.scope === "CITY" && decision.districtId) {
      errors.push({
        code: "CITY_DISTRICT_FORBIDDEN",
        message: `Инициатива «${initiative.name}» применяется ко всему городу.`,
      });
    }
  }

  if (hasDecision(decisions, "M1") && hasDecision(decisions, "M3")) {
    errors.push({
      code: "INCOMPATIBLE_INITIATIVES",
      message: "Нельзя одновременно выбрать автобусные полосы и ЛРТ.",
    });
  }

  const sameDistrictConflicts: [InitiativeId, InitiativeId, string][] = [
    ["M4", "M7", "Парк и модульная школа конфликтуют за земельный участок."],
    ["M5", "M13", "Программы чистого топлива и модернизации сетей дублируются."],
  ];
  for (const [first, second, message] of sameDistrictConflicts) {
    const firstDecision = decisions.find(({ measureId }) => measureId === first);
    if (
      firstDecision?.districtId &&
      hasDecision(decisions, second, firstDecision.districtId)
    ) {
      errors.push({ code: "DISTRICT_INCOMPATIBILITY", message });
    }
  }

  return errors;
}

export function getInitiativeDisabledReason(
  initiative: Initiative,
  districtId: DistrictId | null,
  decisions: Decision[],
): string | null {
  if (initiative.scope === "DISTRICT" && !districtId) {
    return "Сначала выберите район на карте";
  }
  if (hasDecision(decisions, initiative.id)) return "Уже выбрано";
  if (decisions.length >= MAX_DECISIONS) return "Все 5 решений уже выбраны";

  const { budgetRemaining, categoryCounts } = getScenarioMetrics(decisions);
  if (initiative.cost > budgetRemaining) {
    return `Недостаточно бюджета: нужно ${initiative.cost} ед., доступно ${budgetRemaining}.`;
  }
  if (categoryCounts[initiative.category] >= MAX_CATEGORY_DECISIONS) {
    return "Достигнут лимит: максимум 2 меры из направления";
  }

  const candidate: Decision = {
    measureId: initiative.id,
    districtId: initiative.scope === "CITY" ? null : districtId,
  };
  const error = validateScenario([...decisions, candidate], false).find(
    ({ code }) =>
      code === "INCOMPATIBLE_INITIATIVES" ||
      code === "DISTRICT_INCOMPATIBILITY",
  );
  return error?.message ?? null;
}
