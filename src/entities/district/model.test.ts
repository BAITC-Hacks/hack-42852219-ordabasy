import { describe, expect, it } from "vitest";

import { getQoLSeverity } from "./model";

describe("getQoLSeverity", () => {
  it.each([
    [44, "CRITICAL"],
    [45, "NEEDS_ATTENTION"],
    [59, "NEEDS_ATTENTION"],
    [60, "GOOD"],
    [79, "GOOD"],
    [80, "EXCELLENT"],
  ] as const)("maps %s to %s", (score, expected) => {
    expect(getQoLSeverity(score)).toBe(expected);
  });
});
