export const INITIAL_BUDGET = 100;
export const BASELINE_SCORE = 52.56;
export const MAX_DECISIONS = 5;
export const MAX_CATEGORY_DECISIONS = 2;
export const SIMULATION_QUARTERS = 8;

export const API_MODE =
  process.env.NEXT_PUBLIC_API_MODE === "live" ? "live" : "mock";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const API_ENDPOINTS = {
  simulate: "/api/simulate",
  analyze: "/api/analyze",
} as const;
