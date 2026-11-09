"use client";

import { useId, useMemo, useState } from "react";
import type { Standard } from "@/lib/air-types";
import { pm25Category } from "@/lib/aqi";
import {
  BEST_COUNT,
  BEST_WINDOW_HOURS,
  DAYTIME_END,
  DAYTIME_START,
  bestHours,
  dayLabel,
  formatHour,
} from "@/lib/forecast";
import type { ForecastPoint } from "@/lib/forecast";
import { formatNumber } from "@/lib/format";
import { IconClock } from "@/components/ui/Icons";

type Props = {
  points: ForecastPoint[];
  standard: Standard;
};

export default function BestHoursCard({ points, standard }: Props) {
  const switchId = useId();
  const [daytimeOnly, setDaytimeOnly] = useState(false);
  const nowKey = points[0]?.time ?? "";

  const best = useMemo(() => bestHours(points, { daytimeOnly }), [points, daytimeOnly]);
  const topCategory = best[0] ? pm25Category(standard, best[0].pm25) : null;

  return (
    <section
      aria-labelledby="jam-terbaik-judul"
      className="rounded-3xl bg-gradient-to-br from-navy-950 via-navy to-[#16278A] p-5 text-white shadow-card-lg ring-1 ring-white/20 sm:p-7 xl:h-full"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur-md">
          <IconClock className="h-6 w-6" />
        </span>
        <div>
          <h3 id="jam-terbaik-judul" className="font-heading text-lg font-extrabold leading-tight sm:text-xl">
            Jam terbaik beraktivitas di luar
          </h3>
          <p className="mt-1 text-sm text-white/80">
            {BEST_COUNT} jam dengan PM2.5 terendah dalam {BEST_WINDOW_HOURS} jam ke depan.
          </p>
        </div>
      </div>

      {best.length === 0 ? (
        <p role="status" className="mt-5 rounded-2xl bg-white/10 p-4 text-sm text-white/85">
          Belum ada data untuk jam-jam ini. Coba matikan filter siang hari atau muat ulang.
        </p>
      ) : (
        <ol className="mt-5 space-y-2.5" aria-label="Jam dengan PM2.5 terendah">
          {best.map((h) => {
            const cat = pm25Category(standard, h.pm25);
            return (
              <li
                key={h.time}
                className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 sm:gap-4 sm:p-4"
              >
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white font-heading text-sm font-extrabold text-navy"
                >
                  {h.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-base font-extrabold leading-tight sm:text-lg">
                    {dayLabel(h.time, nowKey)}, {formatHour(h.time)}
                  </p>
                  <p className="mt-0.5 text-sm text-white/75">
                    PM2.5 {formatNumber(h.pm25, 1)} µg/m³
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-3 py-1 text-xs font-bold"
                  style={{ backgroundColor: cat.color, color: cat.ink }}
                >
                  {cat.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {topCategory && topCategory.level >= 2 && (
        <p className="mt-4 rounded-2xl bg-orange-400/20 p-3 text-sm font-medium text-orange-100 ring-1 ring-orange-300/30">
          Hati-hati: bahkan jam terbaik pun masih berkategori “{topCategory.label}”. Kurangi aktivitas berat di
          luar rumah dan pakai masker bila harus keluar.
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <input
          id={switchId}
          type="checkbox"
          checked={daytimeOnly}
          onChange={(e) => setDaytimeOnly(e.target.checked)}
          className="h-5 w-5 shrink-0 cursor-pointer accent-cyan"
        />
        <label htmlFor={switchId} className="cursor-pointer text-sm text-white/85">
          Hanya jam {String(DAYTIME_START).padStart(2, "0")}.00 sampai {DAYTIME_END}.00
        </label>
      </div>
    </section>
  );
}