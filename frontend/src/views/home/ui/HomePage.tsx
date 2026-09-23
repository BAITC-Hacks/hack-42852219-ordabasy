"use client";

import { useMemo, useState } from "react";

import type { Decision } from "@/entities/decision";
import {
  getCriticalIndicatorCount,
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
import {
  DistrictPanel,
  type DistrictPanelScope,
} from "@/widgets/district-panel";
import { InitiativePanel } from "@/widgets/initiative-panel";
import {
  ResultDistrictComparison,
  SimulationResults,
} from "@/widgets/simulation-results";
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
  const [focusedDistrictId, setFocusedDistrictId] =
    useState<DistrictId>("NURA");
  const [scope, setScope] = useState<DistrictPanelScope>("district");
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

  const focusedDistrict = getDistrict(focusedDistrictId);
  const selectedDistrict = scope === "city" ? null : focusedDistrict;
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
          initiative.scope === "CITY" ? null : focusedDistrictId,
      },
    ]);
    setInitiativePanelOpen(false);
  }

  function selectDistrict(districtId: DistrictId) {
    setFocusedDistrictId(districtId);
    setScope("district");
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
    setFocusedDistrictId("NURA");
    setScope("district");
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
    const resultCriticalCounts = Object.fromEntries(
      simulationResult.districts.map((district) => [
        district.districtId,
        getCriticalIndicatorCount(
          mapMoment === "before"
            ? district.beforeIndicators
            : district.afterIndicators,
        ),
      ]),
    );
    const resultIndicators = Object.fromEntries(
      simulationResult.districts.map((district) => [
        district.districtId,
        mapMoment === "before"
          ? district.beforeIndicators
          : district.afterIndicators,
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
                selectedDistrictId={focusedDistrictId}
                onSelectDistrict={setFocusedDistrictId}
                scores={resultScores}
                indicators={resultIndicators}
                criticalCounts={resultCriticalCounts}
                cityCriticalCount={
                  mapMoment === "before"
                    ? simulationResult.criticalBefore
                    : simulationResult.criticalAfter
                }
              />
            </div>
            <ResultDistrictComparison
              result={simulationResult}
              districtId={focusedDistrictId}
              moment={mapMoment}
            />
          </section>
          <AIAnalysisPanel
            analysis={analysis}
            loading={analysisLoading}
            failed={analysisFailed}
          />
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
      <main className="mx-auto max-w-[1600px] space-y-3 p-4 md:px-6 md:py-4">
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.65fr)_minmax(350px,0.7fr)]">
          <CityMap
            selectedDistrictId={focusedDistrictId}
            onSelectDistrict={selectDistrict}
            markerDistrictIds={markerDistrictIds}
            highlightAll={scope === "city"}
          />
          <DistrictPanel
            district={selectedDistrict}
            scope={scope}
            onScopeChange={setScope}
            onOpenInitiatives={() => setInitiativePanelOpen(true)}
          />
        </div>

        <DecisionProgress decisions={decisions} onRemove={removeDecision} />

        <section className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-inset ring-slate-200/80 sm:flex-row">
          <div className="w-full max-w-lg">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Бюджет сценария
                </p>
                <p
                  className={`mt-0.5 text-lg font-black tabular-nums ${
                    metrics.budgetRemaining <= 10
                      ? "text-amber-700"
                      : "text-slate-950"
                  }`}
                >
                  Осталось {metrics.budgetRemaining} ед.
                </p>
              </div>
              <span className="pb-0.5 text-xs font-medium text-slate-500">
                Использовано {metrics.budgetUsed} ед.
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/60">
              <div
                className={`h-full rounded-full transition-[width,background-color] duration-300 ${
                  metrics.budgetRemaining <= 10
                    ? "bg-amber-500"
                    : "bg-teal-600"
                }`}
                style={{ width: `${metrics.budgetUsed}%` }}
              />
            </div>
            {metrics.budgetRemaining <= 10 && (
              <p className="mt-1.5 text-xs font-semibold text-amber-700">
                Осталось только {metrics.budgetRemaining} ед.
              </p>
            )}
          </div>
          <div className="min-w-64 text-center sm:text-right">
            <button
              type="button"
              disabled={!canSimulate}
              onClick={runSimulation}
              aria-label="Запустить симуляцию"
              className="w-full rounded-xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-[0_8px_20px_rgba(15,23,42,0.2)] transition duration-200 hover:-translate-y-0.5 hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
            >
              Запустить симуляцию <span aria-hidden="true">→</span>
            </button>
            {!canSimulate && (
              <p className="mt-1.5 text-xs font-medium text-slate-500">
                {missingDecisions > 0
                  ? `Нужно принять ещё ${missingDecisions} ${decisionWord(missingDecisions)}`
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
