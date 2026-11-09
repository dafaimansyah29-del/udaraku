"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { Place } from "@/lib/air-types";
import { QUICK_CITIES } from "@/lib/quick-cities";
import PillButton from "@/components/ui/PillButton";
import { IconAlert, IconRefresh } from "@/components/ui/Icons";

/** Keadaan kosong: belum ada lokasi dipilih, dengan pilihan kota cepat. */
export function PlaceEmpty({
  icon,
  title,
  children,
  onPick,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  onPick: (place: Place) => void;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-2 py-10 text-center sm:py-14">
      <motion.span
        className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-biru to-ungu text-white shadow-glow"
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {icon}
      </motion.span>
      <h3 className="mt-6 text-xl font-extrabold text-white sm:text-2xl">{title}</h3>
      <p className="mt-2 text-base text-white/80">{children}</p>

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

/** Keadaan error: pesan ramah dan tombol coba lagi. */
export function PlaceError({
  title,
  text,
  onRetry,
}: {
  title: string;
  text: string;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center px-2 py-10 text-center sm:py-14">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-orange-400/15 text-orange-300 ring-1 ring-orange-300/40">
        <IconAlert className="h-8 w-8" />
      </span>
      <h3 className="mt-5 text-xl font-extrabold text-white sm:text-2xl">{title}</h3>
      <p className="mt-2 text-base text-white/80">{text}</p>
      <div className="mt-6">
        <PillButton onClick={onRetry} showArrow={false}>
          <IconRefresh className="h-4 w-4" />
          COBA LAGI
        </PillButton>
      </div>
    </div>
  );
}