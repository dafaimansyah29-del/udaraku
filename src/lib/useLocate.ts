"use client";

import { useCallback, useState } from "react";
import type { Place } from "@/lib/air-types";

const GEO_MESSAGES: Record<number, string> = {
  1: "Izin lokasi ditolak. Kamu bisa mencari nama kotamu di kolom pencarian.",
  2: "Lokasimu belum bisa ditemukan. Coba cari nama kotamu di kolom pencarian.",
  3: "Mencari lokasi terlalu lama. Coba lagi, atau cari nama kotamu.",
};

/**
 * Deteksi lokasi lewat Geolocation peramban.
 * `locate(onPlace)` memanggil onPlace bila berhasil, atau mengisi `geoError` bila gagal.
 */
export function useLocate() {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const clearGeoError = useCallback(() => setGeoError(null), []);

  const locate = useCallback((onPlace: (place: Place) => void) => {
    setGeoError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Peramban ini tidak mendukung deteksi lokasi. Cari nama kotamu di kolom pencarian.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        onPlace({
          name: "Lokasimu saat ini",
          subtitle: `Koordinat ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
          lat: latitude,
          lon: longitude,
        });
      },
      (err) => {
        setLocating(false);
        setGeoError(GEO_MESSAGES[err.code] ?? GEO_MESSAGES[2]);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  return { locating, geoError, locate, clearGeoError };
}