import {
  CATEGORY_LABELS,
  getCategoryValue,
  getDistrict,
  type DevelopmentCategory,
} from "@/entities/district";
import type { SimulationResult } from "@/entities/simulation";

interface SimulationResultsProps {
  result: SimulationResult;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as DevelopmentCategory[];

export function SimulationResults({ result }: SimulationResultsProps) {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl bg-teal-800 p-6 text-white shadow-lg md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-200">
          Astana Quality of Life
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <span className="text-4xl font-black tabular-nums text-teal-200">
            {result.baselineScore.toFixed(2)}
          </span>
          <span className="pb-1 text-3xl text-teal-300">→</span>
          <span className="text-6xl font-black tabular-nums">
            {result.finalScore.toFixed(2)}
          </span>
          <span
            className={`mb-2 rounded-full px-3 py-1 text-sm font-black ${
              result.scoreDelta >= 0
                ? "bg-emerald-300 text-emerald-950"
                : "bg-red-300 text-red-950"
            }`}
          >
            {result.scoreDelta >= 0 ? "+" : ""}
            {result.scoreDelta.toFixed(2)}
          </span>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-teal-100">
          Рассчитано детерминированным движком. AI не участвует в вычислении
          итогового показателя.
        </p>
      </section>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ResultMetric
          label="Бюджет использован"
          value={`${result.budgetUsed} / 100`}
          detail={`Осталось ${result.budgetRemaining} ед.`}
        />
        <ResultMetric
          label="Критические показатели"
          value={`${result.criticalBefore} → ${result.criticalAfter}`}
          detail="Порог строго ниже 40"
        />
        <ResultMetric
          label="Слабейший район"
          value={getDistrict(result.weakestDistrictAfter).name}
          detail="Учитывается в итоговом Score"
        />
        <ResultMetric
          label="Синергии"
          value={String(result.activatedSynergies.length)}
          detail={
            result.activatedSynergies[0]?.title ?? "Не активированы"
          }
        />
      </dl>

      <section className="rounded-3xl bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] ring-1 ring-inset ring-slate-200/80">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
            До → После
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            Изменения по районам
          </h2>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {result.districts.map((districtResult) => {
            const district = getDistrict(districtResult.districtId);
            const changedCategories = CATEGORIES.map((category) => {
              const before = getCategoryValue(
                districtResult.beforeIndicators,
                category,
              );
              const after = getCategoryValue(
                districtResult.afterIndicators,
                category,
              );
              return { category, before, after, delta: after - before };
            }).filter(({ delta }) => delta !== 0);

            return (
              <article
                key={district.id}
                className="rounded-2xl bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-950">{district.name}</h3>
                  <strong className="text-sm tabular-nums text-teal-800">
                    {districtResult.beforeScore.toFixed(2)} →{" "}
                    {districtResult.afterScore.toFixed(2)}
                  </strong>
                </div>
                {changedCategories.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {changedCategories.map(({ category, before, after, delta }) => (
                      <li
                        key={category}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-600">
                          {CATEGORY_LABELS[category]}
                        </span>
                        <span className="font-bold tabular-nums text-slate-950">
                          {before.toFixed(1)} → {after.toFixed(1)}{" "}
                          <em
                            className={`not-italic ${
                              delta > 0 ? "text-emerald-700" : "text-red-700"
                            }`}
                          >
                            ({delta > 0 ? "+" : ""}
                            {delta.toFixed(1)})
                          </em>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    Без прямых изменений в этом сценарии
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ResultMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-inset ring-slate-200/80">
      <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 text-2xl font-black tabular-nums text-slate-950">
        {value}
      </dd>
      <p className="mt-1 text-xs leading-snug text-slate-500" title={detail}>
        {detail}
      </p>
    </div>
  );
}
