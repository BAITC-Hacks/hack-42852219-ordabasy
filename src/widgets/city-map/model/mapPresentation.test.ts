import { describe, expect, it } from "vitest";

import { getDistrict } from "@/entities/district";

import { getDistrictLayerValue } from "./mapPresentation";

describe("getDistrictLayerValue", () => {
  it("uses the official district score for the QoL layer", () => {
    expect(getDistrictLayerValue(getDistrict("NURA"), "QOL")).toBe(49.18);
  });

  it("shows Nura social presentation value as 36.5", () => {
    expect(getDistrictLayerValue(getDistrict("NURA"), "SOCIAL")).toBe(36.5);
  });

  it("shows Saryarka ecology presentation value as 41", () => {
    expect(getDistrictLayerValue(getDistrict("SARYARKA"), "ECOLOGY")).toBe(41);
  });
});
