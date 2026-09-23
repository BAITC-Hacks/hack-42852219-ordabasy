"use client";

import { useState } from "react";

import {
  CATEGORY_LABELS,
  INDICATOR_LABELS,
  getCategoryValue,
  getDistrictProblems,
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
    <aside className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
            Район
          </p>
          <h2 className="mt-1 text-3xl font-black text-slate-950">
            {district.name}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            {district.profile}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950 px-3 py-2 text-center text-white">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">
            QoL
          </span>
          <strong className="text-xl tabular-nums">
            {district.score.toFixed(2)}
          </strong>
        </div>
      </div>

      <section className="mt-5 rounded-2xl bg-amber-50 p-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">
          Ключевые проблемы
        </h3>
        <ul className="mt-3 space-y-2">
          {problems.length > 0 ? (
            problems.map((problem) => (
              <li
                key={problem.indicator}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex items-center gap-2 text-slate-700">
                  <i
                    className={`size-2 rounded-full ${
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

      <section className="mt-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Показатели
        </h3>
        <div className="mt-3 space-y-3">
          {CATEGORIES.map((category) => {
            const value = getCategoryValue(district.indicators, category);
            return (
              <div key={category}>
                <div className="mb-1 flex justify-between text-xs font-bold text-slate-700">
                  <span>{CATEGORY_LABELS[category]}</span>
                  <span className="tabular-nums">{value.toFixed(1)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-teal-600 transition-[width] duration-300"
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
          className="mt-3 text-xs font-bold text-teal-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          {showDetails ? "Скрыть детали" : "Подробнее: 10 показателей"}
        </button>

        {showDetails && (
          <dl className="mt-3 grid grid-cols-2 gap-2">
            {Object.entries(district.indicators).map(([code, value]) => (
              <div key={code} className="rounded-lg bg-slate-50 p-2">
                <dt className="text-[10px] text-slate-500">
                  {INDICATOR_LABELS[code as keyof typeof INDICATOR_LABELS]}
                </dt>
                <dd className="mt-1 font-black tabular-nums text-slate-900">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <button
        type="button"
        onClick={onOpenInitiatives}
        className="mt-6 w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        Принять решение
      </button>
    </aside>
  );
}
