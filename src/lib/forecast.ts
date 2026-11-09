/**
 * Logika prakiraan PM2.5 per jam. Semua fungsi murni (tanpa jaringan)
 * supaya mudah diuji.
 *
 * Waktu memakai teks lokal tanpa zona ("2026-10-29T14:00"), persis seperti
 * yang dikirim Open-Meteo dengan timezone=auto. Jadi jam yang tampil selalu
 * jam di lokasi yang dipilih, bukan jam perangkat pengguna.
 */

export type ForecastPoint = {
  /** Waktu lokal lokasi, "YYYY-MM-DDTHH:00". */
  time: string;
  /** PM2.5 dalam µg/m³; null bila model tidak punya nilai untuk jam itu. */
  pm25: number | null;
};

/** Bentuk respons dari route handler /api/forecast. */
export type ForecastResponse = {
  location: { lat: number; lon: number };
  /** Zona waktu IANA lokasi, mis. "Asia/Jakarta". */
  timezone: string;
  /** Kapan respons dibuat (ISO 8601, UTC). */
  generatedAt: string;
  /** 72 titik per jam; titik pertama adalah jam saat ini. */
  points: ForecastPoint[];
  source: string;
};

export const FORECAST_HOURS = 72;
/** Jam terbaik dicari dalam 24 jam ke depan. */
export const BEST_WINDOW_HOURS = 24;
export const BEST_COUNT = 3;
/** Rentang "siang hari" untuk opsi filter (jam mulai dan jam akhir, inklusif). */
export const DAYTIME_START = 5;
export const DAYTIME_END = 21;

const pad = (n: number) => String(n).padStart(2, "0");

/** Jam lokal saat ini dalam format "YYYY-MM-DDTHH:00", dari waktu UTC dan selisih zona. */
export function localHourKey(nowMs: number, offsetSeconds: number): string {
  return `${new Date(nowMs + offsetSeconds * 1000).toISOString().slice(0, 13)}:00`;
}

/**
 * Ambil `count` titik per jam mulai dari jam saat ini.
 * Open-Meteo mengirim data sejak 00.00 hari ini, jadi jam yang sudah lewat dibuang.
 */
export function sliceFromNow(
  times: unknown,
  values: unknown,
  nowKey: string,
  count: number = FORECAST_HOURS,
): ForecastPoint[] {
  if (!Array.isArray(times) || !Array.isArray(values)) return [];
  const start = times.findIndex((t) => typeof t === "string" && t.slice(0, 16) >= nowKey);
  if (start < 0) return [];

  const out: ForecastPoint[] = [];
  for (let i = start; i < times.length && out.length < count; i++) {
    const t = times[i];
    if (typeof t !== "string") continue;
    const v = values[i];
    out.push({
      time: t.slice(0, 16),
      pm25: typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null,
    });
  }
  return out;
}

/* ---------------- Waktu ---------------- */

const TIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

function parseTime(time: string) {
  const m = TIME_RE.exec(time);
  if (!m) return null;
  return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]), h: Number(m[4]) };
}

/** Jam (0-23) dari teks waktu, NaN bila formatnya salah. */
export function hourOf(time: string): number {
  return parseTime(time)?.h ?? Number.NaN;
}

/** "14.00" */
export function formatHour(time: string): string {
  const h = hourOf(time);
  return Number.isNaN(h) ? "-" : `${pad(h)}.00`;
}

function dayNumber(time: string): number {
  const t = parseTime(time);
  return t ? Math.floor(Date.UTC(t.y, t.mo - 1, t.d) / 86_400_000) : Number.NaN;
}

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

/** Nama hari penuh, mis. "Jumat". */
export function dayName(time: string): string {
  const n = dayNumber(time);
  return Number.isNaN(n) ? "" : DAY_NAMES[new Date(n * 86_400_000).getUTCDay()];
}

/** "Hari ini", "Besok", "Lusa", lalu nama hari. */
export function dayLabel(time: string, nowKey: string): string {
  const diff = dayNumber(time) - dayNumber(nowKey);
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Besok";
  if (diff === 2) return "Lusa";
  return dayName(time);
}

/* ---------------- Jam terbaik ---------------- */

export type BestHour = { rank: number; time: string; pm25: number };

type BestOptions = {
  count?: number;
  windowHours?: number;
  /** Hanya jam 05.00 sampai 21.00. */
  daytimeOnly?: boolean;
};

/**
 * Jam dengan PM2.5 terendah dalam `windowHours` jam pertama.
 * Nilai yang sama (setelah dibulatkan ke 0,1) diurutkan dari jam yang paling awal.
 */
export function bestHours(points: readonly ForecastPoint[], options: BestOptions = {}): BestHour[] {
  const { count = BEST_COUNT, windowHours = BEST_WINDOW_HOURS, daytimeOnly = false } = options;

  return points
    .slice(0, windowHours)
    .map((p, order) => ({ ...p, order }))
    .filter(
      (p): p is { time: string; pm25: number; order: number } =>
        p.pm25 !== null &&
        (!daytimeOnly || (hourOf(p.time) >= DAYTIME_START && hourOf(p.time) <= DAYTIME_END)),
    )
    .sort((a, b) => Math.round(a.pm25 * 10) - Math.round(b.pm25 * 10) || a.order - b.order)
    .slice(0, count)
    .map((p, i) => ({ rank: i + 1, time: p.time, pm25: p.pm25 }));
}

/* ---------------- Ringkasan ---------------- */

export type ForecastSummary = {
  now: number | null;
  max: { time: string; pm25: number } | null;
  average: number | null;
};

export function summarize(points: readonly ForecastPoint[]): ForecastSummary {
  let max: ForecastSummary["max"] = null;
  let sum = 0;
  let n = 0;
  for (const p of points) {
    if (p.pm25 === null) continue;
    sum += p.pm25;
    n += 1;
    if (max === null || p.pm25 > max.pm25) max = { time: p.time, pm25: p.pm25 };
  }
  return { now: points[0]?.pm25 ?? null, max, average: n > 0 ? sum / n : null };
}

/** Pembulatan ke atas yang rapi untuk batas atas sumbu Y. */
export function niceCeil(value: number): number {
  const step = value <= 20 ? 5 : value <= 60 ? 10 : value <= 150 ? 25 : 50;
  return Math.max(step, Math.ceil(value / step) * step);
}