"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import type { Place, Standard } from "@/lib/air-types";
import { computeAqi, getCategories, STANDARD_INFO } from "@/lib/aqi";
import { MIN_FIRE_ZOOM, roundBbox } from "@/lib/firms";
import type { FirePoint, FiresResponse } from "@/lib/firms";
import { formatNumber, formatUpdated } from "@/lib/format";
import { useAir } from "@/hooks/useAir";
import OfflineNote from "@/components/shared/OfflineNote";
import { useLocate } from "@/hooks/useLocate";
import LocationPicker from "@/components/air/LocationPicker";
import StandardToggle from "@/components/air/StandardToggle";
import Bokeh from "@/components/hero/Bokeh";
import PillButton from "@/components/ui/PillButton";
import { IconAlert, IconFlame, IconRefresh } from "@/components/ui/Icons";
import type { AirPin, MapBounds } from "./AirMap";

// Leaflet butuh `window`, jadi dimuat hanya di peramban (bukan saat render server).
const AirMap = dynamic(() => import("./AirMap"), {
  ssr: false,
  loading: () => <MapPlaceholder />,
});

function MapPlaceholder() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="grid h-full w-full animate-pulse place-items-center bg-white/[0.07] text-sm font-medium text-white/80 motion-reduce:animate-none"
    >
      Memuat peta…
    </div>
  );
}

type FireState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; response: FiresResponse }
  | { status: "error"; message: string };

type Props = {
  /** true bila FIRMS_MAP_KEY ada di server. Bila false, tombol titik panas disembunyikan. */
  firmsEnabled: boolean;
};

export default function PetaClient({ firmsEnabled }: Props) {
  const reduce = useReducedMotion() ?? false;
  const mapRef = useRef<HTMLDivElement>(null);

  const { place, status, data, offline, load, retry } = useAir();
  const { locating, geoError, locate, clearGeoError } = useLocate();
  const [standard, setStandard] = useState<Standard>("ispu");

  const [showFires, setShowFires] = useState(false);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [fireState, setFireState] = useState<FireState>({ status: "idle" });

  const choosePlace = useCallback(
    (target: Place) => {
      clearGeoError();
      void load(target);
      requestAnimationFrame(() => {
        mapRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      });
    },
    [load, clearGeoError, reduce],
  );

  /* ---------- Penanda udara ---------- */
  const aqi = useMemo(
    () => (data && !data.isMock ? computeAqi(standard, data.pollutants) : null),
    [data, standard],
  );
  const pm25 = data && !data.isMock ? data.pollutants.pm2_5 : null;

  const pin: AirPin | null = useMemo(() => {
    if (status !== "success" || !data || !place) return null;
    return {
      lat: place.lat,
      lon: place.lon,
      name: place.name,
      pm25,
      // Data contoh tidak diwarnai seolah-olah asli
      color: aqi ? aqi.category.color : "#94A3B8",
      ink: aqi ? aqi.category.ink : "#FFFFFF",
      category: aqi ? aqi.category.label : "Belum ada data",
      updated: data.isMock ? null : formatUpdated(data.updatedAt, data.timezone),
      isMock: data.isMock,
    };
  }, [status, data, place, aqi, pm25]);

  // Penanda tetap terpasang selama data lokasi baru dimuat: melepas lalu memasang ulang
  // penanda saat popup terbuka meninggalkan popup yatim di peta (perilaku Leaflet + React).
  // Penanda lama hanya berpindah ke lokasi baru begitu datanya siap.
  const lastPin = useRef<AirPin | null>(null);
  if (pin) lastPin.current = pin;
  const shownPin = pin ?? lastPin.current;

  /* ---------- Titik panas (opsional) ---------- */
  const bboxKey = useMemo(() => {
    if (!bounds || bounds.zoom < MIN_FIRE_ZOOM) return null;
    const b = roundBbox(bounds);
    return b ? `${b.west},${b.south},${b.east},${b.north}` : null;
  }, [bounds]);

  useEffect(() => {
    if (!firmsEnabled || !showFires || bboxKey === null) return;
    const [west, south, east, north] = bboxKey.split(",");
    const controller = new AbortController();
    setFireState((s) => (s.status === "ok" ? s : { status: "loading" }));

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/firms?west=${west}&south=${south}&east=${east}&north=${north}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        setFireState({ status: "ok", response: (await res.json()) as FiresResponse });
      } catch {
        if (controller.signal.aborted) return;
        setFireState({ status: "error", message: "Data titik panas belum bisa dimuat. Coba geser peta atau muat ulang." });
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [firmsEnabled, showFires, bboxKey]);

  const fires: FirePoint[] = fireState.status === "ok" ? fireState.response.fires : [];
  const tooWide = showFires && bounds !== null && bboxKey === null;

  const categories = getCategories(standard);

  return (
    <>
      {/* Hero gelap: judul + pencari lokasi */}
      <section id="peta" className="relative pb-16 pt-28 sm:pb-20 sm:pt-36">
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
            Peta{" "}
            <span className="bg-gradient-to-r from-cyan to-ungu bg-clip-text text-transparent">Kualitas Udara</span>
          </motion.h1>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
          >
            Lihat lokasimu di peta dengan warna sesuai kategori udara. Ketuk penandanya untuk melihat nilai PM2.5.
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

      {/* Panel peta: kaca gelap, selaras dengan beranda */}
      <section className="relative z-10 px-5 pb-24 sm:px-8 sm:pb-28 lg:px-12 xl:px-16">
        <div ref={mapRef} className="mx-auto max-w-[1560px] scroll-mt-24">
          <h2 className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan">
            <span className="h-px w-8 bg-cyan/70" aria-hidden="true" />
            Peta Udara
          </h2>

          <div className="space-y-4 rounded-[32px] border border-white/15 bg-white/[0.06] p-3 shadow-[0_30px_80px_-40px_rgba(34,211,238,0.3)] backdrop-blur-sm sm:space-y-5 sm:p-6">
          {/* Kontrol */}
          <div className="flex flex-col gap-3 px-1 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-white sm:text-2xl">
                {place && status !== "idle" ? place.name : "Indonesia"}
              </h3>
              <p className="text-sm text-white/75" aria-live="polite">
                {status === "idle" && "Pilih lokasi di atas untuk memasang penanda udara."}
                {status === "loading" && "Memuat data udara…"}
                {status === "success" && place?.subtitle}
                {status === "error" && "Data udara belum bisa dimuat."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StandardToggle value={standard} onChange={setStandard} tone="dark" />
              {firmsEnabled && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={showFires}
                  onClick={() => setShowFires((v) => !v)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-heading text-xs font-bold tracking-wide ring-1 transition-colors sm:text-sm ${
                    showFires
                      ? "bg-orange-500 text-white ring-orange-300 shadow-[0_0_24px_-4px_rgba(249,115,22,0.7)]"
                      : "bg-white/10 text-white ring-white/25 hover:bg-white/20"
                  }`}
                >
                  <IconFlame className="h-4 w-4" />
                  Titik panas {showFires ? "aktif" : "mati"}
                </button>
              )}
            </div>
          </div>

          {status === "error" && (
            <div
              role="alert"
              className="flex flex-col items-start gap-3 rounded-2xl bg-orange-400/10 p-4 ring-1 ring-orange-300/50 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="flex items-start gap-2 text-sm font-medium text-white">
                <IconAlert className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
                Data udara belum bisa dimuat. Periksa koneksi internetmu, lalu coba lagi.
              </p>
              <PillButton onClick={retry} showArrow={false} className="!px-5 !py-2.5">
                <IconRefresh className="h-4 w-4" />
                COBA LAGI
              </PillButton>
            </div>
          )}

          {status === "success" && offline && data && (
            <OfflineNote updatedAt={data.updatedAt} timezone={data.timezone} />
          )}

          {status === "success" && data?.isMock && (
            <p role="status" className="rounded-2xl bg-yellow-300/10 px-4 py-3 text-sm text-white ring-1 ring-yellow-300/60">
              <strong>Ini data contoh, bukan data asli.</strong> Data udara sungguhan sedang tidak bisa diambil, jadi
              penanda berwarna abu-abu.
            </p>
          )}

          {/* Peta. `isolate` menjaga lapisan Leaflet (z-index tinggi) tetap di bawah navbar. */}
          <div
            role="region"
            aria-label="Peta kualitas udara"
            className="relative isolate h-[460px] overflow-hidden rounded-3xl ring-1 ring-white/20 shadow-[0_0_60px_-20px_rgba(34,211,238,0.35)] sm:h-[560px] lg:h-[680px] xl:h-[720px]"
          >
            <AirMap
              pin={shownPin}
              fires={fires}
              showFires={firmsEnabled && showFires}
              reduceMotion={reduce}
              onBoundsChange={setBounds}
            />

            {firmsEnabled && showFires && (
              <p
                role="status"
                className="pointer-events-none absolute left-3 top-3 z-[500] max-w-[calc(100%-1.5rem)] rounded-full bg-[#081238]/90 px-3.5 py-1.5 text-xs font-semibold text-white shadow-card ring-1 ring-white/20 backdrop-blur"
              >
                {tooWide
                  ? "Perbesar peta (zoom in) untuk melihat titik panas."
                  : fireState.status === "loading"
                    ? "Memuat titik panas…"
                    : fireState.status === "error"
                      ? fireState.message
                      : fireState.status === "ok"
                        ? `${formatNumber(fireState.response.fires.length, 0)} titik panas dalam ±24 jam terakhir${
                            fireState.response.truncated ? " (sebagian terkuat)" : ""
                          }`
                        : ""}
              </p>
            )}
          </div>

          {/* Legenda */}
          <section aria-label="Keterangan warna penanda" className="rounded-3xl bg-white/[0.07] p-4 ring-1 ring-white/10 sm:p-5">
            <h4 className="font-heading text-sm font-bold text-white">Warna penanda ({STANDARD_INFO[standard].name})</h4>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {categories.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-xs text-white/85">
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 rounded-full ring-1 ring-white/40"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="font-semibold">{c.label}</span>
                  <span className="text-white/75">
                    {c.min}–{c.max}
                  </span>
                </li>
              ))}
              {firmsEnabled && (
                <li className="flex items-center gap-2 text-xs text-white/85">
                  <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full bg-orange-500 ring-2 ring-red-900/60" />
                  <span className="font-semibold">Titik panas</span>
                </li>
              )}
            </ul>
            <p className="mt-3 text-xs text-white/75">
              Warna penanda mengikuti indeks keseluruhan semua polutan, sedangkan angka di dalamnya adalah PM2.5
              (µg/m³).
            </p>
          </section>

          {/* Ringkasan teks sebagai alternatif peta (pembaca layar dan layar kecil) */}
          {status === "success" && data && place && !data.isMock && (
            <p className="rounded-2xl bg-white/[0.07] px-4 py-3 text-sm text-white ring-1 ring-white/10" data-testid="ringkasan-peta">
              <strong>{place.name}</strong>: PM2.5{" "}
              {pm25 === null ? "tidak tersedia" : `${formatNumber(pm25, 1)} µg/m³`}
              {aqi && (
                <>
                  , {STANDARD_INFO[standard].name} {aqi.value} ({aqi.category.label})
                </>
              )}
              . Sumber: {data.source}.
            </p>
          )}

          {firmsEnabled && (
            <p className="px-1 text-xs text-white/75">
              Titik panas dari NASA FIRMS (satelit VIIRS) menunjukkan area bersuhu tinggi, bukan kepastian kebakaran,
              dan datanya bisa tertunda beberapa jam.
            </p>
          )}
          </div>
        </div>
      </section>
    </>
  );
}