import type { Decision } from "@/entities/decision";
import { CATEGORY_LABELS, getDistrict } from "@/entities/district";
import { getInitiative } from "@/entities/initiative";
import { MAX_DECISIONS } from "@/shared/config";

interface DecisionProgressProps {
  decisions: Decision[];
  onRemove: (index: number) => void;
}

export function DecisionProgress({
  decisions,
  onRemove,
}: DecisionProgressProps) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-700">
            Ваш план
          </p>
          <h2 className="text-base font-black text-slate-950">Пять решений</h2>
        </div>
        <span className="hidden text-xs font-medium text-slate-500 sm:block">
          Порядок не влияет на результат
        </span>
      </div>
      <ol className="grid gap-2 md:grid-cols-5">
        {Array.from({ length: MAX_DECISIONS }, (_, index) => {
          const selectedDecision = decisions[index];
          if (!selectedDecision) {
            return (
              <li
                key={index}
                className="group min-h-24 rounded-2xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-200 transition duration-200 hover:bg-teal-50/60 hover:ring-teal-200"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Решение {index + 1}
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-white text-base font-medium text-teal-700 shadow-sm ring-1 ring-slate-200 transition group-hover:ring-teal-200">
                    +
                  </span>
                  <p className="text-[11px] font-medium leading-snug text-slate-500">
                    Выберите район
                    <br />и инициативу
                  </p>
                </div>
              </li>
            );
          }

          const initiative = getInitiative(selectedDecision.measureId);
          const scope =
            selectedDecision.districtId === null
              ? "Весь город"
              : getDistrict(selectedDecision.districtId).name;
          return (
            <li
              key={`${selectedDecision.measureId}-${index}`}
              className="relative min-h-24 animate-[decisionIn_240ms_ease-out] rounded-2xl bg-teal-50 p-3 pr-8 shadow-[inset_0_0_0_1px_rgba(13,148,136,0.22)]"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                  Решение {index + 1}
                </span>
                <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-teal-800">
                  {CATEGORY_LABELS[initiative.category]}
                </span>
              </div>
              <p className="mt-1.5 text-xs font-black leading-snug text-slate-950">
                {initiative.shortName}
              </p>
              <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-500">{scope}</span>
                <strong className="tabular-nums text-slate-700">
                  {initiative.cost} ед.
                </strong>
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Удалить решение ${initiative.name}`}
                className="absolute right-2 top-2 grid size-6 place-items-center rounded-full text-slate-500 hover:bg-white hover:text-red-700 focus-visible:outline-2 focus-visible:outline-red-600"
              >
                ×
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
