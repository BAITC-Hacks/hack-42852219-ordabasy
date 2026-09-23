import type { AIAnalysis } from "@/entities/simulation";

interface AIAnalysisPanelProps {
  analysis: AIAnalysis | null;
  loading: boolean;
  failed: boolean;
}

export function AIAnalysisPanel({
  analysis,
  loading,
  failed,
}: AIAnalysisPanelProps) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)] ring-1 ring-inset ring-slate-200/80">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-xl bg-violet-50 text-lg text-violet-700"
          >
            ✦
          </span>
          <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">
            AI-интерпретация
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            Анализ сценария
          </h2>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Не рассчитывает Score
        </span>
      </div>

      {loading && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-violet-50 p-4 text-sm text-violet-800">
          <i className="size-4 animate-spin rounded-full border-2 border-violet-200 border-t-violet-700" />
          AI анализирует компромиссы сценария...
        </div>
      )}

      {failed && (
        <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
          AI-анализ временно недоступен. Результаты симуляции сохранены.
        </div>
      )}

      {analysis && (
        <div className="mt-6">
          <p className="max-w-4xl text-sm leading-7 text-slate-600">
            {analysis.summary}
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <AnalysisList
              title="Сильные стороны"
              marker="✓"
              items={analysis.strengths}
              tone="text-emerald-700"
            />
            <AnalysisList
              title="Риски"
              marker="!"
              items={analysis.risks}
              tone="text-amber-700"
            />
            <AnalysisList
              title="Компромиссы"
              marker="↔"
              items={analysis.tradeoffs}
              tone="text-sky-700"
            />
            <AnalysisList
              title="Рекомендации"
              marker="→"
              items={analysis.recommendations}
              tone="text-teal-700"
            />
          </div>
        </div>
      )}
    </section>
  );
}

function AnalysisList({
  title,
  marker,
  items,
  tone,
}: {
  title: string;
  marker: string;
  items: string[];
  tone: string;
}) {
  return (
    <section className="rounded-2xl bg-slate-50 p-4">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-600">
            <span className={`font-black ${tone}`}>{marker}</span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
