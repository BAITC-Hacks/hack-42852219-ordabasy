import {
  CATEGORY_LABELS,
  getCategoryValue,
  getDistrict,
  type DevelopmentCategory,
  type DistrictId,
} from "@/entities/district";
import type { SimulationResult } from "@/entities/simulation";

interface ResultDistrictComparisonProps {
  result: SimulationResult;
  districtId: DistrictId;
  moment: "before" | "after";
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as DevelopmentCategory[];

export function ResultDistrictComparison({
  result,
  districtId,
  moment,
}: ResultDistrictComparisonProps) {
  const district = getDistrict(districtId);
  const districtResult = result.districts.find(
    (item) => item.districtId === districtId,
  );

  if (!districtResult) return null;

  const scoreDelta =
    districtResult.afterScore - districtResult.beforeScore;

  return (
    <aside className="self-start rounded-3xl bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] ring-1 ring-inset ring-slate-200/80">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
        Район · До → После
      </p>
      <div className="mt-1 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-3xl font-black tracking-tight text-slate-950">
            {district.name}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            {district.profile}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950 px-3 py-2 text-right text-white">
          <span className="block text-[10px] uppercase tracking-wider text-slate-400">
            QoL района
          </span>
          <strong className="block whitespace-nowrap text-lg font-black tabular-nums">
            {districtResult.beforeScore.toFixed(2)} →{" "}
            {districtResult.afterScore.toFixed(2)}
          </strong>
          <span
            className={`text-xs font-bold ${
              scoreDelta >= 0 ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {scoreDelta >= 0 ? "+" : ""}
            {scoreDelta.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {CATEGORIES.map((category) => {
          const before = getCategoryValue(
            districtResult.beforeIndicators,
            category,
          );
          const after = getCategoryValue(
            districtResult.afterIndicators,
            category,
          );
          const delta = after - before;
          const visibleValue = moment === "before" ? before : after;

          return (
            <div key={category}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-slate-600">
                  {CATEGORY_LABELS[category]}
                </span>
                <span className="font-black tabular-nums text-slate-950">
                  {before.toFixed(1)} → {after.toFixed(1)}
                  {delta !== 0 && (
                    <em
                      className={`ml-1.5 not-italic ${
                        delta > 0 ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {delta > 0 ? "+" : ""}
                      {delta.toFixed(1)}
                    </em>
                  )}
                </span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-[width,background-color] duration-300 ${
                    delta < 0 ? "bg-red-500" : "bg-teal-600"
                  }`}
                  style={{ width: `${visibleValue}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
        Карта показывает состояние{" "}
        <strong className="text-slate-700">
          {moment === "before" ? "до решений" : "после симуляции"}
        </strong>
        . Выберите другой район для сравнения.
      </p>
    </aside>
  );
}
