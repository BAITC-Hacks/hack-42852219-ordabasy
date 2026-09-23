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
    <header className="border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-xl bg-teal-700 text-lg font-black text-white shadow-[0_6px_18px_rgba(15,118,110,0.22)]"
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

        <dl className="grid grid-cols-3 gap-2">
          <Metric label="Качество жизни" value={score.toFixed(2)} accent />
          <Metric
            label="Бюджет"
            value={`${budgetRemaining} / 100`}
            suffix="ед."
            warning={budgetRemaining <= 10}
          />
          <Metric
            label="Решения"
            value={`${decisionCount} / 5`}
            progress={(decisionCount / 5) * 100}
          />
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
  warning = false,
  progress,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
  warning?: boolean;
  progress?: number;
}) {
  return (
    <div
      className={`relative min-w-24 overflow-hidden rounded-xl px-3 py-2 sm:min-w-32 ${
        accent
          ? "bg-teal-50 ring-1 ring-inset ring-teal-200"
          : warning
            ? "bg-amber-50 ring-1 ring-inset ring-amber-200"
            : "bg-slate-50 ring-1 ring-inset ring-slate-200/80"
      }`}
    >
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-[11px]">
        {accent && <i className="size-1.5 rounded-full bg-teal-500" />}
        {label}
      </dt>
      <dd
        key={value}
        className="mt-0.5 animate-[metricPulse_220ms_ease-out] text-lg font-black tabular-nums text-slate-950 sm:text-xl"
      >
        {value}{" "}
        {suffix && (
          <span className="text-xs font-semibold text-slate-500">{suffix}</span>
        )}
      </dd>
      {progress !== undefined && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-200/70">
          <div
            className="h-full bg-teal-600 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
