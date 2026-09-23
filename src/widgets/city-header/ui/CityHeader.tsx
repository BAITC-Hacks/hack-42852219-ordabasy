interface CityHeaderProps {
  score: number;
  budgetRemaining: number;
  decisionCount: number;
}

export function CityHeader({
  score,
  budgetRemaining,
  decisionCount,
}: CityHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur md:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-xl bg-teal-700 text-lg font-black text-white shadow-sm"
          >
            A
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
              AI-симулятор Астаны
            </p>
            <h1 className="text-xl font-black tracking-tight text-slate-950 md:text-2xl">
              Аким на 5 часов
            </h1>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-2 sm:gap-3">
          <Metric label="Качество жизни" value={score.toFixed(2)} accent />
          <Metric
            label="Бюджет"
            value={`${budgetRemaining} / 100`}
            suffix="ед."
          />
          <Metric label="Решения" value={`${decisionCount} / 5`} />
        </dl>
      </div>
    </header>
  );
}

function Metric({
  label,
  value,
  suffix,
  accent = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`min-w-24 rounded-xl border px-3 py-2 sm:min-w-32 ${
        accent
          ? "border-teal-200 bg-teal-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
        {label}
      </dt>
      <dd className="mt-0.5 text-lg font-black tabular-nums text-slate-950 sm:text-xl">
        {value}{" "}
        {suffix && (
          <span className="text-xs font-semibold text-slate-500">{suffix}</span>
        )}
      </dd>
    </div>
  );
}
