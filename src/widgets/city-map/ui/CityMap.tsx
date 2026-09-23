"use client";

import { useState } from "react";

import {
  DISTRICTS,
  getDistrict,
  getQoLSeverity,
  type DistrictId,
} from "@/entities/district";

import { DISTRICT_GEOMETRY } from "../model/geometry";

interface CityMapProps {
  selectedDistrictId: DistrictId;
  onSelectDistrict: (districtId: DistrictId) => void;
  scores?: Partial<Record<DistrictId, number>>;
  markerDistrictIds?: DistrictId[];
}

const SEVERITY_FILL = {
  CRITICAL: "#dc7668",
  NEEDS_ATTENTION: "#e9b75d",
  GOOD: "#68b69b",
  EXCELLENT: "#2f8f78",
} as const;

export function CityMap({
  selectedDistrictId,
  onSelectDistrict,
  scores,
  markerDistrictIds = [],
}: CityMapProps) {
  const [hoveredDistrictId, setHoveredDistrictId] =
    useState<DistrictId | null>(null);
  const hoveredDistrict = hoveredDistrictId
    ? getDistrict(hoveredDistrictId)
    : null;

  return (
    <section
      aria-label="Карта районов Астаны"
      className="relative min-h-[430px] overflow-hidden rounded-3xl border border-slate-200 bg-[#edf3f1] shadow-sm"
    >
      <div className="absolute left-5 top-5 z-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-800">
          Состояние города
        </p>
        <h2 className="mt-1 text-xl font-black text-slate-950">
          Выберите район
        </h2>
      </div>

      <svg
        className="h-full min-h-[430px] w-full"
        viewBox="0 0 900 560"
        role="img"
        aria-label="Стилизованная карта пяти районов Астаны"
      >
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#b9cbc6" strokeWidth="0.6" opacity="0.35" />
          </pattern>
          <filter id="districtShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#164e46" floodOpacity="0.18" />
          </filter>
        </defs>

        <rect width="900" height="560" fill="url(#grid)" />
        <path d="M65 455 C210 420 276 477 403 448 S642 422 846 485" fill="none" stroke="#a7cfcf" strokeWidth="24" opacity="0.7" />
        <path d="M65 455 C210 420 276 477 403 448 S642 422 846 485" fill="none" stroke="#d9f0ef" strokeWidth="12" opacity="0.95" />
        <path d="M70 155 C240 126 355 112 518 160 S730 207 850 175" fill="none" stroke="#c7d2cf" strokeWidth="4" strokeDasharray="10 10" opacity="0.65" />
        <path d="M102 330 C252 315 390 300 536 341 S744 417 831 395" fill="none" stroke="#c7d2cf" strokeWidth="3" strokeDasharray="8 11" opacity="0.55" />

        {DISTRICT_GEOMETRY.map((geometry) => {
          const district = getDistrict(geometry.id);
          const score = scores?.[geometry.id] ?? district.score;
          const selected = selectedDistrictId === geometry.id;
          const muted = selectedDistrictId && !selected;
          const hasWarning = Object.values(district.indicators).some(
            (value) => value < 40,
          );
          return (
            <g
              key={geometry.id}
              role="button"
              tabIndex={0}
              aria-label={`${district.name}, качество жизни ${score.toFixed(2)}`}
              aria-pressed={selected}
              className="cursor-pointer outline-none"
              onClick={() => onSelectDistrict(geometry.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectDistrict(geometry.id);
                }
              }}
              onMouseEnter={() => setHoveredDistrictId(geometry.id)}
              onMouseLeave={() => setHoveredDistrictId(null)}
              onFocus={() => setHoveredDistrictId(geometry.id)}
              onBlur={() => setHoveredDistrictId(null)}
            >
              <polygon
                points={geometry.points}
                fill={SEVERITY_FILL[getQoLSeverity(score)]}
                stroke={selected ? "#0f3f38" : "#ffffff"}
                strokeWidth={selected ? 7 : 3}
                opacity={muted ? 0.68 : 0.94}
                filter={selected ? "url(#districtShadow)" : undefined}
                className="transition-all duration-200 hover:opacity-100 focus:opacity-100"
              />
              <text
                x={geometry.labelX}
                y={geometry.labelY}
                textAnchor="middle"
                className="pointer-events-none fill-slate-950 text-[17px] font-black"
              >
                {district.name}
              </text>
              <text
                x={geometry.labelX}
                y={geometry.labelY + 23}
                textAnchor="middle"
                className="pointer-events-none fill-slate-800 text-[13px] font-bold"
              >
                QoL {score.toFixed(2)} {hasWarning ? "  ⚠" : ""}
              </text>
              {markerDistrictIds.includes(geometry.id) && (
                <circle
                  cx={geometry.labelX + 62}
                  cy={geometry.labelY - 8}
                  r="8"
                  fill="#0f766e"
                  stroke="white"
                  strokeWidth="3"
                />
              )}
            </g>
          );
        })}
      </svg>

      {hoveredDistrict && (
        <div className="pointer-events-none absolute bottom-5 left-5 max-w-64 rounded-xl border border-white/80 bg-white/95 p-3 shadow-lg">
          <p className="text-xs font-black uppercase tracking-widest text-teal-700">
            {hoveredDistrict.name}
          </p>
          <p className="mt-1 text-lg font-black text-slate-950">
            QoL {hoveredDistrict.score.toFixed(2)}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {hoveredDistrict.keyProblem}
          </p>
        </div>
      )}

      <div className="absolute bottom-5 right-5 flex flex-wrap justify-end gap-2 text-[10px] font-bold text-slate-600">
        {DISTRICTS.length > 0 &&
          [
            ["#dc7668", "Критично"],
            ["#e9b75d", "Требует внимания"],
            ["#68b69b", "Хорошо"],
          ].map(([color, label]) => (
            <span key={label} className="flex items-center gap-1 rounded-full bg-white/85 px-2 py-1">
              <i className="size-2 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
      </div>
    </section>
  );
}
