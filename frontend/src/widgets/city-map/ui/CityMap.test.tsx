import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CityMap } from "./CityMap";

describe("CityMap", () => {
  it("preserves district selection and selected state", async () => {
    const onSelectDistrict = vi.fn();
    const user = userEvent.setup();
    render(
      <CityMap
        selectedDistrictId="NURA"
        onSelectDistrict={onSelectDistrict}
      />,
    );

    const nura = await screen.findByRole("button", {
      name: /Нура, качество жизни 49.18/,
    });
    expect(nura.getAttribute("aria-pressed")).toBe("true");

    await user.click(
      await screen.findByRole("button", {
        name: /Есиль, качество жизни 62.99/,
      }),
    );
    expect(onSelectDistrict).toHaveBeenCalledWith("ESIL");
  });

  it("shows district data in the GIS tooltip", async () => {
    const user = userEvent.setup();
    render(
      <CityMap selectedDistrictId="NURA" onSelectDistrict={vi.fn()} />,
    );

    await user.hover(
      await screen.findByRole("button", {
        name: /Нура, качество жизни 49.18/,
      }),
    );

    expect(screen.getByText("49.18")).toBeDefined();
    expect(screen.getByText("2 крит.")).toBeDefined();
  });

  it("maps the social layer to Nura's 36.5 presentation value", async () => {
    const user = userEvent.setup();
    render(
      <CityMap selectedDistrictId="NURA" onSelectDistrict={vi.fn()} />,
    );

    await user.selectOptions(
      await screen.findByRole("combobox", { name: "Слой карты" }),
      "SOCIAL",
    );

    expect(
      screen.getByRole("button", {
        name: /Нура, качество жизни 49.18, Соцсфера: 36.5/,
      }),
    ).toBeDefined();
  });
});
