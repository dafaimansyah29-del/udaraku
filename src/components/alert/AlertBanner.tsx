"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { alertForPm25 } from "@/lib/alert";
import { round2 } from "@/lib/coords";
import { formatNumber, formatUpdated } from "@/lib/format";
import {
  LAST_AIR_EVENT,
  ageMinutes,
  loadSnapshot,
  saveSnapshot,
  snapshotFromAir,
} from "@/lib/last-air";
import type { AirSnapshot } from "@/lib/last-air";
import { ALERT_DISMISS_KEY } from "@/lib/local-data";
import { loadPrefs, placeKey, savePrefs, shouldNotify } from "@/lib/notify";
import type { AirResponse } from "@/lib/air-types";
import { WHO_PM25_24H } from "@/lib/risk-config";
import { useNotifications, showLocalNotification } from "@/hooks/useNotifications";
import { IconAlert, IconClose } from "@/components/ui/Icons";
import NotificationButton from "./NotificationButton";

/** Data lebih tua dari ini dicoba diperbarui (bila online) dan diberi label offline bila gagal. */
const STALE_MINUTES = 60;

/** Perbarui snapshot dari /api/air untuk lokasi tersimpan. true bila berhasil. */
async function refreshSnapshot(snap: AirSnapshot): Promise<boolean> {
  try {
    const res = await fetch(`/api/air?lat=${round2(snap.place.lat)}&lon=${round2(snap.place.lon)}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok || res.headers.get("x-udaraku-offline") === "1") return false;
    const next = snapshotFromAir(snap.place, (await res.json()) as AirResponse);
    return next ? saveSnapshot(next) : false;
  } catch {
    return false;
  }
}

function readDismissed(): number {
  try {
    // Number(null) = 0, jadi kunci yang belum ada HARUS ditangani lebih dulu; kalau tidak,
    // tingkat paling ringan (indeks 0) selalu dianggap sudah ditutup.
    const raw = window.sessionStorage.getItem(ALERT_DISMISS_KEY);
    if (raw === null || raw.trim() === "") return -1;
    const v = Number(raw);
    return Number.isInteger(v) && v >= 0 ? v : -1;
  } catch {
    return -1;
  }
}

/**
 * Banner peringatan di bagian atas semua halaman. Tampil bila PM2.5 lokasi terakhir
 * yang kamu pilih melewati batas harian WHO (15 µg/m³). Warna mengikuti tingkat keparahan.
 *
 * Banner memakai data yang sudah ada di perangkat (lokasi terakhir). Bila data lebih tua
 * dari 1 jam dan perangkat online, banner memperbaruinya lewat /api/air; bila gagal atau
 * offline, banner tetap tampil dengan label "Data offline, terakhir diperbarui ...".
 */
export default function AlertBanner() {
  const barRef = useRef<HTMLElement>(null);
  const [snapshot, setSnapshot] = useState<AirSnapshot | null>(null);
  // Label offline: perangkat memang offline, ATAU data basi dan pembaruan sudah dicoba tetapi gagal.
  const [offlineNow, setOfflineNow] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [dismissed, setDismissed] = useState(-1);
  const notif = useNotifications();

  const read = useCallback(() => {
    setSnapshot(loadSnapshot());
    setOfflineNow(navigator.onLine === false);
  }, []);

  // Muat snapshot, ikuti perubahan (halaman lain menyimpan data baru), lalu coba perbarui bila basi.
  useEffect(() => {
    setDismissed(readDismissed());
    read();
    window.addEventListener(LAST_AIR_EVENT, read);
    window.addEventListener("storage", read);

    let cancelled = false;
    const refreshIfStale = async () => {
      const snap = loadSnapshot();
      if (!snap || ageMinutes(snap) <= STALE_MINUTES || navigator.onLine === false) return;
      const ok = await refreshSnapshot(snap);
      if (cancelled) return;
      setRefreshFailed(!ok);
      if (ok) read();
    };
    void refreshIfStale();
    window.addEventListener("online", refreshIfStale);
    window.addEventListener("online", read);
    window.addEventListener("offline", read);
    return () => {
      cancelled = true;
      window.removeEventListener(LAST_AIR_EVENT, read);
      window.removeEventListener("storage", read);
      window.removeEventListener("online", refreshIfStale);
      window.removeEventListener("online", read);
      window.removeEventListener("offline", read);
    };
  }, [read]);

  const result = snapshot ? alertForPm25(snapshot.pm25) : null;
  const visible = result !== null && dismissed < result.index;

  // Notifikasi lokal (hanya bila pengguna sudah menyalakannya) dengan aturan anti-spam.
  const levelIndex = result?.index ?? null;
  const pm = result?.pm25 ?? null;
  const placeName = snapshot?.place.name ?? "";
  const key = snapshot ? placeKey(snapshot.place) : "";
  useEffect(() => {
    if (!snapshot || !notif.enabled) return;
    const prefs = loadPrefs();
    if (levelIndex === null) {
      // Udara sudah bersih: reset supaya peringatan berikutnya langsung diberitahukan.
      if (prefs.lastLevel !== null) savePrefs({ ...prefs, lastLevel: null, lastAt: null });
      return;
    }
    const now = Date.now();
    if (!shouldNotify(prefs, levelIndex, key, now)) return;
    const r = alertForPm25(pm);
    if (!r) return;
    void showLocalNotification({
      title: `${r.level.label}: PM2.5 ${formatNumber(r.pm25, 1)} µg/m³`,
      body: `${placeName}: ${formatNumber(r.ratio, 1)}× batas harian WHO. ${r.level.advice}`,
      tag: "udaraku-peringatan",
    }).then((ok) => {
      if (ok) savePrefs({ ...loadPrefs(), lastLevel: levelIndex, lastAt: now, lastPlace: key });
    });
    // snapshot sengaja tidak jadi dependensi: yang berubah bermakna adalah tingkat, nilai, dan lokasi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notif.enabled, levelIndex, pm, key, placeName]);

  // Beri tahu tata letak (navbar & isi halaman bergeser sebesar tinggi banner).
  useEffect(() => {
    const root = document.documentElement;
    const bar = barRef.current;
    if (!visible || !bar) {
      root.removeAttribute("data-alert");
      root.style.removeProperty("--alert-h");
      return;
    }
    const apply = () => root.style.setProperty("--alert-h", `${bar.offsetHeight}px`);
    root.setAttribute("data-alert", "true");
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(bar);
    return () => {
      ro.disconnect();
      root.removeAttribute("data-alert");
      root.style.removeProperty("--alert-h");
    };
  }, [visible]);

  if (!snapshot || !result || !visible) return null;
  const { level } = result;
  const showOffline = offlineNow || (refreshFailed && ageMinutes(snapshot) > STALE_MINUTES);

  return (
    <section
      ref={barRef}
      role="region"
      aria-label="Peringatan kualitas udara"
      aria-live="polite"
      data-testid="banner-peringatan"
      data-level={level.id}
      className="fixed inset-x-0 top-0 z-[60] shadow-glass"
      style={{ backgroundColor: level.color, color: level.ink }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
        <p className="flex min-w-0 flex-1 items-start gap-2.5 text-sm leading-snug">
          <IconAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>
            <strong>{level.label}.</strong> PM2.5 di {snapshot.place.name} {formatNumber(result.pm25, 1)} µg/m³,{" "}
            {formatNumber(result.ratio, 1)}× batas harian WHO ({WHO_PM25_24H} µg/m³). {level.advice}
            {showOffline && (
              <span className="mt-0.5 block text-xs font-semibold" data-testid="banner-offline">
                Data offline, terakhir diperbarui {formatUpdated(snapshot.updatedAt, snapshot.timezone)}.
              </span>
            )}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-3 pl-7 sm:pl-0">
          <NotificationButton tone="banner" />
          <Link href="/cek-udara" className="inline-flex min-h-9 items-center text-xs font-bold underline underline-offset-2 sm:text-sm">
            Lihat detail
          </Link>
          <button
            type="button"
            aria-label="Tutup peringatan"
            onClick={() => {
              try {
                window.sessionStorage.setItem(ALERT_DISMISS_KEY, String(result.index));
              } catch {
                /* abaikan */
              }
              setDismissed(result.index);
            }}
            className="ml-auto grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-black/10 sm:ml-0"
          >
            <IconClose className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}