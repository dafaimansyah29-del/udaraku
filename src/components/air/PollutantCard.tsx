"use client";

import { motion, useReducedMotion } from "framer-motion";
import { getCategory, STANDARD_INFO } from "@/lib/aqi";
import type { Pollutant, Standard } from "@/lib/air-types";
import { POLLUTANT_INFO } from "@/lib/pollutants";

type Props = {
  pollutant: Pollutant;
  /** Kadar dalam µg/m³, null bila tidak tersedia. */
  value: number | null;
  /** Indeks polutan ini menurut standar yang dipilih. */
  index: number | null;
  standard: Standard;
  isDominant: boolean;
  order: number;
};

/** Angka kadar dengan desimal secukupnya: kecil -> 1 desimal, besar -> bulat. */
function formatValue(v: number): string {
  const digits = v < 100 ? 1 : 0;
  return v.toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export default function PollutantCard({ pollutant, value, index, standard, isDominant, order }: Props) {
  const reduce = useReducedMotion();
  const info = POLLUTANT_INFO[pollutant];
  const hasData = value !== null && index !== null;
  const category = hasData ? getCategory(standard, index) : null;
  const scaleMax = STANDARD_INFO[standard].scaleMax;
  const fill = hasData ? Math.min(index / scaleMax, 1) * 100 : 0;

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: reduce ? 0 : 0.08 * order, ease: "easeOut" }}
      className={`flex flex-col rounded-2xl bg-white/[0.07] p-4 ring-1 transition-colors hover:bg-white/[0.1] sm:p-5 ${
        isDominant ? "ring-2 ring-cyan" : "ring-white/15"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-lg font-extrabold leading-tight text-white">{info.symbol}</p>
          <p className="text-xs font-medium text-white/75">{info.name}</p>
        </div>
        {isDominant && (
          <span className="shrink-0 rounded-full bg-cyan px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink">
            Penyebab utama
          </span>
        )}
      </div>

      <p className="mt-3 flex items-baseline gap-1.5">
        {hasData ? (
          <>
            <span className="font-heading text-2xl font-extrabold text-white">{formatValue(value)}</span>
            <span className="text-xs text-white/75">{info.unit}</span>
          </>
        ) : (
          <span className="text-sm font-medium text-white/75">Data belum tersedia</span>
        )}
      </p>

      {/* Batang indeks + kategori */}
      <div className="mt-3">
        <div className="h-2 overflow-hidden rounded-full bg-white/15">
          {category && (
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: category.color }}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${fill}%` }}
              transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : 0.1 + 0.08 * order, ease: "easeOut" }}
            />
          )}
        </div>
        <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-white">
          {category ? (
            <>
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span>
                {STANDARD_INFO[standard].name} {index} · {category.label}
              </span>
            </>
          ) : (
            <span className="text-white/75">Tidak bisa dihitung</span>
          )}
        </p>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-white/75">{info.desc}</p>
    </motion.li>
  );
}