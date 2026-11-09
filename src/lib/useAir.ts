"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AirResponse, Place } from "@/lib/air-types";
import { round2 } from "@/lib/coords";
import { airFromSnapshot, loadSnapshot, samePlace, saveSnapshot, snapshotFromAir } from "@/lib/last-air";

export type AirStatus = "idle" | "loading" | "success" | "error";

/** Header yang ditambahkan service worker bila jawaban diambil dari cache karena jaringan putus. */
export const OFFLINE_HEADER = "x-udaraku-offline";

/**
 * Mengambil data udara dari /api/air untuk lokasi yang dipilih.
 * Permintaan lama dibatalkan bila lokasi baru dipilih sebelum selesai.
 *
 * Data offline (`offline: true`) datang dari dua tempat, berurutan:
 *  1. cache service worker untuk lokasi yang sama persis, atau
 *  2. snapshot PM2.5 terakhir di localStorage, bila lokasinya sama (±1 km).
 * Hanya kegagalan JARINGAN yang memakai data tersimpan; galat dari server tetap ditampilkan sebagai galat.
 * Data yang berhasil dimuat (bukan data contoh) disimpan sebagai snapshot terakhir.
 */
export function useAir() {
  const abortRef = useRef<AbortController | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [status, setStatus] = useState<AirStatus>("idle");
  const [data, setData] = useState<AirResponse | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => () => abortRef.current?.abort(), []);

  const load = useCallback(async (target: Place) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPlace(target);
    setStatus("loading");
    try {
      // Dibulatkan seperti di server (±1 km) supaya alamat permintaan, dan cache offline, stabil
      // walau koordinat dari Geolocation berubah sedikit tiap kali.
      const res = await fetch(`/api/air?lat=${round2(target.lat)}&lon=${round2(target.lon)}`, {
        signal: controller.signal,
      });
      // Service worker offline tanpa salinan = sama dengan jaringan putus, bukan galat server.
      if (!res.ok) {
        throw res.headers.get(OFFLINE_HEADER) === "miss" ? new Error("offline") : new HttpError(res.status);
      }
      const json = (await res.json()) as AirResponse;
      const fromCache = res.headers.get(OFFLINE_HEADER) === "1";
      if (!fromCache) {
        const snap = snapshotFromAir(target, json);
        if (snap) saveSnapshot(snap);
      }
      setData(json);
      setOffline(fromCache);
      setStatus("success");
    } catch (err) {
      if (controller.signal.aborted) return; // diganti permintaan yang lebih baru
      // Jaringan putus dan tidak ada salinan di cache: coba snapshot terakhir untuk lokasi yang sama.
      if (!(err instanceof HttpError)) {
        const snap = loadSnapshot();
        if (snap && samePlace(snap.place, target)) {
          setData(airFromSnapshot(snap));
          setOffline(true);
          setStatus("success");
          return;
        }
      }
      setStatus("error");
    }
  }, []);

  const retry = useCallback(() => {
    if (place) void load(place);
  }, [place, load]);

  return { place, status, data, offline, load, retry };
}

class HttpError extends Error {
  constructor(public readonly code: number) {
    super(`Status ${code}`);
  }
}