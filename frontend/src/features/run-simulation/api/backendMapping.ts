/**
 * Wire-level shapes returned by the actual FastAPI backend
 * (app/modules/simulations/schemas.py) and mappers to/from this app's
 * domain types. The backend uses lowercase district ids and a different
 * field layout (baseline/result snapshots, not a flat before/after record),
 * so nothing here can be a straight pass-through.
 */
import type { Decision } from "@/entities/decision";
import {
  type DistrictId,
  type DistrictIndicators,
  type IndicatorCode,
} from "@/entities/district";
import { getInitiative, type InitiativeId } from "@/entities/initiative";
import type {
  ActivatedSynergy,
  AIAnalysis,
  CriticalIndicator,
  DistrictSimulationResult,
  InvalidSimulationResult,
  SimulationResult,
  ValidationError,
} from "@/entities/simulation";

const INDICATOR_CODES: readonly IndicatorCode[] = [
  "T1", "T2", "E1", "E2", "S1", "S2", "B1", "B2", "C1", "C2",
];

interface WireDecisionInput {
  initiativeId: InitiativeId;
  districtId: string | null;
}

interface WireBudget {
  limit: number;
  spent: number;
  remaining: number;
}

interface WireDistrictSnapshot {
  id: string;
  score: number;
  indicators: Record<IndicatorCode, number>;
}

interface WireCriticalIndicator {
  districtId: string;
  indicator: IndicatorCode;
  value: number;
}

interface WireSnapshot {
  score: number;
  weakestDistrictId: string;
  criticalCount: number;
  criticalIndicators: WireCriticalIndicator[];
  districts: WireDistrictSnapshot[];
}

interface WireSynergy {
  id: string;
  initiatives: string[];
  districtId: string | null;
}

export interface WireScenarioRequest {
  scenarioVersion: string;
  decisions: WireDecisionInput[];
}

export interface WireSimulationResult {
  scenarioVersion: string;
  budget: WireBudget;
  baseline: WireSnapshot;
  result: WireSnapshot;
  scoreChange: number;
  synergies: WireSynergy[];
}

export interface WireAnalysisResponse {
  scenarioVersion: string;
  summary: string;
  strengths: string[];
  risks: string[];
  tradeoffs: string[];
  recommendations: string[];
}

export interface WireErrorBody {
  error?: {
    message?: string;
    details?: { errors?: { code: string; message: string }[] };
  };
}

export function newScenarioVersion(): string {
  return crypto.randomUUID();
}

export function toWireScenarioRequest(
  decisions: Decision[],
  scenarioVersion: string,
): WireScenarioRequest {
  return {
    scenarioVersion,
    decisions: decisions.map((decision) => ({
      initiativeId: decision.measureId,
      districtId: decision.districtId ? decision.districtId.toLowerCase() : null,
    })),
  };
}

function toDistrictId(id: string): DistrictId {
  return id.toUpperCase() as DistrictId;
}

function districtById(
  snapshot: WireSnapshot,
  id: string,
): WireDistrictSnapshot {
  const district = snapshot.districts.find((item) => item.id === id);
  if (!district) {
    throw new Error(`Сервер не вернул данные по району ${id}.`);
  }
  return district;
}

function mapCriticalIndicators(
  indicators: WireCriticalIndicator[],
): CriticalIndicator[] {
  return indicators.map((indicator) => ({
    districtId: toDistrictId(indicator.districtId),
    indicator: indicator.indicator,
    value: indicator.value,
  }));
}

function mapDistricts(
  baseline: WireSnapshot,
  result: WireSnapshot,
): DistrictSimulationResult[] {
  return baseline.districts.map((before) => {
    const after = districtById(result, before.id);
    return {
      districtId: toDistrictId(before.id),
      beforeScore: before.score,
      afterScore: after.score,
      beforeIndicators: before.indicators as DistrictIndicators,
      afterIndicators: after.indicators as DistrictIndicators,
      indicatorDeltas: INDICATOR_CODES.map((indicator) => ({
        indicator,
        before: before.indicators[indicator],
        after: after.indicators[indicator],
        delta: after.indicators[indicator] - before.indicators[indicator],
      })),
    };
  });
}

function mapSynergies(synergies: WireSynergy[]): ActivatedSynergy[] {
  return synergies
    .filter((synergy) => synergy.initiatives.length >= 2)
    .map((synergy) => {
      const [first, second] = synergy.initiatives as [InitiativeId, InitiativeId];
      const title = `${getInitiative(first).shortName} + ${getInitiative(second).shortName}`;
      return {
        initiativeIds: [first, second],
        title,
        districtId: synergy.districtId ? toDistrictId(synergy.districtId) : null,
      };
    });
}

export function mapWireSimulationResult(
  wire: WireSimulationResult,
): SimulationResult {
  return {
    valid: true,
    baselineScore: wire.baseline.score,
    finalScore: wire.result.score,
    scoreDelta: wire.scoreChange,
    budgetUsed: wire.budget.spent,
    budgetRemaining: wire.budget.remaining,
    criticalBefore: wire.baseline.criticalCount,
    criticalAfter: wire.result.criticalCount,
    weakestDistrictBefore: toDistrictId(wire.baseline.weakestDistrictId),
    weakestDistrictAfter: toDistrictId(wire.result.weakestDistrictId),
    districts: mapDistricts(wire.baseline, wire.result),
    criticalIndicators: mapCriticalIndicators(wire.result.criticalIndicators),
    activatedSynergies: mapSynergies(wire.synergies),
  };
}

export function mapWireValidationError(
  body: WireErrorBody,
): InvalidSimulationResult {
  const errors: ValidationError[] = body.error?.details?.errors?.length
    ? body.error.details.errors
    : [{ code: "unknown", message: body.error?.message ?? "Сервер отклонил сценарий." }];
  return { valid: false, errors };
}

export function mapWireAnalysis(wire: WireAnalysisResponse): AIAnalysis {
  return {
    summary: wire.summary,
    strengths: wire.strengths,
    risks: wire.risks,
    tradeoffs: wire.tradeoffs,
    recommendations: wire.recommendations,
  };
}
