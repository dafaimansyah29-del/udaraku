"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { computeAqi, getCategories, POLLUTANT_KEYS, STANDARD_INFO } from "@/lib/aqi";
import type { AirResponse, Place, Standard } from "@/lib/air-types";
import { formatUpdated } from "@/lib/format";
import { POLLUTANT_INFO } from "@/lib/pollutants";
import AqiGauge from "./AqiGauge";
import PollutantCard from "./PollutantCard";
import StandardToggle from "./StandardToggle";
import { IconAlert, IconDrop, IconPin, IconRefresh, IconThermo } from "@/components/ui/Icons";

type Props = {
  data: AirResponse;
  place: Place;
  standard: Standard;
  onStandardChange: (s: Standard) => void;
  onRetry: () => void;
};

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur-md sm:text-sm">
      {icon}
      {children}
    </span>
  );
}

export default function AirResult({ data, place, standard, onStandardChange, onRetry }: Props) {
  const reduce = useReducedMotion();
  const result = useMemo(() => computeAqi(standard, data.pollutants), [standard, data.pollutants]);
  const info = STANDARD_INFO[standard];
  const categories = getCategories(standard);

  if (!result) {
    return (
      <p className="rounded-2xl bg-white/[0.06] p-6 text-center text-white/80 ring-1 ring-white/10">
        Belum ada data polutan untuk lokasi ini.
      </p>
    );
  }

  const { category } = result;
  const { temperature, humidity } = data.weather;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Peringatan data contoh */}
      {data.isMock && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl bg-yellow-50 p-4 ring-1 ring-yellow-300 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-3 text-sm text-navy">
            <IconAlert className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
            <span>
              <strong>Ini data contoh, bukan data asli.</strong> Data udara sungguhan sedang tidak
              bisa diambil. Jangan dipakai untuk mengambil keputusan kesehatan.
            </span>
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-navy px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-biru"
          >
            <IconRefresh className="h-4 w-4" />
            Coba lagi
          </button>
        </div>
      )}

      {/* Lokasi + toggle standar */}
      <div className="flex flex-col gap-4 px-1 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            <IconPin className="h-4 w-4" />
            Lokasi
          </p>
          <h3 className="mt-1 break-words text-2xl font-extrabold text-white sm:text-4xl">{place.name}</h3>
          {place.subtitle && <p className="text-sm text-white/75">{place.subtitle}</p>}
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <StandardToggle value={standard} onChange={onStandardChange} tone="dark" />
          <p className="text-xs text-white/75 md:text-right">{info.fullName}</p>
        </div>
      </div>

      {/* Kartu AQI besar */}
      <section
        aria-label={`Indeks kualitas udara menurut ${info.name}`}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1E5B] via-[#16278A] to-[#3b32b8] p-5 text-white shadow-card-lg ring-1 ring-white/20 sm:p-10"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full opacity-30 blur-3xl transition-colors duration-700"
          style={{ backgroundColor: category.color }}
        />
        <div className="relative grid items-center gap-6 md:grid-cols-[auto_1fr] md:gap-12">
          <AqiGauge
            value={result.value}
            color={category.color}
            categoryLabel={category.label}
            standardName={info.name}
            scaleMax={info.scaleMax}
          />

          <div className="text-center md:text-left">
            <span
              className="inline-block rounded-full px-4 py-1.5 font-heading text-sm font-extrabold uppercase tracking-wide transition-colors duration-500"
              style={{ backgroundColor: category.color, color: category.ink }}
            >
              {category.label}
            </span>
            <p className="mt-4 text-lg font-semibold leading-snug sm:text-xl">{category.advice}</p>

            <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
              <Chip icon={<span aria-hidden="true" className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_8px_#22D3EE]" />}>
                Polutan utama: {POLLUTANT_INFO[result.dominant].symbol}
              </Chip>
              {temperature !== null && (
                <Chip icon={<IconThermo className="h-4 w-4 text-cyan" />}>
                  Suhu {Math.round(temperature)}°C
                </Chip>
              )}
              {humidity !== null && (
                <Chip icon={<IconDrop className="h-4 w-4 text-cyan" />}>
                  Kelembapan {Math.round(humidity)}%
                </Chip>
              )}
            </div>

            {/* Skala kategori; yang aktif ditebalkan */}
            <div className="mt-6" aria-hidden="true">
              <div className="flex gap-1">
                {categories.map((c) => (
                  <motion.span
                    key={c.level}
                    title={`${c.label} (${c.min}${c.level === categories.length - 1 ? "+" : `–${c.max}`})`}
                    className="h-2 flex-1 rounded-full"
                    style={{ backgroundColor: c.color }}
                    animate={{ opacity: c.level === category.level ? 1 : 0.28 }}
                    transition={{ duration: reduce ? 0 : 0.4 }}
                  />
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] font-medium text-white/80">
                <span>Baik</span>
                <span>Berbahaya</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rincian polutan */}
      <section aria-labelledby="rincian-polutan" className="rounded-3xl bg-white/[0.05] p-4 ring-1 ring-white/10 sm:p-6">
        <h3 id="rincian-polutan" className="font-heading text-lg font-extrabold text-white sm:text-xl">
          Rincian Polutan
        </h3>
        <p className="mt-1 text-sm text-white/75">
          Angka indeks tertinggi menentukan nilai keseluruhan di atas.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {POLLUTANT_KEYS.map((p, i) => (
            <PollutantCard
              key={p}
              pollutant={p}
              value={data.pollutants[p]}
              index={result.subIndices[p]}
              standard={standard}
              isDominant={p === result.dominant}
              order={i}
            />
          ))}
        </ul>
      </section>

      {/* Sumber data dan waktu update */}
      <footer className="space-y-1 px-1 text-xs leading-relaxed text-white/75">
        <p>
          <span className="font-semibold text-white">Sumber data:</span> {data.source}
        </p>
        <p>
          <span className="font-semibold text-white">Diperbarui:</span>{" "}
          <time dateTime={data.updatedAt}>{formatUpdated(data.updatedAt, data.timezone)}</time>
        </p>
        <p>
          Angka berasal dari model atmosfer, bukan alat ukur di lokasimu, dan dihitung dari kadar
          polutan saat ini. Hasilnya bisa sedikit berbeda dari laporan resmi.
        </p>
      </footer>
    </div>
  );
}