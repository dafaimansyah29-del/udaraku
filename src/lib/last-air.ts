/**
 * Data udara terakhir yang berhasil dimuat, disimpan di localStorage perangkat.
 * Dipakai untuk (1) banner peringatan di semua halaman, (2) halaman /offline.html,
 * dan (3) menampilkan data tersimpan dengan label "Data offline" saat tidak ada koneksi.
 *
 * Prinsip minimal: yang disimpan HANYA lokasi pilihan pengguna, PM2.5, dan waktu
 * data. Polutan lain, cuaca, dan teks sumber tidak ikut. Tidak dikirim ke server
 * mana pun. Data contoh (isMock) TIDAK pernah disimpan. Semua akses dibungkus
 * try/catch karena localStorage bisa tidak tersedia, dan isinya tidak dipercaya
 * (bisa diubah siapa saja), jadi selalu dibersihkan lewat sanitizeSnapshot.
 */
import type { AirResponse, Place } from "./air-types";
import { getStorage } from "./risk-storage";
import type { StorageLike } from "./risk-storage";

export type { StorageLike };

export const LAST_AIR_KEY = "udaraku:udara-terakhir:v1";
/** Peristiwa di window saat snapshot berubah, supaya banner ikut diperbarui di tab yang sama. */
export const LAST_AIR_EVENT = "udaraku:udara-berubah";
const SNAPSHOT_VERSION = 1;

export type AirSnapshot = {
  v: 1;
  place: Place;
  /** PM2.5 (µg/m³); null bila model tidak punya nilai untuk lokasi itu. */
  pm25: number | null;
  /** Waktu data dari sumber (ISO 8601, UTC) dan zona waktu lokasi. */
  updatedAt: string;
  timezone: string;
  /** Kapan disimpan di perangkat ini (ISO 8601). */
  savedAt: string;
};

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const validDate = (v: unknown): v is string => typeof v === "string" && !Number.isNaN(Date.parse(v));

/** Dua lokasi dianggap sama bila berjarak kurang dari ±1 km (pembulatan 2 desimal di /api/air). */
export function samePlace(a: Pick<Place, "lat" | "lon">, b: Pick<Place, "lat" | "lon">): boolean {
  return Math.abs(a.lat - b.lat) < 0.011 && Math.abs(a.lon - b.lon) < 0.011;
}

/**
 * Bersihkan data mentah dari penyimpanan. Hanya field yang dikenal dan valid yang
 * dipakai; field tambahan dibuang. Hasilnya null bila ada yang tidak sah.
 */
export function sanitizeSnapshot(raw: unknown): AirSnapshot | null {
  if (!isObject(raw) || raw.v !== SNAPSHOT_VERSION || !isObject(raw.place)) return null;
  const p = raw.place;

  if (typeof p.name !== "string" || p.name.length === 0 || p.name.length > 120) return null;
  if (!finite(p.lat) || !finite(p.lon) || Math.abs(p.lat) > 90 || Math.abs(p.lon) > 180) return null;
  const subtitle = typeof p.subtitle === "string" && p.subtitle.length <= 160 ? p.subtitle : undefined;

  const pm25 = raw.pm25 === null ? null : finite(raw.pm25) && raw.pm25 >= 0 ? raw.pm25 : undefined;
  if (pm25 === undefined) return null;
  if (!validDate(raw.updatedAt)) return null;
  if (typeof raw.timezone !== "string" || raw.timezone.length === 0 || raw.timezone.length > 64) return null;

  const updatedAt = new Date(raw.updatedAt).toISOString();
  return {
    v: SNAPSHOT_VERSION,
    place: { name: p.name, subtitle, lat: p.lat, lon: p.lon },
    pm25,
    updatedAt,
    timezone: raw.timezone,
    savedAt: validDate(raw.savedAt) ? new Date(raw.savedAt).toISOString() : updatedAt,
  };
}

/** Buat snapshot dari hasil /api/air. null untuk data contoh atau data yang tidak sah. */
export function snapshotFromAir(place: Place, air: AirResponse, now: Date = new Date()): AirSnapshot | null {
  if (air.isMock) return null;
  return sanitizeSnapshot({
    v: SNAPSHOT_VERSION,
    place,
    pm25: air.pollutants?.pm2_5 ?? null,
    updatedAt: air.updatedAt,
    timezone: air.timezone,
    savedAt: now.toISOString(),
  });
}

/**
 * Bentuk respons udara dari snapshot, untuk ditampilkan saat offline.
 * Hanya PM2.5 yang terisi; polutan lain dan cuaca kosong (tidak disimpan).
 */
export function airFromSnapshot(snap: AirSnapshot): AirResponse {
  return {
    location: { lat: snap.place.lat, lon: snap.place.lon },
    updatedAt: snap.updatedAt,
    timezone: snap.timezone,
    pollutants: { pm2_5: snap.pm25, pm10: null, no2: null, o3: null, so2: null, co: null },
    weather: { temperature: null, humidity: null },
    source: "Open-Meteo Air Quality (model CAMS), tersimpan di perangkat",
    isMock: false,
  };
}

export function loadSnapshot(storage: StorageLike | null = getStorage()): AirSnapshot | null {
  try {
    const text = storage?.getItem(LAST_AIR_KEY);
    return text ? sanitizeSnapshot(JSON.parse(text)) : null;
  } catch {
    return null;
  }
}

function announce() {
  try {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(LAST_AIR_EVENT));
  } catch {
    /* tidak penting */
  }
}

/** Simpan snapshot. false bila tidak sah atau penyimpanan tidak bisa dipakai. */
export function saveSnapshot(snap: AirSnapshot, storage: StorageLike | null = getStorage()): boolean {
  const clean = sanitizeSnapshot(snap);
  if (!clean || !storage) return false;
  try {
    storage.setItem(LAST_AIR_KEY, JSON.stringify(clean));
  } catch {
    return false;
  }
  announce();
  return true;
}

export function clearSnapshot(storage: StorageLike | null = getStorage()): void {
  try {
    storage?.removeItem(LAST_AIR_KEY);
  } catch {
    /* abaikan */
  }
  announce();
}

/**
 * Umur snapshot dalam menit sejak DISIMPAN di perangkat ini. Tidak pernah negatif
 * (jam perangkat bisa mundur); waktu simpan yang rusak dianggap sangat tua.
 */
export function ageMinutes(snap: Pick<AirSnapshot, "savedAt">, now: number = Date.now()): number {
  const saved = Date.parse(snap.savedAt);
  return Number.isNaN(saved) ? Number.POSITIVE_INFINITY : Math.max(0, (now - saved) / 60_000);
}