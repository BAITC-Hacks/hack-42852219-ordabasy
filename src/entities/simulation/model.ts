import type {
  DistrictId,
  DistrictIndicators,
  IndicatorCode,
} from "@/entities/district";
import type { Decision } from "@/entities/decision";
import type { InitiativeId } from "@/entities/initiative";

export interface SimulationRequest {
  decisions: Decision[];
}

export interface IndicatorDelta {
  indicator: IndicatorCode;
  before: number;
  after: number;
  delta: number;
}

export interface DistrictSimulationResult {
  districtId: DistrictId;
  beforeScore: number;
  afterScore: number;
  beforeIndicators: DistrictIndicators;
  afterIndicators: DistrictIndicators;
  indicatorDeltas: IndicatorDelta[];
}

export interface ActivatedSynergy {
  initiativeIds: [InitiativeId, InitiativeId];
  title: string;
  districtId: DistrictId | null;
}

export interface CriticalIndicator {
  districtId: DistrictId;
  indicator: IndicatorCode;
  value: number;
}

export interface SimulationResult {
  valid: true;
  baselineScore: number;
  finalScore: number;
  scoreDelta: number;
  budgetUsed: number;
  budgetRemaining: number;
  criticalBefore: number;
  criticalAfter: number;
  weakestDistrictBefore: DistrictId;
  weakestDistrictAfter: DistrictId;
  districts: DistrictSimulationResult[];
  criticalIndicators: CriticalIndicator[];
  activatedSynergies: ActivatedSynergy[];
}

export interface ValidationError {
  code: string;
  message: string;
}

export interface InvalidSimulationResult {
  valid: false;
  errors: ValidationError[];
}

export interface AIAnalysis {
  summary: string;
  strengths: string[];
  risks: string[];
  tradeoffs: string[];
  recommendations: string[];
}

export interface ScenarioSummary {
  decisions: Decision[];
  result: SimulationResult;
  analysis: AIAnalysis | null;
}
