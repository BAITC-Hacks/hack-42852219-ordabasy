import type { Decision } from "@/entities/decision";
import { getDistrict } from "@/entities/district";
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
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
            Ваш план
          </p>
          <h2 className="text-lg font-black text-slate-950">Пять решений</h2>
        </div>
        <span className="text-xs font-bold text-slate-500">
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
                className="min-h-24 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3"
              >
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Решение {index + 1}
                </span>
                <p className="mt-3 text-xs text-slate-400">Не выбрано</p>
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
              className="relative min-h-24 rounded-2xl border border-teal-200 bg-teal-50 p-3 pr-8"
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-700">
                {index + 1} ✓ · {initiative.cost} ед.
              </span>
              <p className="mt-2 text-xs font-black leading-snug text-slate-950">
                {initiative.shortName}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">{scope}</p>
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
