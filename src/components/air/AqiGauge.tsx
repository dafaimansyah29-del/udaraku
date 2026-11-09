"use client";

import { memo, useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { ANIMATION } from "@/lib/constants";

type Props = {
  value: number;
  color: string;
  categoryLabel: string;
  /** Nama standar, mis. "ISPU" atau "US AQI". */
  standardName: string;
  /** Nilai indeks yang dianggap "penuh" untuk busur (lebih tinggi tetap penuh). */
  scaleMax: number;
};

// Busur 270°: mulai dari kiri-bawah (135°), searah jarum jam, berakhir kanan-bawah (45°)
const ARC = "M 49.29 190.71 A 100 100 0 1 1 190.71 190.71";

function AqiGauge({ value, color, categoryLabel, standardName, scaleMax }: Props) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  // Sedikit di atas 0 supaya ujung busur yang membulat tetap terlihat
  const progress = useTransform(mv, (v) => Math.min(Math.max(v / scaleMax, 0.004), 1));

  // Hitung naik dari nilai sebelumnya ke nilai baru (langsung bila gerakan dikurangi)
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: ANIMATION.GAUGE_DURATION, ease: ANIMATION.GAUGE_EASING });
    return () => controls.stop();
  }, [value, reduce, mv]);

  return (
    <div
      role="img"
      aria-label={`${standardName} ${value}, kategori ${categoryLabel}`}
      className="relative mx-auto aspect-square w-full max-w-[250px] sm:max-w-[280px]"
    >
      <svg viewBox="0 0 240 240" className="h-full w-full" aria-hidden="true">
        {/* Jalur latar */}
        <path d={ARC} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="18" strokeLinecap="round" />
        {/*
          Busur nilai. Warna dipasang di <g> (style biasa) dan busur memakai currentColor,
          karena framer-motion tidak memperbarui style statis pada motion.path
          yang sudah memakai motion value (pathLength).
        */}
        <g
          className="transition-[color] duration-500"
          style={{ color, filter: "drop-shadow(0 0 8px currentColor)" }}
        >
          <motion.path
            d={ARC}
            fill="none"
            stroke="currentColor"
            strokeWidth="18"
            strokeLinecap="round"
            style={{ pathLength: progress }}
          />
        </g>
        <text x="49" y="226" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.55)">
          0
        </text>
        <text x="191" y="226" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.55)">
          {scaleMax}+
        </text>
      </svg>

      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center pb-3">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
          {standardName}
        </span>
        <motion.span className="font-heading text-6xl font-extrabold leading-none text-white sm:text-7xl">
          {rounded}
        </motion.span>
      </div>
    </div>
  );
}

export default memo(AqiGauge);
