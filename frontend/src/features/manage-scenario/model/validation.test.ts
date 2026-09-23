import { describe, expect, it } from "vitest";

import type { Decision } from "@/entities/decision";

import { getScenarioMetrics, validateScenario } from "./validation";

const decision = (
  measureId: Decision["measureId"],
  districtId: Decision["districtId"],
): Decision => ({ measureId, districtId });

describe("scenario presentation metrics", () => {
  it("subtracts selected costs from the 100-unit budget", () => {
    expect(
      getScenarioMetrics([decision("M1", "ESIL")]).budgetRemaining,
    ).toBe(82);
  });
});

describe("frontend scenario validation", () => {
  it("rejects duplicate initiatives", () => {
    const errors = validateScenario(
      [decision("M1", "ESIL"), decision("M1", "NURA")],
      false,
    );
    expect(errors.some(({ code }) => code === "DUPLICATE_INITIATIVE")).toBe(true);
  });

  it("rejects three initiatives from one category", () => {
    const errors = validateScenario(
      [
        decision("M7", "NURA"),
        decision("M8", "NURA"),
        decision("M9", "ESIL"),
      ],
      false,
    );
    expect(errors.some(({ code }) => code === "CATEGORY_LIMIT")).toBe(true);
  });

  it("requires a district only for district initiatives", () => {
    expect(
      validateScenario([decision("M7", null)], false).some(
        ({ code }) => code === "DISTRICT_REQUIRED",
      ),
    ).toBe(true);
    expect(validateScenario([decision("M12", null)], false)).toEqual([]);
  });

  it("rejects M1 and M3 globally", () => {
    const errors = validateScenario(
      [decision("M1", "ESIL"), decision("M3", "NURA")],
      false,
    );
    expect(
      errors.some(({ code }) => code === "INCOMPATIBLE_INITIATIVES"),
    ).toBe(true);
  });

  it("applies M4/M7 incompatibility only in the same district", () => {
    expect(
      validateScenario(
        [decision("M4", "NURA"), decision("M7", "NURA")],
        false,
      ).some(({ code }) => code === "DISTRICT_INCOMPATIBILITY"),
    ).toBe(true);
    expect(
      validateScenario(
        [decision("M4", "NURA"), decision("M7", "ESIL")],
        false,
      ),
    ).toEqual([]);
  });

  it("applies M5/M13 incompatibility only in the same district", () => {
    expect(
      validateScenario(
        [decision("M5", "SARYARKA"), decision("M13", "SARYARKA")],
        false,
      ).some(({ code }) => code === "DISTRICT_INCOMPATIBILITY"),
    ).toBe(true);
    expect(
      validateScenario(
        [decision("M5", "SARYARKA"), decision("M13", "ALMATY")],
        false,
      ),
    ).toEqual([]);
  });
});
