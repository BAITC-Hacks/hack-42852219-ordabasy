"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  divIcon,
  type PathOptions,
  type Polygon as LeafletPolygon,
} from "leaflet";
import {
  MapContainer,
  Marker,
  Polygon,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

import {
  DISTRICTS,
  getCriticalIndicatorCount,
  getDistrict,
} from "@/entities/district";

import {
  ASTANA_MAP_BOUNDS,
  DISTRICT_GEOGRAPHY,
  type DistrictGeography,
} from "../model/geography";
import type { CityMapProps } from "../model/map.types";
import {
  MAP_LAYER_OPTIONS,
  getDistrictLayerValue,
  getDistrictMapStyle,
  type MapLayer,
} from "../model/mapPresentation";
import { MapLayerControl } from "./MapLayerControl";
import { MapLegend } from "./MapLegend";

export function LeafletCityMap({
  selectedDistrictId,
  onSelectDistrict,
  scores,
  indicators,
  markerDistrictIds = [],
  criticalCounts,
  cityCriticalCount,
  highlightAll = false,
}: CityMapProps) {
  const [hoveredDistrictId, setHoveredDistrictId] = useState<string | null>(
    null,
  );
  const [layer, setLayer] = useState<MapLayer>("QOL");
  const activeLayer = MAP_LAYER_OPTIONS.find(({ id }) => id === layer);
  const weakestDistrict = DISTRICTS.reduce((weakest, district) =>
    (scores?.[district.id] ?? district.score) <
    (scores?.[weakest.id] ?? weakest.score)
      ? district
      : weakest,
  );
  const derivedCriticalCount = DISTRICTS.reduce((total, district) => {
    const districtIndicators =
      indicators?.[district.id] ?? district.indicators;
    return total + getCriticalIndicatorCount(districtIndicators);
  }, 0);

  return (
    <section
      aria-label="Карта районов Астаны"
      className="relative min-h-[400px] self-stretch overflow-hidden rounded-3xl bg-[#e9efed] shadow-[0_12px_32px_rgba(15,23,42,0.07)] ring-1 ring-inset ring-slate-200/90"
    >
      <MapContainer
        bounds={ASTANA_MAP_BOUNDS}
        boundsOptions={{ padding: [24, 24] }}
        minZoom={9}
        maxZoom={16}
        scrollWheelZoom
        zoomControl
        className="absolute inset-0 z-0 h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {DISTRICT_GEOGRAPHY.map((geography) => (
          <InteractiveDistrict
            key={geography.id}
            geography={geography}
            selected={highlightAll || selectedDistrictId === geography.id}
            hovered={hoveredDistrictId === geography.id}
            layer={layer}
            score={scores?.[geography.id]}
            districtIndicators={indicators?.[geography.id]}
            criticalCount={criticalCounts?.[geography.id]}
            markerCount={
              markerDistrictIds.filter(
                (districtId) => districtId === geography.id,
              ).length
            }
            onSelect={() => onSelectDistrict(geography.id)}
            onHover={(hovered) =>
              setHoveredDistrictId(hovered ? geography.id : null)
            }
          />
        ))}
        <MapViewportControl />
      </MapContainer>

      <div className="absolute left-16 top-4 z-[500]">
        <MapLayerControl layer={layer} onChange={setLayer} />
      </div>
      <div className="absolute right-4 top-4 z-[500] max-w-60 rounded-lg bg-white/94 px-3 py-2 text-right shadow-sm ring-1 ring-slate-200/90 backdrop-blur">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Астана · OpenStreetMap
        </p>
        <p className="mt-0.5 text-[11px] text-slate-600">
          <strong className="font-black text-slate-900">5 районов</strong>
          <span className="mx-1.5 text-slate-300">•</span>
          <strong className="font-black text-slate-900">
            {cityCriticalCount ?? derivedCriticalCount}
          </strong>{" "}
          крит.
          <span className="mx-1.5 text-slate-300">•</span>
          слабейший:{" "}
          <strong className="font-black text-slate-900">
            {weakestDistrict.name}
          </strong>
        </p>
      </div>
      <div className="absolute bottom-7 left-4 z-[500]">
        <MapLegend title={activeLayer?.label ?? "Quality of Life"} />
      </div>
      <p className="absolute bottom-7 right-4 z-[500] rounded-md bg-white/88 px-2 py-1 text-[9px] font-semibold text-slate-500 shadow-sm backdrop-blur">
        Упрощённые границы · не кадастровая карта
      </p>
    </section>
  );
}

interface InteractiveDistrictProps {
  geography: DistrictGeography;
  selected: boolean;
  hovered: boolean;
  layer: MapLayer;
  score?: number;
  districtIndicators?: ReturnType<typeof getDistrict>["indicators"];
  criticalCount?: number;
  markerCount: number;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
}

function InteractiveDistrict({
  geography,
  selected,
  hovered,
  layer,
  score,
  districtIndicators,
  criticalCount,
  markerCount,
  onSelect,
  onHover,
}: InteractiveDistrictProps) {
  const polygonRef = useRef<LeafletPolygon | null>(null);
  const district = getDistrict(geography.id);
  const visibleScore = score ?? district.score;
  const visibleIndicators = districtIndicators ?? district.indicators;
  const value = getDistrictLayerValue(
    district,
    layer,
    visibleScore,
    visibleIndicators,
  );
  const resolvedCriticalCount =
    criticalCount ?? getCriticalIndicatorCount(visibleIndicators);
  const presentation = getDistrictMapStyle(value, selected);
  const layerLabel =
    MAP_LAYER_OPTIONS.find(({ id }) => id === layer)?.shortLabel ?? "QoL";

  const pathOptions: PathOptions = {
    color: selected ? "#123f3a" : hovered ? "#315f58" : "#58736e",
    weight: selected ? 4 : hovered ? 3 : 2,
    fillColor: presentation.fill,
    fillOpacity: selected ? 0.38 : hovered ? 0.31 : 0.23,
    opacity: selected ? 1 : 0.88,
  };

  const labelIcon = useMemo(
    () =>
      divIcon({
        className: "district-leaflet-label",
        html: createLabelHtml({
          name: district.name,
          value,
          layerLabel,
          selected,
          criticalCount: resolvedCriticalCount,
          markerCount,
        }),
        iconSize: [126, 48],
        iconAnchor: [63, 24],
      }),
    [
      district.name,
      layerLabel,
      markerCount,
      resolvedCriticalCount,
      selected,
      value,
    ],
  );

  useEffect(() => {
    const element = polygonRef.current?.getElement();
    if (!element) return;

    element.setAttribute("tabindex", "0");
    element.setAttribute("role", "button");
    element.setAttribute("aria-pressed", String(selected));
    element.setAttribute(
      "aria-label",
      `${district.name}, качество жизни ${visibleScore.toFixed(2)}, ${layerLabel}: ${value.toFixed(1)}`,
    );

    const handleKeyDown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
        keyboardEvent.preventDefault();
        onSelect();
      }
    };

    element.addEventListener("keydown", handleKeyDown);
    return () => element.removeEventListener("keydown", handleKeyDown);
  }, [
    district.name,
    layerLabel,
    onSelect,
    selected,
    value,
    visibleScore,
  ]);

  return (
    <>
      <Polygon
        ref={polygonRef}
        positions={geography.positions}
        pathOptions={pathOptions}
        eventHandlers={{
          click: onSelect,
          mouseover: () => onHover(true),
          mouseout: () => onHover(false),
        }}
      >
        <Tooltip sticky direction="top" className="gis-district-tooltip">
          <div className="w-36">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-teal-800">
                {district.name}
              </p>
              <strong className="text-sm font-black tabular-nums text-slate-950">
                {visibleScore.toFixed(2)}
              </strong>
            </div>
            {layer !== "QOL" && (
              <p className="mt-1 text-[9px] font-semibold text-slate-500">
                {layerLabel}:{" "}
                <strong className="text-slate-800">{value.toFixed(1)}</strong>
              </p>
            )}
            <p
              className={`mt-1 text-[9px] font-semibold ${
                resolvedCriticalCount > 0
                  ? "text-amber-700"
                  : "text-slate-400"
              }`}
            >
              {resolvedCriticalCount} крит.
            </p>
          </div>
        </Tooltip>
      </Polygon>
      <Marker
        position={geography.labelPosition}
        icon={labelIcon}
        interactive={false}
        keyboard={false}
      />
    </>
  );
}

function MapViewportControl() {
  const map = useMap();

  useEffect(() => {
    const fitWholeCity = () => {
      map.invalidateSize({ pan: false });
      map.fitBounds(ASTANA_MAP_BOUNDS, {
        padding: [24, 24],
        maxZoom: 11,
        animate: false,
      });
    };
    const frame = window.requestAnimationFrame(fitWholeCity);
    const timer = window.setTimeout(fitWholeCity, 180);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [map]);

  return (
    <button
      type="button"
      aria-label="Показать всю карту Астаны"
      title="Показать весь город"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        map.invalidateSize({ pan: false });
        map.fitBounds(ASTANA_MAP_BOUNDS, {
          padding: [24, 24],
          maxZoom: 11,
          animate: true,
        });
      }}
      className="absolute left-4 top-24 z-[500] rounded-lg bg-white/95 px-2.5 py-2 text-[10px] font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-white"
    >
      ⛶ Весь город
    </button>
  );
}

function createLabelHtml({
  name,
  value,
  layerLabel,
  selected,
  criticalCount,
  markerCount,
}: {
  name: string;
  value: number;
  layerLabel: string;
  selected: boolean;
  criticalCount: number;
  markerCount: number;
}) {
  return `
    <div class="district-map-label${selected ? " district-map-label--selected" : ""}">
      <strong>${name.toUpperCase()}</strong>
      <span>${value.toFixed(layerLabel === "QoL" ? 2 : 1)} ${layerLabel}</span>
      ${criticalCount > 0 ? `<i class="district-map-alert">${criticalCount}</i>` : ""}
      ${markerCount > 0 ? `<i class="district-map-marker">${markerCount}</i>` : ""}
    </div>
  `;
}
