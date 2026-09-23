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
    <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">
            AI-интерпретация
          </p>
          <h2 className="mt-1 text-2xl font-black">Анализ сценария</h2>
        </div>
        <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
          Не рассчитывает Score
        </span>
      </div>

      {loading && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/5 p-4 text-sm text-slate-300">
          <i className="size-4 animate-spin rounded-full border-2 border-slate-600 border-t-teal-300" />
          AI анализирует компромиссы сценария...
        </div>
      )}

      {failed && (
        <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          AI-анализ временно недоступен. Результаты симуляции сохранены.
        </div>
      )}

      {analysis && (
        <div className="mt-6">
          <p className="max-w-3xl text-sm leading-7 text-slate-200">
            {analysis.summary}
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <AnalysisList
              title="Сильные стороны"
              marker="✓"
              items={analysis.strengths}
              tone="text-emerald-300"
            />
            <AnalysisList
              title="Риски"
              marker="!"
              items={analysis.risks}
              tone="text-amber-300"
            />
            <AnalysisList
              title="Компромиссы"
              marker="↔"
              items={analysis.tradeoffs}
              tone="text-sky-300"
            />
            <AnalysisList
              title="Рекомендации"
              marker="→"
              items={analysis.recommendations}
              tone="text-teal-300"
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
    <section className="rounded-2xl bg-white/5 p-4">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-200">
            <span className={`font-black ${tone}`}>{marker}</span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
