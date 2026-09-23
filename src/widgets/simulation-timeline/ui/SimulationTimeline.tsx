import { SIMULATION_QUARTERS } from "@/shared/config";

export function SimulationTimeline() {
  return (
    <section className="mx-auto w-full max-w-4xl rounded-3xl border border-teal-200 bg-white p-8 text-center shadow-xl">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-teal-50">
        <div className="size-7 animate-spin rounded-full border-4 border-teal-200 border-t-teal-700" />
      </div>
      <h2 className="mt-5 text-2xl font-black text-slate-950">
        Симулируем последствия решений...
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Два условных года — восемь кварталов
      </p>
      <ol className="mt-8 flex items-center">
        {Array.from({ length: SIMULATION_QUARTERS }, (_, index) => (
          <li key={index} className="flex flex-1 items-center last:flex-none">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-teal-700 text-xs font-black text-white">
              Q{index + 1}
            </div>
            {index < SIMULATION_QUARTERS - 1 && (
              <div
                className="h-1 flex-1 origin-left animate-[timeline_1.2s_ease-out_forwards] bg-teal-200"
                style={{ animationDelay: `${index * 90}ms` }}
              />
            )}
          </li>
        ))}
      </ol>
      <p className="mt-7 text-xs text-slate-500">
        Числовые результаты рассчитывает детерминированный движок
      </p>
    </section>
  );
}
