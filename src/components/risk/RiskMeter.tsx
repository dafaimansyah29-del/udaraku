"use client";

import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { RISK_LEVELS } from "@/lib/risk-config";
import { ratioToMeterPosition } from "@/lib/risk";

type Props = {
  /** dosis ÷ dosis acuan WHO */
  ratio: number;
  /** 0 = Rendah ... 3 = Sangat Tinggi */
  levelIndex: number;
};

// Setengah lingkaran: kiri (180°) lewat atas ke kanan (0°), dibagi 4 segmen @45°
const CX = 120;
const CY = 118;
const R = 90;
const STROKE = 22;
const NEEDLE = 70;

const point = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [CX + R * Math.cos(a), CY - R * Math.sin(a)] as const;
};

function arc(startDeg: number, endDeg: number) {
  const [x1, y1] = point(startDeg);
  const [x2, y2] = point(endDeg);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export default function RiskMeter({ ratio, levelIndex }: Props) {
  const reduce = useReducedMotion();
  const target = ratioToMeterPosition(ratio);
  const percent = Math.round(ratio * 100);
  const level = RISK_LEVELS[levelIndex];

  // Jarum mulai dari kiri lalu berputar ke posisi akhir (transisi CSS)
  const [position, setPosition] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setPosition(target));
    return () => cancelAnimationFrame(id);
  }, [target]);

  // Angka persen dihitung naik, selaras dengan gerak jarum
  const mv = useMotionValue(0);
  const shown = useTransform(mv, (v) => (v > 999 ? "999+" : String(Math.round(v))));
  useEffect(() => {
    if (reduce) {
      mv.set(percent);
      return;
    }
    const controls = animate(mv, percent, { duration: 1.3, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [percent, reduce, mv]);

  return (
    <div
      role="img"
      aria-label={`Meter risiko: ${level.label}. Dosis sesi ini ${percent} persen dari dosis harian WHO.`}
      className="mx-auto w-full max-w-[320px]"
    >
      <svg viewBox="0 0 240 140" className="w-full" aria-hidden="true">
        {RISK_LEVELS.map((l, i) => {
          const start = 180 - i * 45 - (i === 0 ? 0 : 1.2);
          const end = 180 - (i + 1) * 45 + (i === RISK_LEVELS.length - 1 ? 0 : 1.2);
          return (
            <path
              key={l.id}
              d={arc(start, end)}
              fill="none"
              stroke={l.color}
              strokeWidth={STROKE}
              opacity={i === levelIndex ? 1 : 0.32}
              className="transition-opacity duration-500"
            />
          );
        })}

        {/* Jarum: digambar menunjuk ke kiri, lalu diputar 0-180° searah jarum jam */}
        <g
          className="transition-transform duration-[1300ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: `rotate(${position * 180}deg)`, transformOrigin: `${CX}px ${CY}px` }}
        >
          <polygon
            points={`${CX - NEEDLE},${CY} ${CX},${CY - 5} ${CX},${CY + 5}`}
            fill="#FFFFFF"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.45))" }}
          />
        </g>
        <circle cx={CX} cy={CY} r="10" fill="#FFFFFF" />
        <circle cx={CX} cy={CY} r="4.5" fill="#0B1E5B" />
      </svg>

      <div aria-hidden="true" className="-mt-1 text-center text-white">
        <p className="font-heading text-5xl font-extrabold leading-none sm:text-6xl">
          <motion.span>{shown}</motion.span>
          <span className="ml-0.5 text-3xl sm:text-4xl">%</span>
        </p>
        <p className="mt-2 text-xs font-medium text-white/65">dari dosis harian standar WHO</p>
      </div>

      <ul aria-hidden="true" className="mt-4 grid grid-cols-4 gap-1 text-center">
        {RISK_LEVELS.map((l, i) => (
          <li
            key={l.id}
            className={`text-[10px] leading-tight sm:text-[11px] ${
              i === levelIndex ? "font-bold text-white" : "font-medium text-white/50"
            }`}
          >
            <span className="mx-auto mb-1 block h-1.5 w-full rounded-full" style={{ backgroundColor: l.color, opacity: i === levelIndex ? 1 : 0.35 }} />
            {l.label}
          </li>
        ))}
      </ul>
    </div>
  );
}