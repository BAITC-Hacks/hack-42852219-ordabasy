"use client";

import { useMemo, useState } from "react";

import type { Decision } from "@/entities/decision";
import {
  getDistrict,
  type DistrictId,
} from "@/entities/district";
import type { Initiative } from "@/entities/initiative";
import type { AIAnalysis, SimulationResult } from "@/entities/simulation";
import {
  getScenarioMetrics,
  validateScenario,
} from "@/features/manage-scenario";
import {
  analyzeScenario,
  simulateScenario,
} from "@/features/run-simulation";
import { BASELINE_SCORE, MAX_DECISIONS } from "@/shared/config";
import { AIAnalysisPanel } from "@/widgets/ai-analysis";
import { CityHeader } from "@/widgets/city-header";
import { CityMap } from "@/widgets/city-map";
import { DecisionProgress } from "@/widgets/decision-progress";
import { DistrictPanel } from "@/widgets/district-panel";
import { InitiativePanel } from "@/widgets/initiative-panel";
import { SimulationResults } from "@/widgets/simulation-results";
import { SimulationTimeline } from "@/widgets/simulation-timeline";

type SimulationStatus = "planning" | "simulating" | "results";
type MapMoment = "before" | "after";

interface SimulatorServices {
  simulate: typeof simulateScenario;
  analyze: typeof analyzeScenario;
}

interface HomePageProps {
  services?: SimulatorServices;
  timelineDelayMs?: number;
}

const DEFAULT_SERVICES: SimulatorServices = {
  simulate: simulateScenario,
  analyze: analyzeScenario,
};

export function HomePage({
  services = DEFAULT_SERVICES,
  timelineDelayMs = 1200,
}: HomePageProps = {}) {
  const [selectedDistrictId, setSelectedDistrictId] =
    useState<DistrictId>("NURA");
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [initiativePanelOpen, setInitiativePanelOpen] = useState(false);
  const [status, setStatus] = useState<SimulationStatus>("planning");
  const [simulationResult, setSimulationResult] =
    useState<SimulationResult | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisFailed, setAnalysisFailed] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [mapMoment, setMapMoment] = useState<MapMoment>("after");

  const selectedDistrict = getDistrict(selectedDistrictId);
  const metrics = useMemo(() => getScenarioMetrics(decisions), [decisions]);
  const scenarioErrors = useMemo(
    () => validateScenario(decisions),
    [decisions],
  );
  const canSimulate =
    decisions.length === MAX_DECISIONS && scenarioErrors.length === 0;
  const markerDistrictIds = decisions.flatMap(({ districtId }) =>
    districtId ? [districtId] : [],
  );

  function addDecision(initiative: Initiative) {
    setDecisions((current) => [
      ...current,
      {
        measureId: initiative.id,
        districtId:
          initiative.scope === "CITY" ? null : selectedDistrictId,
      },
    ]);
    setInitiativePanelOpen(false);
  }

  function removeDecision(index: number) {
    setDecisions((current) =>
      current.filter((_, decisionIndex) => decisionIndex !== index),
    );
  }

  async function runSimulation() {
    if (!canSimulate) return;
    setSimulationError(null);
    setStatus("simulating");
    setAnalysis(null);
    setAnalysisFailed(false);

    const request = { decisions };
    try {
      const [result] = await Promise.all([
        services.simulate(request),
        new Promise((resolve) => window.setTimeout(resolve, timelineDelayMs)),
      ]);
      setSimulationResult(result);
      setStatus("results");
      setAnalysisLoading(true);
      try {
        const aiAnalysis = await services.analyze(request, result);
        setAnalysis(aiAnalysis);
      } catch {
        setAnalysisFailed(true);
      } finally {
        setAnalysisLoading(false);
      }
    } catch (error) {
      setSimulationError(
        error instanceof Error
          ? error.message
          : "Не удалось запустить симуляцию.",
      );
      setStatus("planning");
    }
  }

  function restart() {
    setDecisions([]);
    setSimulationResult(null);
    setAnalysis(null);
    setAnalysisFailed(false);
    setSimulationError(null);
    setMapMoment("after");
    setSelectedDistrictId("NURA");
    setStatus("planning");
  }

  if (status === "simulating") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#edf3f1] p-6">
        <SimulationTimeline />
      </main>
    );
  }

  if (status === "results" && simulationResult) {
    const resultScores = Object.fromEntries(
      simulationResult.districts.map((district) => [
        district.districtId,
        mapMoment === "before" ? district.beforeScore : district.afterScore,
      ]),
    );

    return (
      <div className="min-h-screen bg-[#f2f6f5]">
        <CityHeader
          score={simulationResult.finalScore}
          budgetRemaining={simulationResult.budgetRemaining}
          decisionCount={decisions.length}
        />
        <main className="mx-auto max-w-[1600px] space-y-5 p-4 md:p-6 lg:p-8">
          <SimulationResults result={simulationResult} />
          <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-950">
                  Как изменился город
                </h2>
                <div className="rounded-full border border-slate-200 bg-white p-1">
                  {(["before", "after"] as const).map((moment) => (
                    <button
                      key={moment}
                      type="button"
                      onClick={() => setMapMoment(moment)}
                      className={`rounded-full px-4 py-1.5 text-xs font-black ${
                        mapMoment === moment
                          ? "bg-slate-950 text-white"
                          : "text-slate-500"
                      }`}
                    >
                      {moment === "before" ? "До" : "После"}
                    </button>
                  ))}
                </div>
              </div>
              <CityMap
                selectedDistrictId={selectedDistrictId}
                onSelectDistrict={setSelectedDistrictId}
                scores={resultScores}
              />
            </div>
            <AIAnalysisPanel
              analysis={analysis}
              loading={analysisLoading}
              failed={analysisFailed}
            />
          </section>
          <div className="flex justify-center py-3">
            <button
              type="button"
              onClick={restart}
              className="rounded-xl bg-teal-700 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Попробовать другой сценарий
            </button>
          </div>
        </main>
      </div>
    );
  }

  const missingDecisions = MAX_DECISIONS - decisions.length;
  return (
    <div className="min-h-screen bg-[#f2f6f5]">
      <CityHeader
        score={BASELINE_SCORE}
        budgetRemaining={metrics.budgetRemaining}
        decisionCount={decisions.length}
      />
      <main className="mx-auto max-w-[1600px] space-y-4 p-4 md:p-6 lg:p-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(330px,0.7fr)]">
          <CityMap
            selectedDistrictId={selectedDistrictId}
            onSelectDistrict={setSelectedDistrictId}
            markerDistrictIds={markerDistrictIds}
          />
          <DistrictPanel
            district={selectedDistrict}
            onOpenInitiatives={() => setInitiativePanelOpen(true)}
          />
        </div>

        <DecisionProgress decisions={decisions} onRemove={removeDecision} />

        <section className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
          <div className="w-full max-w-sm">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Осталось {metrics.budgetRemaining} ед.</span>
              <span>{metrics.budgetUsed} ед. использовано</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-600 transition-[width] duration-300"
                style={{ width: `${metrics.budgetUsed}%` }}
              />
            </div>
          </div>
          <div className="text-center sm:text-right">
            <button
              type="button"
              disabled={!canSimulate}
              onClick={runSimulation}
              className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Запустить симуляцию
            </button>
            {!canSimulate && (
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {missingDecisions > 0
                  ? `Выберите ещё ${missingDecisions} ${decisionWord(missingDecisions)}`
                  : scenarioErrors[0]?.message}
              </p>
            )}
          </div>
        </section>

        {simulationError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {simulationError}
          </div>
        )}
      </main>

      {initiativePanelOpen && (
        <InitiativePanel
          district={selectedDistrict}
          decisions={decisions}
          onSelect={addDecision}
          onClose={() => setInitiativePanelOpen(false)}
        />
      )}
    </div>
  );
}

function decisionWord(count: number) {
  return count === 1 ? "решение" : count < 5 ? "решения" : "решений";
}
