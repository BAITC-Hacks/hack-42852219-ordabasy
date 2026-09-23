"use client";

import dynamic from "next/dynamic";

import type { CityMapProps } from "../model/map.types";

const LeafletCityMap = dynamic(
  () =>
    import("./LeafletCityMap").then((module) => module.LeafletCityMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[400px] place-items-center rounded-3xl bg-[#e9efed] text-sm font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
        Загружаем карту Астаны...
      </div>
    ),
  },
);

export function CityMap(props: CityMapProps) {
  return <LeafletCityMap {...props} />;
}
