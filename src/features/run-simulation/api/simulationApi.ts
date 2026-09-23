import type {
  AIAnalysis,
  InvalidSimulationResult,
  SimulationRequest,
  SimulationResult,
} from "@/entities/simulation";
import { postJson } from "@/shared/api";
import { API_ENDPOINTS, API_MODE } from "@/shared/config";

import { getMockAnalysis, getMockSimulation } from "./mock";

function isSimulationResult(value: unknown): value is SimulationResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<SimulationResult>;
  return (
    result.valid === true &&
    typeof result.baselineScore === "number" &&
    typeof result.finalScore === "number" &&
    typeof result.scoreDelta === "number" &&
    Array.isArray(result.districts) &&
    Array.isArray(result.activatedSynergies)
  );
}

function isInvalidSimulationResult(
  value: unknown,
): value is InvalidSimulationResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<InvalidSimulationResult>;
  return result.valid === false && Array.isArray(result.errors);
}

function isAIAnalysis(value: unknown): value is AIAnalysis {
  if (!value || typeof value !== "object") return false;
  const analysis = value as Partial<AIAnalysis>;
  return (
    typeof analysis.summary === "string" &&
    Array.isArray(analysis.strengths) &&
    Array.isArray(analysis.risks) &&
    Array.isArray(analysis.tradeoffs) &&
    Array.isArray(analysis.recommendations)
  );
}

export async function simulateScenario(
  request: SimulationRequest,
): Promise<SimulationResult> {
  if (API_MODE === "mock") return getMockSimulation();

  const response = await postJson<unknown>(API_ENDPOINTS.simulate, request);
  if (isInvalidSimulationResult(response)) {
    throw new Error(
      response.errors.map(({ message }) => message).join(" ") ||
        "Сервер отклонил сценарий.",
    );
  }
  if (!isSimulationResult(response)) {
    throw new Error("Сервер вернул данные симуляции в неизвестном формате.");
  }
  return response;
}

export async function analyzeScenario(
  request: SimulationRequest,
  result: SimulationResult,
): Promise<AIAnalysis> {
  if (API_MODE === "mock") return getMockAnalysis();

  const response = await postJson<unknown>(API_ENDPOINTS.analyze, {
    scenario: request,
    calculatedResult: result,
  });
  if (!isAIAnalysis(response)) {
    throw new Error("Сервер вернул AI-анализ в неизвестном формате.");
  }
  return response;
}
