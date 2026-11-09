/**
 * Preferensi notifikasi dan aturan kapan notifikasi dikirim. Logika murni
 * (tanpa peramban) supaya mudah diuji. Pemanggilan API Notification ada di
 * hooks/useNotifications.ts.
 *
 * Notifikasi di sini bersifat lokal: dibuat oleh halaman yang sedang terbuka
 * setelah pengguna mengizinkan. Tidak ada server yang menyimpan data langganan,
 * jadi tidak ada notifikasi saat UdaraKu tertutup sepenuhnya.
 */
import { ALERT_LEVELS } from "./alert";
import { getStorage } from "./risk-storage";
import type { StorageLike } from "./risk-storage";

export const NOTIFY_KEY = "udaraku:notifikasi:v1";
/** Peristiwa di window saat pengaturan notifikasi berubah (tombol di banner dan halaman ikut diperbarui). */
export const NOTIF_CHANGED_EVENT = "udaraku:notif-berubah";
/** Tingkat dan lokasi yang sama tidak diberi notifikasi lagi sebelum jeda ini. */
export const NOTIFY_MIN_GAP_MS = 6 * 60 * 60 * 1000;

export type NotifyPrefs = {
  v: 1;
  /** Pilihan pengguna di aplikasi (terpisah dari izin peramban). */
  enabled: boolean;
  /** Notifikasi terakhir: indeks tingkat, waktu (ms), dan kunci lokasi. null = belum ada / sudah direset. */
  lastLevel: number | null;
  lastAt: number | null;
  lastPlace: string | null;
};

export const DEFAULT_PREFS: NotifyPrefs = { v: 1, enabled: false, lastLevel: null, lastAt: null, lastPlace: null };

/** Kunci lokasi untuk pencegah duplikat: dibulatkan 1 desimal (±10 km) supaya lokasi berdekatan dianggap sama. */
export function placeKey(place: { lat: number; lon: number }): string {
  const r = (n: number) => {
    const s = n.toFixed(1);
    return s === "-0.0" ? "0.0" : s;
  };
  return `${r(place.lat)},${r(place.lon)}`;
}

/** Bersihkan data mentah dari penyimpanan; yang tidak sah kembali ke bawaan. */
export function sanitizePrefs(raw: unknown): NotifyPrefs {
  if (typeof raw !== "object" || raw === null) return { ...DEFAULT_PREFS };
  const r = raw as Record<string, unknown>;
  if (r.v !== 1 || typeof r.enabled !== "boolean") return { ...DEFAULT_PREFS };

  const level = r.lastLevel;
  const levelOk = typeof level === "number" && Number.isInteger(level) && level >= 0 && level < ALERT_LEVELS.length;
  if (!levelOk) return { ...DEFAULT_PREFS, enabled: r.enabled };

  return {
    v: 1,
    enabled: r.enabled,
    lastLevel: level,
    lastAt: typeof r.lastAt === "number" && Number.isFinite(r.lastAt) && r.lastAt >= 0 ? r.lastAt : null,
    lastPlace: typeof r.lastPlace === "string" && r.lastPlace.length <= 40 ? r.lastPlace : null,
  };
}

export function loadPrefs(storage: StorageLike | null = getStorage()): NotifyPrefs {
  try {
    const text = storage?.getItem(NOTIFY_KEY);
    return text ? sanitizePrefs(JSON.parse(text)) : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: NotifyPrefs, storage: StorageLike | null = getStorage()): boolean {
  try {
    if (!storage) return false;
    storage.setItem(NOTIFY_KEY, JSON.stringify(sanitizePrefs(prefs)));
    return true;
  } catch {
    return false;
  }
}

export function clearPrefs(storage: StorageLike | null = getStorage()): void {
  try {
    storage?.removeItem(NOTIFY_KEY);
  } catch {
    /* abaikan */
  }
}

/**
 * Apakah notifikasi boleh dikirim sekarang?
 * Ya bila: dinyalakan, ada peringatan (levelIndex ≥ 0), dan salah satu berlaku:
 * belum pernah / sudah direset (udara sempat bersih), lokasi berganti, tingkat naik,
 * atau jarak minimum (6 jam) sudah lewat. Selain itu tidak, supaya tidak mengganggu.
 */
export function shouldNotify(prefs: NotifyPrefs, levelIndex: number, key: string, now: number): boolean {
  if (!prefs.enabled || levelIndex < 0) return false;
  if (prefs.lastLevel === null || prefs.lastAt === null) return true;
  if (prefs.lastPlace !== key) return true;
  if (levelIndex > prefs.lastLevel) return true;
  return now - prefs.lastAt >= NOTIFY_MIN_GAP_MS;
}