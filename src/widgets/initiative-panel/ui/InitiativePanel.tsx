"use client";

import { useState } from "react";

import type { Decision } from "@/entities/decision";
import {
  CATEGORY_LABELS,
  INDICATOR_LABELS,
  type DevelopmentCategory,
  type District,
} from "@/entities/district";
import { INITIATIVES, type Initiative } from "@/entities/initiative";
import { getInitiativeDisabledReason } from "@/features/manage-scenario";

interface InitiativePanelProps {
  district: District;
  decisions: Decision[];
  onSelect: (initiative: Initiative) => void;
  onClose: () => void;
}

type Filter = "ALL" | DevelopmentCategory;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "ALL", label: "Все" },
  ...(
    Object.entries(CATEGORY_LABELS) as [DevelopmentCategory, string][]
  ).map(([id, label]) => ({ id, label })),
];

export function InitiativePanel({
  district,
  decisions,
  onSelect,
  onClose,
}: InitiativePanelProps) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const visibleInitiatives = INITIATIVES.filter(
    ({ category }) => filter === "ALL" || filter === category,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="initiative-title"
        className="h-full w-full max-w-2xl overflow-y-auto bg-[#f7faf9] shadow-2xl"
      >
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
                Решение для района {district.name}
              </p>
              <h2
                id="initiative-title"
                className="mt-1 text-2xl font-black text-slate-950"
              >
                Выберите инициативу
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть выбор инициатив"
              className="grid size-10 place-items-center rounded-full border border-slate-200 text-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-teal-700"
            >
              ×
            </button>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  filter === id
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-teal-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {visibleInitiatives.map((initiative) => {
            const disabledReason = getInitiativeDisabledReason(
              initiative,
              district.id,
              decisions,
            );
            return (
              <article
                key={initiative.id}
                className={`flex min-h-64 flex-col rounded-2xl border bg-white p-4 ${
                  disabledReason
                    ? "border-slate-200 opacity-65"
                    : "border-slate-200 shadow-sm hover:border-teal-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-teal-800">
                    {CATEGORY_LABELS[initiative.category]}
                  </span>
                  <strong className="text-sm tabular-nums text-slate-950">
                    {initiative.cost} ед.
                  </strong>
                </div>
                <h3 className="mt-3 text-base font-black leading-snug text-slate-950">
                  {initiative.name}
                </h3>
                <div className="mt-2 flex gap-2 text-[11px] font-semibold text-slate-500">
                  <span>
                    {initiative.scope === "CITY"
                      ? "Весь город"
                      : district.name}
                  </span>
                  <span>•</span>
                  <span>Эффект через {initiative.lag} кв.</span>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {initiative.effects.map((effect) => (
                    <li
                      key={effect.indicator}
                      className={`text-xs font-bold ${
                        effect.value < 0 ? "text-red-700" : "text-emerald-700"
                      }`}
                    >
                      {effect.value > 0 ? "+" : ""}
                      {effect.value} {INDICATOR_LABELS[effect.indicator]}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-4">
                  {disabledReason && (
                    <p className="mb-2 text-xs font-semibold leading-snug text-red-700">
                      {disabledReason}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={Boolean(disabledReason)}
                    onClick={() => onSelect(initiative)}
                    className="w-full rounded-xl bg-teal-700 px-3 py-2.5 text-xs font-black text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Выбрать
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
