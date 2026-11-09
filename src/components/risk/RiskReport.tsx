"use client";

import { motion, useReducedMotion } from "framer-motion";
import { buildAdvice } from "@/lib/risk";
import type { RiskInput, RiskResult } from "@/lib/risk";
import { ACTIVITIES, MASKS, REFERENCE_BREATH_RATE, REFERENCE_DOSE, REFERENCE_HOURS, RISK_LEVELS, WHO_PM25_24H } from "@/lib/risk-config";
import { formatNumber } from "@/lib/format";
import RiskMeter from "./RiskMeter";

type Props = {
  input: RiskInput;
  result: RiskResult;
};

/** Dosis kecil perlu 1 desimal, dosis besar cukup bulat. */
const fmtDose = (v: number) => formatNumber(v, v < 10 ? 1 : 0);

export default function RiskReport({ input, result }: Props) {
  const reduce = useReducedMotion();
  const tips = buildAdvice(input, result);
  const { level, factors } = result;
  const percent = Math.round(result.ratio * 100);

  return (
    <div className="space-y-4 sm:space-y-5 2xl:grid 2xl:grid-cols-2 2xl:items-stretch 2xl:gap-5 2xl:space-y-0">
      {/* Meter + kategori */}
      <section
        aria-label="Hasil risiko"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-950 via-navy to-[#16278A] p-5 text-white shadow-card-lg ring-1 ring-white/20 sm:p-7"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-30 blur-3xl transition-colors duration-700"
          style={{ backgroundColor: level.color }}
        />
        <div className="relative">
          <RiskMeter ratio={result.ratio} levelIndex={result.levelIndex} />

          <div className="mt-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              Risiko untuk aktivitasmu
            </p>
            <span
              className="mt-2 inline-block rounded-full px-5 py-1.5 font-heading text-base font-extrabold uppercase tracking-wide transition-colors duration-500"
              style={{ backgroundColor: level.color, color: level.ink }}
            >
              {level.label}
            </span>
            <p className="mx-auto mt-3 max-w-sm text-base font-semibold leading-snug">{level.summary}</p>

            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-semibold sm:text-sm">
              <span className="rounded-full bg-white/10 px-3.5 py-2 ring-1 ring-white/15">
                PM2.5 {formatNumber(input.pm25, 1)} µg/m³ · {formatNumber(result.pm25VsWho, 1)}× batas WHO
              </span>
              <span className="rounded-full bg-white/10 px-3.5 py-2 ring-1 ring-white/15">
                Dosis sesi ini {fmtDose(result.dose)} µg
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 saran */}
      <section aria-labelledby="saran-judul" className="flex flex-col rounded-3xl bg-white/[0.07] p-4 ring-1 ring-white/10 sm:p-6">
        <h3 id="saran-judul" className="font-heading text-lg font-extrabold text-white sm:text-xl">
          3 saran untukmu
        </h3>
        <ol className="mt-3 flex flex-1 flex-col gap-2.5">
          {tips.map((tip, i) => (
            <motion.li
              key={tip}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: reduce ? 0 : 0.1 * i, ease: "easeOut" }}
              className="flex flex-1 items-center gap-3 rounded-2xl bg-white/[0.08] p-4 ring-1 ring-white/15"
            >
              <span
                aria-hidden="true"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-biru to-ungu text-sm font-bold text-white"
              >
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-white sm:text-base">{tip}</span>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Cara menghitung */}
      <details className="group rounded-2xl 2xl:col-span-2 bg-white/[0.07] p-4 ring-1 ring-white/10 sm:p-5">
        <summary className="cursor-pointer select-none font-heading text-sm font-bold text-white marker:text-cyan">
          Lihat cara menghitung
        </summary>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-white/85">
          <p>
            <strong>Dosis</strong> = PM2.5 × laju napas × durasi × faktor kerentanan × (1 − efektivitas masker)
          </p>
          <p className="break-words rounded-xl bg-ink/50 p-3 font-mono text-xs leading-relaxed text-white ring-1 ring-white/15">
            {formatNumber(input.pm25, 1)} × {formatNumber(factors.breathRate, 1)} ({ACTIVITIES[input.activity].label.toLowerCase()}) ×{" "}
            {formatNumber(factors.hours, 2)} jam × {formatNumber(factors.vulnerability, 2)} × (1 −{" "}
            {formatNumber(factors.maskEffectiveness, 2)} ({MASKS[input.mask].label.toLowerCase()})) ={" "}
            <strong>{fmtDose(result.dose)} µg</strong>
          </p>
          <p>
            <strong>Dosis acuan WHO</strong> = {WHO_PM25_24H} µg/m³ × {formatNumber(REFERENCE_BREATH_RATE, 1)} m³/jam ×{" "}
            {REFERENCE_HOURS} jam = {REFERENCE_DOSE} µg. Ini jumlah PM2.5 yang terhirup orang yang diam seharian penuh
            di udara tepat pada batas harian WHO 2021.
          </p>
          <p>
            <strong>Rasio</strong> = {fmtDose(result.dose)} ÷ {REFERENCE_DOSE} = {percent}%, masuk kategori{" "}
            <strong>{level.label}</strong>.
          </p>
          <ul className="space-y-1">
            {RISK_LEVELS.map((l, i) => {
              const next = RISK_LEVELS[i + 1];
              const range = next
                ? `${Math.round(l.minRatio * 100)}% sampai di bawah ${Math.round(next.minRatio * 100)}%`
                : `${Math.round(l.minRatio * 100)}% atau lebih`;
              return (
                <li key={l.id} className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className={i === result.levelIndex ? "font-bold text-white" : ""}>
                    {l.label}: {range}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-white/75">
            Ini model sederhana. Hanya memakai PM2.5 saat ini, dan tidak menghitung PM10, ozon, atau gas lain.
            Angka laju napas, kerentanan, dan masker adalah perkiraan untuk edukasi.
          </p>
        </div>
      </details>
    </div>
  );
}