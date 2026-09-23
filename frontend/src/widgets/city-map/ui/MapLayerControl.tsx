"use client";

import {
  MAP_LAYER_OPTIONS,
  type MapLayer,
} from "../model/mapPresentation";

interface MapLayerControlProps {
  layer: MapLayer;
  onChange: (layer: MapLayer) => void;
}

export function MapLayerControl({
  layer,
  onChange,
}: MapLayerControlProps) {
  return (
    <label className="flex items-center gap-2 rounded-lg bg-white/95 px-2.5 py-2 shadow-sm ring-1 ring-slate-200/90 backdrop-blur">
      <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
        Слой
      </span>
      <select
        value={layer}
        onChange={(event) => onChange(event.target.value as MapLayer)}
        aria-label="Слой карты"
        className="cursor-pointer bg-transparent pr-1 text-xs font-bold text-slate-800 outline-none"
      >
        {MAP_LAYER_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
