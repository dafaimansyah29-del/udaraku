"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import type { Place, Standard } from "@/lib/air-types";
import { STANDARD_INFO, pm25Category, pm25Zones } from "@/lib/aqi";
import { dayLabel, formatHour, summarize } from "@/lib/forecast";
import type { ForecastResponse } from "@/lib/forecast";
import { formatNumber, formatUpdated } from "@/lib/format";
import { useLocate } from "@/hooks/useLocate";
import { usePlaceData } from "@/hooks/usePlaceData";
import OfflineNote from "@/components/shared/OfflineNote";
import LocationPicker from "@/components/air/LocationPicker";
import StandardToggle from "@/components/air/StandardToggle";
import Bokeh from "@/components/hero/Bokeh";
import { PlaceEmpty, PlaceError } from "@/components/shared/PlaceStates";
import { IconPulse } from "@/components/ui/Icons";
import BestHoursCard from "./BestHoursCard";

// Recharts (±100 kB) dimuat hanya saat grafik dibutuhkan, bukan di bundel awal halaman.
const ForecastChart = dynamic(() => import("./ForecastChart"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-busy="true"
      className="grid h-[300px] w-full animate-pulse place-items-center rounded-2xl bg-white/[0.07] text-sm font-medium text-white/80 motion-reduce:animate-none sm:h-[380px]"
    >
      Memuat grafik…
    </div>
  ),
});

const bar = "animate-pulse rounded-full bg-white/15 motion-reduce:animate-none";

function ForecastSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-5">
      <span className="sr-only">Memuat prakiraan…</span>
      <div className="space-y-3 px-1">
        <div className={`${bar} h-8 w-64 !rounded-xl`} />
        <div className={`${bar} h-3 w-44`} />
      </div>
      <div className="h-[300px] animate-pulse rounded-3xl bg-white/[0.07] motion-reduce:animate-none sm:h-[380px]" />
      <div className="h-56 animate-pulse rounded-3xl bg-white/[0.07] motion-reduce:animate-none" />
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10 sm:p-5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-white/75">{label}</dt>
      <dd className="mt-1 font-heading text-xl font-extrabold text-white sm:text-2xl">{value}</dd>
      {hint && <dd className="mt-0.5 text-xs text-white/75">{hint}</dd>}
    </div>
  );
}

function ForecastResult({
  data,
  place,
  standard,
  onStandardChange,
}: {
  data: ForecastResponse;
  place: Place;
  standard: Standard;
  onStandardChange: (s: Standard) => void;
}) {
  const nowKey = data.points[0]?.time ?? "";
  const summary = useMemo(() => summarize(data.points), [data.points]);
  const zones = useMemo(() => pm25Zones(standard), [standard]);
  const nowCategory = summary.now === null ? null : pm25Category(standard, summary.now);

  const fmt = (v: number) => `${formatNumber(v, 1)} µg/m³`;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-4 px-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">Prakiraan PM2.5 · 72 jam</p>
          <h3 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">{place.name}</h3>
          {place.subtitle && <p className="text-sm text-white/75">{place.subtitle}</p>}
        </div>
        <StandardToggle value={standard} onChange={onStandardChange} tone="dark" />
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          label="Sekarang"
          value={summary.now === null ? "-" : fmt(summary.now)}
          hint={nowCategory?.label}
        />
        <Stat
          label="Tertinggi"
          value={summary.max ? fmt(summary.max.pm25) : "-"}
          hint={summary.max ? `${dayLabel(summary.max.time, nowKey)}, ${formatHour(summary.max.time)}` : undefined}
        />
        <Stat label="Rata-rata 72 jam" value={summary.average === null ? "-" : fmt(summary.average)} />
      </dl>

      <div className="space-y-4 sm:space-y-5 xl:grid xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:items-stretch xl:gap-5 xl:space-y-0">
      <section aria-label="Grafik prakiraan PM2.5" className="rounded-3xl bg-white/[0.07] p-3 ring-1 ring-white/10 sm:p-5">
        <p className="sr-only">
          Grafik garis PM2.5 per jam selama 72 jam ke depan di {place.name}. Data lengkap ada pada tabel di bawah
          grafik.
        </p>
        <ForecastChart points={data.points} standard={standard} />

        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 px-1" aria-label={`Zona warna ${STANDARD_INFO[standard].name}`}>
          {zones.map((z, i) => (
            <li key={z.category.label} className="flex items-center gap-2 text-xs text-white/85">
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded-full ring-1 ring-white/30"
                style={{ backgroundColor: z.category.color }}
              />
              <span className="font-semibold">{z.category.label}</span>
              <span className="text-white/75">
                {i === zones.length - 1
                  ? `> ${formatNumber(z.from, 1)}`
                  : `${formatNumber(z.from, 1)}–${formatNumber(z.to, 1)}`}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 px-1 text-xs text-white/75">
          Satuan µg/m³. Zona warna mengikuti batas PM2.5 {STANDARD_INFO[standard].name}.
        </p>
      </section>

      <BestHoursCard points={data.points} standard={standard} />
      </div>

      <details className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10 sm:p-5">
        <summary className="cursor-pointer select-none font-heading text-sm font-bold text-white marker:text-cyan">
          Lihat data per jam
        </summary>
        <div className="mt-3 max-h-72 overflow-auto rounded-xl bg-ink/40 ring-1 ring-white/15">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">PM2.5 per jam selama 72 jam ke depan</caption>
            <thead className="sticky top-0 bg-[#0e1d5c] text-xs uppercase tracking-wide text-white/80">
              <tr>
                <th scope="col" className="px-4 py-2.5">Waktu</th>
                <th scope="col" className="px-4 py-2.5">PM2.5 (µg/m³)</th>
                <th scope="col" className="px-4 py-2.5">Kategori</th>
              </tr>
            </thead>
            <tbody>
              {data.points.map((p) => (
                <tr key={p.time} className="border-t border-white/10">
                  <th scope="row" className="px-4 py-2 font-medium text-white">
                    {dayLabel(p.time, nowKey)}, {formatHour(p.time)}
                  </th>
                  <td className="px-4 py-2 text-white">{p.pm25 === null ? "-" : formatNumber(p.pm25, 1)}</td>
                  <td className="px-4 py-2 text-white/85">
                    {p.pm25 === null ? "-" : pm25Category(standard, p.pm25).label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <div className="flex flex-col gap-1 rounded-2xl bg-white/[0.07] px-4 py-3 text-xs text-white/75 ring-1 ring-white/10 sm:flex-row sm:justify-between">
        <span>Sumber: {data.source}. Jam ditampilkan dalam waktu setempat.</span>
        <span>Diambil: {formatUpdated(data.generatedAt, data.timezone)}</span>
      </div>
      <p className="px-1 text-xs text-white/75">
        Prakiraan berasal dari model komputer dan bisa meleset, terutama untuk kejadian mendadak seperti kebakaran
        lahan. Standar resmi memakai rata-rata 24 jam, jadi kategori per jam di sini hanya perkiraan.
      </p>
    </div>
  );
}

export default function PrakiraanClient() {
  const reduce = useReducedMotion();
  const resultRef = useRef<HTMLDivElement>(null);
  const { place, status, data, offline, load, retry } = usePlaceData<ForecastResponse>("/api/forecast");
  const { locating, geoError, locate, clearGeoError } = useLocate();
  const [standard, setStandard] = useState<Standard>("ispu");

  const choosePlace = useCallback(
    (target: Place) => {
      clearGeoError();
      void load(target);
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      });
    },
    [load, clearGeoError, reduce],
  );

  return (
    <>
      {/* Hero gelap: judul + pencari lokasi */}
      <section id="prakiraan" className="relative pb-16 pt-28 sm:pb-20 sm:pt-36">
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 top-6 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(108,92,231,0.4)_0%,transparent_65%)] blur-3xl" />
          <div className="absolute -left-32 bottom-0 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.2)_0%,transparent_65%)] blur-3xl" />
          <Bokeh />
        </div>

        <div className="relative mx-auto max-w-[1560px] px-5 text-center sm:px-8 lg:px-12 xl:px-16">
          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl xl:text-6xl"
          >
            Prakiraan{" "}
            <span className="bg-gradient-to-r from-cyan to-ungu bg-clip-text text-transparent">Udara 72 Jam</span>
          </motion.h1>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
          >
            Lihat bagaimana PM2.5 berubah tiga hari ke depan, dan cari jam paling bersih untuk beraktivitas di luar.
          </motion.p>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="mt-8"
          >
            <LocationPicker
              onSelect={choosePlace}
              onLocate={() => locate(choosePlace)}
              locating={locating}
              geoError={geoError}
            />
          </motion.div>
        </div>
      </section>

      {/* Panel hasil: kaca gelap, selaras dengan beranda */}
      <section className="relative z-10 px-5 pb-24 sm:px-8 sm:pb-28 lg:px-12 xl:px-16">
        <div ref={resultRef} className="mx-auto max-w-[1560px] scroll-mt-24">
          <h2 className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan">
            <span className="h-px w-8 bg-cyan/70" aria-hidden="true" />
            Prakiraan
          </h2>

          <div className="relative min-h-[320px] rounded-[32px] border border-white/15 bg-white/[0.06] p-3 shadow-[0_30px_80px_-40px_rgba(34,211,238,0.3)] backdrop-blur-sm sm:p-6">
        <p className="sr-only" aria-live="polite">
          {status === "success" && place ? `Prakiraan PM2.5 untuk ${place.name} sudah dimuat.` : ""}
        </p>
        {status === "idle" && (
          <PlaceEmpty icon={<IconPulse className="h-10 w-10" />} title="Belum ada lokasi dipilih" onPick={choosePlace}>
            Tekan <strong>Gunakan Lokasiku</strong> atau cari nama kotamu di atas untuk melihat prakiraan PM2.5 72
            jam.
          </PlaceEmpty>
        )}
        {status === "loading" && <ForecastSkeleton />}
        {status === "error" && (
          <PlaceError
            title="Prakiraan belum bisa dimuat"
            text="Sepertinya ada gangguan sebentar. Periksa koneksi internetmu, lalu coba lagi."
            onRetry={retry}
          />
        )}
        {status === "success" && offline && data && (
          <OfflineNote updatedAt={data.generatedAt} timezone={data.timezone} className="mb-3" />
        )}
        {status === "success" && data && place && (
          <ForecastResult data={data} place={place} standard={standard} onStandardChange={setStandard} />
        )}
          </div>
        </div>
      </section>
    </>
  );
}