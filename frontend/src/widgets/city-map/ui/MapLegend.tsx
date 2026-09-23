import { QOL_SEVERITY_PRESENTATION } from "@/entities/district";

interface MapLegendProps {
  title: string;
}

export function MapLegend({ title }: MapLegendProps) {
  return (
    <div className="rounded-lg bg-white/94 px-3 py-2.5 shadow-sm ring-1 ring-slate-200/90 backdrop-blur">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-semibold text-slate-600">
        {Object.values(QOL_SEVERITY_PRESENTATION).map(({ fill, label }) => (
          <span key={label} className="flex items-center gap-1">
            <i
              className="size-2 rounded-sm ring-1 ring-black/5"
              style={{ backgroundColor: fill, opacity: 0.72 }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
