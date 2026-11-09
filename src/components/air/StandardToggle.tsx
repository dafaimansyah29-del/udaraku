"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { KeyboardEvent } from "react";
import type { Standard } from "@/lib/air-types";

const OPTIONS: { value: Standard; label: string }[] = [
  { value: "ispu", label: "ISPU Indonesia" },
  { value: "us", label: "US AQI" },
];

type Props = {
  value: Standard;
  onChange: (value: Standard) => void;
  /** "light" (bawaan) untuk latar putih, "dark" untuk latar gelap. */
  tone?: "light" | "dark";
};

export default function StandardToggle({ value, onChange, tone = "light" }: Props) {
  const dark = tone === "dark";
  const reduce = useReducedMotion();

  // Panah kiri/kanan berpindah pilihan, sesuai pola radiogroup
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const next = OPTIONS.find((o) => o.value !== value);
    if (next) {
      onChange(next.value);
      // fokus ikut pindah ke tombol baru
      requestAnimationFrame(() => {
        document.getElementById(`standar-${next.value}`)?.focus();
      });
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Pilih standar indeks"
      className={`inline-flex rounded-full p-1 ring-1 ${dark ? "bg-white/10 ring-white/20" : "bg-abu ring-navy/10"}`}
    >
      {OPTIONS.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            id={`standar-${opt.value}`}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={onKeyDown}
            className={`relative rounded-full px-4 py-2 font-heading text-xs font-bold tracking-wide transition-colors sm:px-5 sm:text-sm ${
              selected ? "text-white" : dark ? "text-white/80 hover:text-white" : "text-navy/70 hover:text-navy"
            }`}
          >
            {selected && (
              <motion.span
                layoutId="standar-aktif"
                className="absolute inset-0 rounded-full bg-biru shadow-glow"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}