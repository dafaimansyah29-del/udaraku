"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Place } from "@/lib/air-types";
import { QUICK_CITIES } from "@/lib/quick-cities";
import PillButton from "@/components/ui/PillButton";
import { IconAlert, IconLungs, IconRefresh } from "@/components/ui/Icons";

/* ---------------- Loading (skeleton) ---------------- */

const bar = "animate-pulse rounded-full bg-white/15 motion-reduce:animate-none";

export function AirSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-5 sm:space-y-6">
      <span className="sr-only">Memuat data kualitas udara…</span>

      <div className="flex flex-col gap-4 px-1 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className={`${bar} h-3 w-16`} />
          <div className={`${bar} h-8 w-56 !rounded-xl`} />
          <div className={`${bar} h-3 w-40`} />
        </div>
        <div className={`${bar} h-11 w-60`} />
      </div>

      <div className="grid items-center gap-6 rounded-3xl bg-white/[0.07] p-5 sm:p-8 md:grid-cols-[auto_1fr] md:gap-12">
        <div className="mx-auto aspect-square w-[250px] max-w-full animate-pulse rounded-full border-[18px] border-white/15 motion-reduce:animate-none sm:w-[280px]" />
        <div className="space-y-4">
          <div className={`${bar} mx-auto h-8 w-40 md:mx-0`} />
          <div className={`${bar} h-5 w-full !rounded-lg`} />
          <div className={`${bar} h-5 w-2/3 !rounded-lg`} />
          <div className="flex flex-wrap justify-center gap-2 md:justify-start">
            <div className={`${bar} h-9 w-40`} />
            <div className={`${bar} h-9 w-28`} />
            <div className={`${bar} h-9 w-32`} />
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white/[0.05] p-4 sm:p-6">
        <div className={`${bar} h-6 w-40 !rounded-lg`} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-2xl bg-white/[0.07] p-4 sm:p-5">
              <div className={`${bar} h-5 w-16 !rounded-lg`} />
              <div className={`${bar} h-7 w-28 !rounded-lg`} />
              <div className={`${bar} h-2 w-full`} />
              <div className={`${bar} h-3 w-full !rounded-lg`} />
              <div className={`${bar} h-3 w-4/5 !rounded-lg`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Error ---------------- */

export function AirError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center px-2 py-10 text-center sm:py-14"
    >
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-orange-500/15 text-orange-300">
        <IconAlert className="h-8 w-8" />
      </span>
      <h3 className="mt-5 text-xl font-extrabold text-white sm:text-2xl">Data udara belum bisa dimuat</h3>
      <p className="mt-2 text-base text-white/80">
        Sepertinya ada gangguan sebentar. Periksa koneksi internetmu, lalu coba lagi.
      </p>
      <div className="mt-6">
        <PillButton onClick={onRetry} showArrow={false}>
          <IconRefresh className="h-4 w-4" />
          COBA LAGI
        </PillButton>
      </div>
    </div>
  );
}

/* ---------------- Kosong (belum ada lokasi) ---------------- */

export function AirEmpty({ onPick }: { onPick: (place: Place) => void }) {
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-2 py-10 text-center sm:py-14">
      <motion.span
        className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-biru to-ungu text-white shadow-glow"
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <IconLungs className="h-10 w-10" />
      </motion.span>
      <h3 className="mt-6 text-xl font-extrabold text-white sm:text-2xl">Belum ada lokasi dipilih</h3>
      <p className="mt-2 text-base text-white/80">
        Tekan <strong>Gunakan Lokasiku</strong> atau cari nama kotamu di atas untuk melihat kualitas
        udara.
      </p>

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">Atau coba kota ini</p>
      <ul className="mt-3 flex flex-wrap justify-center gap-2">
        {QUICK_CITIES.map((city) => (
          <li key={city.name}>
            <button
              type="button"
              onClick={() => onPick(city)}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-cyan hover:text-ink"
            >
              {city.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}