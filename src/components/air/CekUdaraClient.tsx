"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Place, Standard } from "@/lib/air-types";
import { computeAqi } from "@/lib/aqi";
import { useAir } from "@/hooks/useAir";
import OfflineNote from "@/components/shared/OfflineNote";
import { useLocate } from "@/hooks/useLocate";
import Bokeh from "@/components/hero/Bokeh";
import AirResult from "./AirResult";
import { AirEmpty, AirError, AirSkeleton } from "./AirStates";
import LocationPicker from "./LocationPicker";

export default function CekUdaraClient() {
  const reduce = useReducedMotion();
  const resultRef = useRef<HTMLDivElement>(null);

  const { place, status, data, offline, load, retry } = useAir();
  const { locating, geoError, locate, clearGeoError } = useLocate();
  const [standard, setStandard] = useState<Standard>("ispu");

  /** Pilih lokasi lalu gulir ke hasil (berguna di layar kecil). */
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

  // Teks ringkas untuk pembaca layar saat hasil berubah
  const summary =
    status === "success" && data && place
      ? (() => {
          const r = computeAqi(standard, data.pollutants);
          return r ? `Kualitas udara di ${place.name}: indeks ${r.value}, ${r.category.label}.` : "";
        })()
      : "";

  return (
    <>
      {/* Hero gelap: judul + pencari lokasi */}
      <section id="cek-udara" className="relative pb-16 pt-28 sm:pb-20 sm:pt-36">
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
            Cek{" "}
            <span className="bg-gradient-to-r from-cyan to-ungu bg-clip-text text-transparent">
              Kualitas Udara
            </span>
          </motion.h1>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
          >
            Cari kotamu atau pakai lokasi saat ini. Angka polusi kami ubah jadi saran yang mudah
            dipahami.
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
            Kualitas Udara
          </h2>

          <div className="relative min-h-[320px] rounded-[32px] border border-white/15 bg-white/[0.06] p-3 shadow-[0_30px_80px_-40px_rgba(34,211,238,0.3)] backdrop-blur-sm sm:p-6">
            <p className="sr-only" aria-live="polite">
              {summary}
            </p>

            {status === "idle" && <AirEmpty onPick={choosePlace} />}
            {status === "loading" && <AirSkeleton />}
            {status === "error" && <AirError onRetry={retry} />}
            {status === "success" && offline && data && (
              <OfflineNote updatedAt={data.updatedAt} timezone={data.timezone} className="mb-3" />
            )}
            {status === "success" && data && place && (
              <AirResult
                data={data}
                place={place}
                standard={standard}
                onStandardChange={setStandard}
                onRetry={retry}
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}