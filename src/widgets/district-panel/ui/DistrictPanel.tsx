"use client";

import { useState } from "react";

import {
  CATEGORY_INDICATORS,
  CATEGORY_LABELS,
  INDICATOR_LABELS,
  QOL_SEVERITY_PRESENTATION,
  getCategoryValue,
  getDistrictProblems,
  getQoLSeverity,
  type DevelopmentCategory,
  type District,
} from "@/entities/district";

interface DistrictPanelProps {
  district: District;
  onOpenInitiatives: () => void;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as DevelopmentCategory[];

export function DistrictPanel({
  district,
  onOpenInitiatives,
}: DistrictPanelProps) {
  const [showDetails, setShowDetails] = useState(false);
  const problems = getDistrictProblems(district);

  return (
    <aside className="self-start rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-700">
            Район
          </p>
          <h2 className="mt-0.5 text-4xl font-black tracking-tight text-slate-950">
            {district.name}
          </h2>
          <p className="mt-2 max-w-sm text-sm font-medium leading-relaxed text-slate-600">
            {district.profile}
          </p>
        </div>
        <div className="min-w-24 rounded-2xl bg-slate-950 px-3 py-2.5 text-center text-white shadow-sm">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
            QoL
          </span>
          <strong className="mt-0.5 block text-2xl font-black tabular-nums">
            {district.score.toFixed(2)}
          </strong>
        </div>
      </div>

      <section className="mt-4 rounded-2xl bg-amber-50/80 p-3.5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-900">
          Ключевые проблемы
        </h3>
        <ul className="mt-2 space-y-1.5">
          {problems.length > 0 ? (
            problems.map((problem) => (
              <li
                key={problem.indicator}
                className="flex items-center justify-between gap-3 rounded-lg bg-white/55 px-2.5 py-1.5 text-[13px]"
              >
                <span className="flex items-center gap-2 text-slate-700">
                  <i
                    className={`size-2.5 shrink-0 rounded-full ring-2 ring-white ${
                      problem.value < 40 ? "bg-red-500" : "bg-amber-500"
                    }`}
                  />
                  {problem.label}
                </span>
                <strong className="tabular-nums text-slate-950">
                  {problem.value}
                </strong>
              </li>
            ))
          ) : (
            <li className="text-sm text-slate-600">
              Нет показателей в зоне повышенного внимания
            </li>
          )}
        </ul>
      </section>

      <section className="mt-4">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Показатели
        </h3>
        <div className="mt-2.5 space-y-2.5">
          {CATEGORIES.map((category) => {
            const value = getCategoryValue(district.indicators, category);
            const severity = getQoLSeverity(value);
            return (
              <div key={category}>
                <div className="mb-1 flex justify-between text-[13px] text-slate-700">
                  <span className="font-medium">{CATEGORY_LABELS[category]}</span>
                  <span className={`font-black tabular-nums ${QOL_SEVERITY_PRESENTATION[severity].textClass}`}>
                    {value.toFixed(1)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ${QOL_SEVERITY_PRESENTATION[severity].barClass}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowDetails((value) => !value)}
          aria-expanded={showDetails}
          className="mt-3 flex items-center gap-1.5 text-xs font-bold text-teal-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          {showDetails ? "Скрыть показатели" : "Подробнее: 10 показателей"}
          <span
            aria-hidden="true"
            className={`transition-transform duration-200 ${showDetails ? "rotate-180" : ""}`}
          >
            ↓
          </span>
        </button>

        {showDetails && (
          <div className="mt-3 max-h-72 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-3">
            {CATEGORIES.map((category) => (
              <section key={category}>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {CATEGORY_LABELS[category]}
                </h4>
                <dl className="mt-1 divide-y divide-slate-200/70">
                  {CATEGORY_INDICATORS[category].map((code) => {
                    const value = district.indicators[code];
                    return (
                      <div
                        key={code}
                        className="flex items-center justify-between gap-3 py-1.5"
                      >
                        <dt className="text-xs leading-snug text-slate-600">
                          {INDICATOR_LABELS[code]}
                        </dt>
                        <dd
                          className={`shrink-0 text-sm font-black tabular-nums ${
                            value < 40 ? "text-red-700" : "text-slate-900"
                          }`}
                        >
                          {value < 40 && (
                            <span className="mr-1 text-[10px]" aria-label="Критический показатель">
                              !
                            </span>
                          )}
                          {value}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={onOpenInitiatives}
        aria-label="Принять решение"
        className="mt-4 w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-[0_8px_18px_rgba(15,118,110,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        Принять решение <span aria-hidden="true">→</span>
      </button>
    </aside>
  );
}
