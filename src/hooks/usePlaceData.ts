"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Place } from "@/lib/air-types";

export type DataStatus = "idle" | "loading" | "success" | "error";

/**
 * Mengambil data JSON dari `endpoint?lat=..&lon=..` untuk lokasi yang dipilih.
 * Permintaan lama dibatalkan bila lokasi baru dipilih sebelum selesai.
 * Pola yang sama dengan useAir, tetapi bisa dipakai untuk endpoint mana pun.
 */
export function usePlaceData<T>(endpoint: string) {
  const abortRef = useRef<AbortController | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [status, setStatus] = useState<DataStatus>("idle");
  const [data, setData] = useState<T | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => () => abortRef.current?.abort(), []);

  const load = useCallback(
    async (target: Place) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setPlace(target);
      setStatus("loading");
      setOffline(false);
      try {
        const res = await fetch(`${endpoint}?lat=${target.lat}&lon=${target.lon}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = (await res.json()) as T;
        setData(json);
        setStatus("success");
        setOffline(!navigator.onLine);
      } catch {
        if (controller.signal.aborted) return;
        setStatus("error");
        setOffline(!navigator.onLine);
      }
    },
    [endpoint],
  );

  const retry = useCallback(() => {
    if (place) void load(place);
  }, [place, load]);

  return { place, status, data, offline, load, retry };
}