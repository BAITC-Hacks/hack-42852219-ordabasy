import type {
  AIAnalysis,
  InvalidSimulationResult,
  SimulationRequest,
  SimulationResult,
} from "@/entities/simulation";
import { ApiError } from "@/shared/api";
import { API_BASE_URL, API_ENDPOINTS, API_MODE } from "@/shared/config";

import {
  mapWireAnalysis,
  mapWireSimulationResult,
  mapWireValidationError,
  newScenarioVersion,
  toWireScenarioRequest,
  type WireAnalysisResponse,
  type WireErrorBody,
  type WireSimulationResult,
} from "./backendMapping";
import { getMockAnalysis, getMockSimulation } from "./mock";

async function postScenario(
  path: string,
  scenarioVersion: string,
  decisions: SimulationRequest["decisions"],
  timeoutMessage: string,
): Promise<{ status: number; body: unknown }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toWireScenarioRequest(decisions, scenarioVersion)),
      signal: controller.signal,
    });
    const body: unknown = await response.json().catch(() => null);
    return { status: response.status, body };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(timeoutMessage);
    }
    throw new ApiError(
      "Не удалось связаться с сервером. Проверьте соединение.",
    );
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function simulateScenario(
  request: SimulationRequest,
): Promise<SimulationResult> {
  if (API_MODE === "mock") return getMockSimulation();

  const scenarioVersion = newScenarioVersion();
  const { status, body } = await postScenario(
    API_ENDPOINTS.simulate,
    scenarioVersion,
    request.decisions,
    "Сервер не ответил вовремя. Попробуйте ещё раз.",
  );

  if (status === 422) {
    const invalid: InvalidSimulationResult = mapWireValidationError(
      (body ?? {}) as WireErrorBody,
    );
    throw new Error(
      invalid.errors.map(({ message }) => message).join(" ") ||
        "Сервер отклонил сценарий.",
    );
  }
  if (status < 200 || status >= 300 || !body) {
    throw new ApiError(
      "Не удалось запустить симуляцию. Проверьте соединение с сервером.",
      status,
    );
  }
  return mapWireSimulationResult(body as WireSimulationResult);
}

export async function analyzeScenario(
  request: SimulationRequest,
  _result: SimulationResult,
): Promise<AIAnalysis> {
  if (API_MODE === "mock") return getMockAnalysis();

  const scenarioVersion = newScenarioVersion();
  const { status, body } = await postScenario(
    API_ENDPOINTS.analyze,
    scenarioVersion,
    request.decisions,
    "AI не ответил вовремя. Числовой результат сохранён.",
  );

  if (status < 200 || status >= 300 || !body) {
    throw new ApiError(
      status === 404
        ? "AI-анализ пока не подключён."
        : "AI-анализ недоступен. Результаты симуляции сохранены.",
      status,
    );
  }
  return mapWireAnalysis(body as WireAnalysisResponse);
}
