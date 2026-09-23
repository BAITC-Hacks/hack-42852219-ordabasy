import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DISTRICTS } from "@/entities/district";
import type { AIAnalysis, SimulationResult } from "@/entities/simulation";

import { HomePage } from "./HomePage";

const resultFixture: SimulationResult = {
  valid: true,
  baselineScore: 52.56,
  finalScore: 56.48,
  scoreDelta: 3.92,
  budgetUsed: 95,
  budgetRemaining: 5,
  criticalBefore: 2,
  criticalAfter: 0,
  weakestDistrictBefore: "NURA",
  weakestDistrictAfter: "NURA",
  districts: DISTRICTS.map((district) => ({
    districtId: district.id,
    beforeScore: district.score,
    afterScore: district.score,
    beforeIndicators: district.indicators,
    afterIndicators: district.indicators,
    indicatorDeltas: [],
  })),
  criticalIndicators: [],
  activatedSynergies: [],
};

const analysisFixture: AIAnalysis = {
  summary: "Расчёт выполнен движком.",
  strengths: ["Сильная сторона"],
  risks: ["Риск"],
  tradeoffs: ["Компромисс"],
  recommendations: ["Рекомендация"],
};

async function selectInitiative(name: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Принять решение" }));
  const heading = screen.getByRole("heading", { name });
  const card = heading.closest("article");
  if (!card) throw new Error(`Initiative card not found: ${name}`);
  await user.click(within(card).getByRole("button", { name: "Выбрать" }));
}

async function createOfficialScenario() {
  await selectInitiative("Школа + детсад (модульное строительство)");
  await selectInitiative("Центр семейного здоровья / поликлиника");
  await selectInitiative("Освещение и камеры (расширение Safe City)");
  await selectInitiative("Единая цифровая платформа обращений");
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", {
      name: /Сарыарка, качество жизни 54.65/,
    }),
  );
  await selectInitiative("Перевод частного сектора на чистое топливо");
}

describe("HomePage simulator", () => {
  it("selects a district and restores budget when a decision is removed", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.click(
      screen.getByRole("button", { name: /Есиль, качество жизни 62.99/ }),
    );
    expect(
      screen.getByRole("heading", { name: "Есиль", level: 2 }),
    ).toBeDefined();

    await selectInitiative("Выделенные полосы для автобусов");
    expect(screen.getByText("82 / 100")).toBeDefined();
    expect(
      screen.getByRole("button", {
        name: "Удалить решение Выделенные полосы для автобусов",
      }),
    ).toBeDefined();

    await user.click(
      screen.getByRole("button", {
        name: "Удалить решение Выделенные полосы для автобусов",
      }),
    );
    expect(screen.getByText("100 / 100")).toBeDefined();
  });

  it("enables simulation only with five valid decisions and shows results", async () => {
    const simulate = vi.fn().mockResolvedValue(resultFixture);
    const analyze = vi.fn().mockResolvedValue(analysisFixture);
    render(
      <HomePage
        services={{ simulate, analyze }}
        timelineDelayMs={0}
      />,
    );

    const runButton = screen.getByRole("button", {
      name: "Запустить симуляцию",
    });
    expect(runButton.hasAttribute("disabled")).toBe(true);

    await createOfficialScenario();
    expect(runButton.hasAttribute("disabled")).toBe(false);
    expect(screen.getByText("5 / 100")).toBeDefined();

    await userEvent.setup().click(runButton);
    expect((await screen.findAllByText("56.48")).length).toBeGreaterThan(0);
    expect(simulate).toHaveBeenCalledOnce();
    expect(await screen.findByText("Расчёт выполнен движком.")).toBeDefined();
  });

  it("keeps calculated results visible when AI analysis fails", async () => {
    const simulate = vi.fn().mockResolvedValue(resultFixture);
    const analyze = vi.fn().mockRejectedValue(new Error("AI offline"));
    render(
      <HomePage
        services={{ simulate, analyze }}
        timelineDelayMs={0}
      />,
    );

    await createOfficialScenario();
    await userEvent.setup().click(
      screen.getByRole("button", { name: "Запустить симуляцию" }),
    );

    expect((await screen.findAllByText("56.48")).length).toBeGreaterThan(0);
    expect(
      await screen.findByText(
        "AI-анализ временно недоступен. Результаты симуляции сохранены.",
      ),
    ).toBeDefined();
  });
});
