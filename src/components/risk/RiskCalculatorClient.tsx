"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Place } from "@/lib/air-types";
import { formatNumber, formatUpdated } from "@/lib/format";
import { QUICK_CITIES } from "@/lib/quick-cities";
import { calculateRisk, validateForm } from "@/lib/risk";
import type { FormValues } from "@/lib/risk";
import { WHO_PM25_24H } from "@/lib/risk-config";
import { clearForm, DEFAULT_FORM, loadForm, saveForm } from "@/lib/risk-storage";
import { useAir } from "@/hooks/useAir";
import OfflineNote from "@/components/shared/OfflineNote";
import { useLocate } from "@/hooks/useLocate";
import Bokeh from "@/components/hero/Bokeh";
import LocationPicker from "@/components/air/LocationPicker";
import { IconAlert, IconInfo, IconLungs, IconRefresh, IconTrash } from "@/components/ui/Icons";
import ProfileForm from "./ProfileForm";

// Laporan hasil (meter, saran, rumus) baru dimuat setelah hasil pertama muncul.
const RiskReport = dynamic(() => import("./RiskReport"), {
  loading: () => (
    <div
      role="status"
      aria-busy="true"
      className="h-72 animate-pulse rounded-3xl bg-white/[0.07] motion-reduce:animate-none"
    >
      <span className="sr-only">Memuat hasil…</span>
    </div>
  ),
});

const bar = "animate-pulse rounded-full bg-white/15 motion-reduce:animate-none";

export default function RiskCalculatorClient() {
  const reduce = useReducedMotion();
  const { place, status, data, offline, load, retry } = useAir();
  const { locating, geoError, locate, clearGeoError } = useLocate();

  const [form, setForm] = useState<FormValues>(DEFAULT_FORM);
  /** true setelah profil dimuat dari penyimpanan (agar bawaan tidak menimpa data tersimpan). */
  const [hydrated, setHydrated] = useState(false);
  /** true bila pengguna sudah mengubah sesuatu; hanya saat itu profil ditulis ke penyimpanan. */
  const [persist, setPersist] = useState(false);
  const [stored, setStored] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Muat profil tersimpan sekali saat halaman dibuka
  useEffect(() => {
    const saved = loadForm();
    if (saved) {
      setForm(saved);
      setStored(true);
    }
    setHydrated(true);
  }, []);

  // Simpan setiap perubahan (hanya setelah dimuat dan setelah pengguna mengubah sesuatu)
  useEffect(() => {
    if (!hydrated || !persist) return;
    const ok = saveForm(form);
    setStored(ok);
    setStorageFailed(!ok);
  }, [form, hydrated, persist]);

  const updateForm = useCallback((patch: Partial<FormValues>) => {
    setNotice(null);
    setPersist(true);
    setForm((f) => ({ ...f, ...patch }));
  }, []);

  const handleClear = useCallback(() => {
    const ok = clearForm();
    setForm(DEFAULT_FORM);
    setPersist(false); // jangan langsung menyimpan bawaan lagi
    setStored(false);
    setStorageFailed(false);
    setNotice(
      ok
        ? "Data profilmu sudah dihapus dari perangkat ini."
        : "Isian sudah direset. Penyimpanan peramban tidak tersedia, jadi tidak ada data yang tersimpan.",
    );
  }, []);

  const choosePlace = useCallback(
    (target: Place) => {
      clearGeoError();
      void load(target);
    },
    [clearGeoError, load],
  );

  const validation = useMemo(() => validateForm(form), [form]);
  const pm25 = data?.pollutants.pm2_5 ?? null;
  const isMock = data?.isMock ?? false;

  // Data contoh (saat Open-Meteo gagal) angkanya karangan, jadi risiko TIDAK dihitung darinya.
  const calc = useMemo(() => {
    if (!validation.ok || pm25 === null || status !== "success" || isMock) return null;
    const input = {
      pm25,
      age: validation.age,
      conditions: form.conditions,
      activity: form.activity,
      durationMin: validation.durationMin,
      mask: form.mask,
    };
    return { input, result: calculateRisk(input) };
  }, [validation, pm25, status, isMock, form.conditions, form.activity, form.mask]);

  const announce = calc
    ? `Risiko ${calc.result.level.label}. Dosis sesi ini ${Math.round(calc.result.ratio * 100)} persen dari dosis harian WHO.`
    : "";

  return (
    <>
      {/* Hero gelap: judul + pencari lokasi */}
      <section id="kalkulator-risiko" className="relative pb-16 pt-28 sm:pb-20 sm:pt-36">
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
            Kalkulator{" "}
            <span className="bg-gradient-to-r from-cyan to-ungu bg-clip-text text-transparent">
              Risiko Personal
            </span>
          </motion.h1>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
          >
            Cari tahu seberapa besar polusi udara hari ini berisiko untuk napasmu, sesuai usia,
            kondisi kesehatan, dan rencana aktivitasmu.
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

      {/* Panel kalkulator: kaca gelap, selaras dengan beranda */}
      <section className="relative z-10 px-5 pb-24 sm:px-8 sm:pb-28 lg:px-12 xl:px-16">
        <div className="mx-auto max-w-[1560px] scroll-mt-24">
          <h2 className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan">
            <span className="h-px w-8 bg-cyan/70" aria-hidden="true" />
            Kalkulator Risiko
          </h2>

          <div className="relative space-y-5 rounded-[32px] border border-white/15 bg-white/[0.06] p-3 shadow-[0_30px_80px_-40px_rgba(34,211,238,0.3)] backdrop-blur-sm sm:space-y-6 sm:p-6">
            <p className="sr-only" aria-live="polite">
              {announce}
            </p>

            {status === "success" && offline && data && (
              <OfflineNote updatedAt={data.updatedAt} timezone={data.timezone} />
            )}

            {/* Status data udara (PM2.5 terkini) */}
            <AirStrip
              status={status}
              place={place}
              pm25={pm25}
              data={data}
              onPick={choosePlace}
              onRetry={retry}
            />

            {/* Formulir: 3 kolom di layar lebar supaya tidak memanjang */}
            <div>
              <ProfileForm
                form={form}
                errors={validation.ok ? {} : validation.errors}
                onChange={updateForm}
              />
            </div>

            <div className="space-y-5 lg:space-y-6">
              {/* Hasil */}
              <div>
                {calc ? (
                  <RiskReport input={calc.input} result={calc.result} />
                ) : (
                  <ResultPlaceholder
                    status={status}
                    formValid={validation.ok}
                    hasPm25={pm25 !== null}
                    isMock={isMock}
                  />
                )}
              </div>

              {/* Privasi */}
              <div>
                <section aria-labelledby="privasi-judul" className="rounded-3xl bg-white/[0.07] p-4 ring-1 ring-white/10 sm:p-6">
                  <h3 id="privasi-judul" className="font-heading text-base font-extrabold text-white">
                    Privasi datamu
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/80">
                    Profilmu disimpan hanya di peramban perangkat ini, tanpa akun dan tanpa dikirim ke
                    server. Yang dikirim hanya lokasi, supaya kami bisa mengambil data udara.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleClear}
                      className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-5 py-2.5 text-sm font-bold text-red-200 ring-1 ring-red-300/50 transition-colors hover:bg-red-500/25"
                    >
                      <IconTrash className="h-4 w-4" />
                      Hapus data saya
                    </button>
                    <span className="text-xs text-white/75">
                      {stored ? "Profil tersimpan di perangkat ini." : "Belum ada profil tersimpan."}
                    </span>
                  </div>
                  {storageFailed && (
                    <p role="status" className="mt-2 text-xs font-medium text-orange-300">
                      Penyimpanan peramban tidak tersedia (mungkin mode privat), jadi profil tidak akan
                      diingat.
                    </p>
                  )}
                  {notice && (
                    <p role="status" className="mt-2 text-sm font-semibold text-white">
                      {notice}
                    </p>
                  )}
                </section>
              </div>
            </div>

            {/* Disclaimer: selalu terlihat */}
            <aside
              aria-label="Pernyataan penting"
              className="flex gap-3 rounded-2xl bg-[#0B1E5B]/70 p-4 text-white ring-1 ring-cyan/30 sm:p-5"
            >
              <IconInfo className="mt-0.5 h-5 w-5 shrink-0 text-cyan" />
              <p className="text-sm leading-relaxed text-white/85">
                <strong className="text-base text-white">Edukasi, bukan diagnosis medis.</strong> Hasil ini
                perkiraan sederhana dari data udara dan profilmu. Bila kamu punya penyakit paru atau
                jantung, atau merasa sesak napas, ikuti anjuran dokter dan cari pertolongan medis.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */

function AirStrip({
  status,
  place,
  pm25,
  data,
  onPick,
  onRetry,
}: {
  status: ReturnType<typeof useAir>["status"];
  place: Place | null;
  pm25: number | null;
  data: ReturnType<typeof useAir>["data"];
  onPick: (p: Place) => void;
  onRetry: () => void;
}) {
  if (status === "idle") {
    return (
      <div className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10 sm:p-5">
        <p className="text-sm font-semibold text-white">
          Langkah pertama: pilih lokasimu di atas agar kami bisa mengambil PM2.5 terkini.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">Atau coba</span>
          {QUICK_CITIES.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => onPick(c)}
              className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-cyan hover:text-ink"
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div role="status" aria-busy="true" className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10 sm:p-5">
        <span className="sr-only">Mengambil PM2.5 terkini…</span>
        <div className={`${bar} h-4 w-64 max-w-full`} />
        <div className={`${bar} mt-3 h-3 w-48 max-w-full`} />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-2xl bg-orange-400/10 p-4 ring-1 ring-orange-300/50 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <p className="flex items-start gap-3 text-sm text-white">
          <IconAlert className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
          <span>
            <strong>Data udara belum bisa dimuat.</strong> Periksa koneksi internetmu, lalu coba lagi.
          </span>
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-white ring-1 ring-white/25 transition-colors hover:bg-cyan hover:text-ink"
        >
          <IconRefresh className="h-4 w-4" />
          Coba lagi
        </button>
      </div>
    );
  }

  // success
  if (!data || !place) return null;

  if (pm25 === null) {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-2xl bg-orange-400/10 p-4 text-sm text-white ring-1 ring-orange-300/50 sm:p-5">
        <IconAlert className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
        <span>
          <strong>Data PM2.5 untuk {place.name} belum tersedia.</strong> Coba lokasi lain di dekatnya.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.isMock && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl bg-yellow-300/10 p-4 text-sm text-white ring-1 ring-yellow-300/60">
          <IconAlert className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
          <span className="flex-1">
            <strong>Ini data contoh, bukan data asli.</strong> Data udara sungguhan sedang tidak bisa
            diambil, jadi risiko belum dihitung.
          </span>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white ring-1 ring-white/25 hover:bg-cyan hover:text-ink"
          >
            <IconRefresh className="h-3.5 w-3.5" />
            Coba lagi
          </button>
        </div>
      )}
      <div className="flex flex-col gap-3 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-biru to-ungu text-white">
            <IconLungs className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-white/75">
              PM2.5 di {place.name}
            </p>
            <p className="font-heading text-xl font-extrabold text-white">
              {formatNumber(pm25, 1)} <span className="text-sm font-semibold text-white/75">µg/m³</span>
              <span className="ml-2 text-sm font-semibold text-white/80">
                ({formatNumber(pm25 / WHO_PM25_24H, 1)}× batas WHO)
              </span>
            </p>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-white/75 sm:text-right">
          Sumber: {data.source}
          <br />
          Diperbarui <time dateTime={data.updatedAt}>{formatUpdated(data.updatedAt, data.timezone)}</time>
        </p>
      </div>
    </div>
  );
}

function ResultPlaceholder({
  status,
  formValid,
  hasPm25,
  isMock,
}: {
  status: ReturnType<typeof useAir>["status"];
  formValid: boolean;
  hasPm25: boolean;
  isMock: boolean;
}) {
  if (status === "loading") {
    return (
      <div role="status" aria-busy="true" className="space-y-4">
        <span className="sr-only">Menyiapkan hasil…</span>
        <div className="rounded-3xl bg-white/[0.07] p-6">
          <div className="mx-auto h-28 w-56 max-w-full animate-pulse rounded-t-full border-[18px] border-b-0 border-white/15 motion-reduce:animate-none" />
          <div className={`${bar} mx-auto mt-5 h-8 w-32`} />
          <div className={`${bar} mx-auto mt-3 h-4 w-48 max-w-full`} />
        </div>
        <div className="space-y-2.5 rounded-3xl bg-white/[0.05] p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${bar} h-16 !rounded-2xl`} />
          ))}
        </div>
      </div>
    );
  }

  let message = "Hasil risiko muncul di sini setelah kamu memilih lokasi.";
  if (status === "error") message = "Hasil muncul setelah data udara berhasil dimuat.";
  else if (status === "success" && isMock) message = "Risiko tidak dihitung dari data contoh. Tekan Coba lagi untuk mengambil data udara yang asli.";
  else if (status === "success" && !hasPm25) message = "Hasil belum bisa dihitung karena data PM2.5 belum tersedia.";
  else if (status === "success" && !formValid) message = "Lengkapi usia dan durasi dengan benar, lalu hasilnya akan muncul di sini.";

  return (
    <div className="grid h-full min-h-[240px] place-items-center rounded-3xl border-2 border-dashed border-white/25 p-8 text-center">
      <div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-biru to-ungu text-white shadow-glow">
          <IconLungs className="h-7 w-7" />
        </span>
        <p className="mx-auto mt-4 max-w-xs text-base font-semibold text-white/85">{message}</p>
      </div>
    </div>
  );
}