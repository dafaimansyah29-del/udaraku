/**
 * Perhitungan indeks kualitas udara: US AQI (EPA) dan ISPU Indonesia.
 *
 * Masukan semua fungsi adalah konsentrasi dalam µg/m³, persis seperti yang
 * dikembalikan Open-Meteo. Kadar gas diubah ke ppb/ppm di dalam fungsi US AQI.
 *
 * CATATAN PENTING
 * Standar resmi memakai rata-rata (PM: 24 jam, CO dan O3: 8 jam). Open-Meteo
 * hanya memberi nilai per jam, jadi angka di sini adalah PERKIRAAN dari kadar
 * saat ini. Bisa sedikit berbeda dari laporan resmi.
 */
import type { Concentrations, Pollutant, Standard } from "./air-types";
import { AQI_SCALE, POLLUTANTS } from "./constants";

export const POLLUTANT_KEYS = POLLUTANTS.KEYS;

/** [kadar bawah, kadar atas, indeks bawah, indeks atas] */
type Band = readonly [cLow: number, cHigh: number, iLow: number, iHigh: number];

/**
 * Ambang batas US AQI. Rumus EPA:
 *   I = (iHigh - iLow) / (cHigh - cLow) * (C - cLow) + iLow
 *
 * Satuan kadar: PM2.5 dan PM10 = µg/m³, O3/NO2/SO2 = ppb, CO = ppm.
 * Indeks: 0-50 Baik, 51-100 Sedang, 101-150 Sensitif, 151-200 Tidak Sehat,
 *         201-300 Sangat Tidak Sehat, 301-500 Berbahaya.
 *
 * - PM2.5 memakai revisi EPA Mei 2024 (batas "Baik" turun jadi 9,0 µg/m³).
 * - O3 memakai tabel rata-rata 8 jam. Di atas 200 ppb EPA beralih ke tabel
 *   1 jam, di sini disederhanakan (kadar setinggi itu sangat jarang).
 */
const US_BANDS: Record<Pollutant, readonly Band[]> = {
  pm2_5: [
    [0, 9.0, 0, 50],
    [9.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 125.4, 151, 200],
    [125.5, 225.4, 201, 300],
    [225.5, 325.4, 301, 400],
    [325.5, 500.4, 401, 500],
  ],
  pm10: [
    [0, 54, 0, 50],
    [55, 154, 51, 100],
    [155, 254, 101, 150],
    [255, 354, 151, 200],
    [355, 424, 201, 300],
    [425, 504, 301, 400],
    [505, 604, 401, 500],
  ],
  o3: [
    [0, 54, 0, 50],
    [55, 70, 51, 100],
    [71, 85, 101, 150],
    [86, 105, 151, 200],
    [106, 200, 201, 300],
    [201, 504, 301, 400],
    [505, 604, 401, 500],
  ],
  no2: [
    [0, 53, 0, 50],
    [54, 100, 51, 100],
    [101, 360, 101, 150],
    [361, 649, 151, 200],
    [650, 1249, 201, 300],
    [1250, 1649, 301, 400],
    [1650, 2049, 401, 500],
  ],
  so2: [
    [0, 35, 0, 50],
    [36, 75, 51, 100],
    [76, 185, 101, 150],
    [186, 304, 151, 200],
    [305, 604, 201, 300],
    [605, 804, 301, 400],
    [805, 1004, 401, 500],
  ],
  co: [
    [0, 4.4, 0, 50],
    [4.5, 9.4, 51, 100],
    [9.5, 12.4, 101, 150],
    [12.5, 15.4, 151, 200],
    [15.5, 30.4, 201, 300],
    [30.5, 40.4, 301, 400],
    [40.5, 50.4, 401, 500],
  ],
};

/** Massa molar (g/mol) untuk mengubah µg/m³ ke ppb. */
const MOLAR_MASS = { o3: 48.0, no2: 46.0055, so2: 64.066, co: 28.01 } as const;
/** Volume molar gas (liter/mol) pada 25 °C dan 1 atm, acuan EPA. */
const MOLAR_VOLUME = 24.45;

/** Hilangkan angka di belakang desimal tertentu (EPA memotong, bukan membulatkan). */
const truncate = (value: number, decimals: number) => {
  const f = 10 ** decimals;
  return Math.floor(value * f + 1e-9) / f;
};

/** µg/m³ -> satuan standar EPA, sudah dipotong sesuai aturan EPA. */
function toUsUnits(pollutant: Pollutant, ugm3: number): number {
  const v = Math.max(0, ugm3);
  switch (pollutant) {
    case "pm2_5":
      return truncate(v, 1);
    case "pm10":
      return truncate(v, 0);
    case "co": {
      const ppm = ((v * MOLAR_VOLUME) / MOLAR_MASS.co) / 1000;
      return truncate(ppm, 1);
    }
    default: {
      const ppb = (v * MOLAR_VOLUME) / MOLAR_MASS[pollutant];
      return truncate(ppb, 0);
    }
  }
}

function interpolate(bands: readonly Band[], c: number): number {
  for (const [cLow, cHigh, iLow, iHigh] of bands) {
    if (c <= cHigh) {
      return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (c - cLow) + iLow);
    }
  }
  return 500; // di atas ambang tertinggi
}

export function usSubIndex(pollutant: Pollutant, ugm3: number): number {
  return interpolate(US_BANDS[pollutant], toUsUnits(pollutant, ugm3));
}

/* ------------------------------------------------------------------ */
/* ISPU Indonesia                                                      */
/* ------------------------------------------------------------------ */

/** Nilai indeks pada tiap batas kategori ISPU. */
const ISPU_INDEX_STEPS = [50, 100, 200, 300, 500] as const;

/**
 * Batas atas kadar (µg/m³) untuk indeks 50, 100, 200, 300, 500.
 * Sumber: Permen LHK No. P.14/MENLHK/SETJEN/KUM.1/7/2020 tentang ISPU.
 *
 * Kategori: 0-50 Baik, 51-100 Sedang, 101-200 Tidak Sehat,
 *           201-300 Sangat Tidak Sehat, 301+ Berbahaya.
 *
 * Waktu rata-rata resmi: PM10, PM2.5, SO2 = 24 jam; CO = 8 jam; O3, NO2 = 1 jam.
 * Rumus ISPU (Xa/Xb = batas atas/bawah kadar, Ia/Ib = batas atas/bawah indeks):
 *   I = (Ia - Ib) / (Xa - Xb) * (Xx - Xb) + Ib
 */
const ISPU_LIMITS: Record<Pollutant, readonly [number, number, number, number, number]> = {
  pm10: [50, 150, 350, 420, 500],
  pm2_5: [15.5, 55.4, 150.4, 250.4, 500],
  so2: [52, 180, 400, 800, 1200],
  co: [4000, 8000, 15000, 30000, 45000],
  o3: [120, 235, 400, 800, 1000],
  no2: [80, 200, 1130, 2260, 3000],
};

export function ispuSubIndex(pollutant: Pollutant, ugm3: number): number {
  const x = Math.max(0, ugm3);
  const limits = ISPU_LIMITS[pollutant];
  let xb = 0;
  let ib = 0;
  for (let i = 0; i < limits.length; i++) {
    const xa = limits[i];
    const ia = ISPU_INDEX_STEPS[i];
    if (x <= xa) return Math.round(((ia - ib) / (xa - xb)) * (x - xb) + ib);
    xb = xa;
    ib = ia;
  }
  return 500;
}

/* ------------------------------------------------------------------ */
/* Kategori, warna, dan saran                                          */
/* ------------------------------------------------------------------ */

export type AqiCategory = {
  level: number;
  label: string;
  min: number;
  max: number;
  /** Warna utama kategori. */
  color: string;
  /** Warna teks yang terbaca di atas `color`. */
  ink: string;
  /** Satu kalimat saran dengan bahasa sederhana. */
  advice: string;
};

const NAVY = "#0B1E5B";

/** US AQI: 6 kategori (hijau, kuning, oranye, merah, ungu, maroon). */
const US_CATEGORIES: readonly AqiCategory[] = [
  { level: 0, label: "Baik", min: 0, max: 50, color: "#22C55E", ink: NAVY, advice: "Udara bersih dan aman. Silakan beraktivitas di luar rumah seperti biasa." },
  { level: 1, label: "Sedang", min: 51, max: 100, color: "#FACC15", ink: NAVY, advice: "Udara cukup baik. Orang yang sangat sensitif sebaiknya tidak terlalu lama di luar rumah." },
  { level: 2, label: "Tidak Sehat bagi Kelompok Sensitif", min: 101, max: 150, color: "#F97316", ink: NAVY, advice: "Anak-anak, lansia, dan penderita asma sebaiknya mengurangi aktivitas berat di luar rumah." },
  { level: 3, label: "Tidak Sehat", min: 151, max: 200, color: "#DC2626", ink: "#FFFFFF", advice: "Kurangi aktivitas di luar rumah dan pakai masker bila harus keluar." },
  { level: 4, label: "Sangat Tidak Sehat", min: 201, max: 300, color: "#7C3AED", ink: "#FFFFFF", advice: "Hindari aktivitas di luar rumah dan pakai masker N95 bila terpaksa keluar." },
  { level: 5, label: "Berbahaya", min: 301, max: 500, color: "#7F1D1D", ink: "#FFFFFF", advice: "Tetap di dalam ruangan dengan jendela tertutup. Udara berbahaya bagi semua orang." },
];

/**
 * ISPU: 5 kategori resmi. Warna dipetakan ke palet yang sama dengan US AQI
 * (hijau, kuning, oranye, merah, maroon) supaya tampilannya konsisten.
 */
const ISPU_CATEGORIES: readonly AqiCategory[] = [
  { level: 0, label: "Baik", min: 0, max: 50, color: "#22C55E", ink: NAVY, advice: "Udara bersih dan aman. Silakan beraktivitas di luar rumah seperti biasa." },
  { level: 1, label: "Sedang", min: 51, max: 100, color: "#FACC15", ink: NAVY, advice: "Udara masih bisa diterima. Orang yang sensitif sebaiknya tidak terlalu lama di luar rumah." },
  { level: 2, label: "Tidak Sehat", min: 101, max: 200, color: "#F97316", ink: NAVY, advice: "Mulai berdampak pada kesehatan. Kurangi aktivitas berat di luar dan pakai masker." },
  { level: 3, label: "Sangat Tidak Sehat", min: 201, max: 300, color: "#DC2626", ink: "#FFFFFF", advice: "Berbahaya bagi banyak orang. Hindari aktivitas di luar rumah dan pakai masker N95 bila harus keluar." },
  { level: 4, label: "Berbahaya", min: 301, max: 500, color: "#7F1D1D", ink: "#FFFFFF", advice: "Tetap di dalam ruangan dengan jendela tertutup. Udara sangat berbahaya bagi semua orang." },
];

export const STANDARD_INFO: Record<
  Standard,
  { name: string; fullName: string; scaleMax: number }
> = {
  us: { name: "US AQI", fullName: "Indeks Kualitas Udara Amerika Serikat (EPA)", scaleMax: AQI_SCALE.MAX_VALUE },
  ispu: { name: "ISPU", fullName: "Indeks Standar Pencemar Udara Indonesia", scaleMax: AQI_SCALE.MAX_VALUE },
};

export function getCategories(standard: Standard): readonly AqiCategory[] {
  return standard === "us" ? US_CATEGORIES : ISPU_CATEGORIES;
}

export function getCategory(standard: Standard, value: number): AqiCategory {
  const list = getCategories(standard);
  return list.find((c) => value <= c.max) ?? list[list.length - 1];
}

/* ------------------------------------------------------------------ */
/* Zona warna PM2.5 (untuk grafik prakiraan)                           */
/* ------------------------------------------------------------------ */

export type Pm25Zone = {
  category: AqiCategory;
  /** Batas bawah dan atas kadar PM2.5 (µg/m³) untuk kategori ini. */
  from: number;
  to: number;
};

/**
 * Rentang kadar PM2.5 (µg/m³) tiap kategori pada standar yang dipilih.
 * Batas atas diambil langsung dari tabel US_BANDS / ISPU_LIMITS di atas,
 * jadi grafik selalu sejalan dengan hitungan indeks di halaman Cek Udara.
 * Standar resmi memakai rata-rata 24 jam; di prakiraan nilainya per jam,
 * jadi zona ini adalah acuan visual, bukan penetapan resmi.
 */
export function pm25Zones(standard: Standard): Pm25Zone[] {
  const uppers: readonly number[] =
    standard === "us"
      ? [
          ...US_BANDS.pm2_5.slice(0, 5).map((band) => band[1]),
          US_BANDS.pm2_5[US_BANDS.pm2_5.length - 1][1],
        ]
      : ISPU_LIMITS.pm2_5;
  let from = 0;
  return getCategories(standard).map((category, i) => {
    const zone = { category, from, to: uppers[i] };
    from = uppers[i];
    return zone;
  });
}

/** Kategori untuk satu nilai PM2.5 (µg/m³), memakai hitungan indeks yang sama dengan Cek Udara. */
export function pm25Category(standard: Standard, ugm3: number): AqiCategory {
  return getCategory(standard, subIndex(standard, "pm2_5", ugm3));
}

/* ------------------------------------------------------------------ */
/* Hasil gabungan                                                      */
/* ------------------------------------------------------------------ */

export type AqiResult = {
  /** Indeks keseluruhan = indeks polutan tertinggi. */
  value: number;
  /** Polutan penyebab indeks tertinggi. */
  dominant: Pollutant;
  subIndices: Record<Pollutant, number | null>;
  category: AqiCategory;
};

export function subIndex(standard: Standard, pollutant: Pollutant, ugm3: number): number {
  return standard === "us" ? usSubIndex(pollutant, ugm3) : ispuSubIndex(pollutant, ugm3);
}

/** Hitung indeks keseluruhan. Mengembalikan null bila tidak ada satu pun data. */
export function computeAqi(standard: Standard, concentrations: Concentrations): AqiResult | null {
  const subIndices = {} as Record<Pollutant, number | null>;
  let best: { pollutant: Pollutant; value: number } | null = null;

  for (const p of POLLUTANT_KEYS) {
    const c = concentrations[p];
    if (c === null || !Number.isFinite(c)) {
      subIndices[p] = null;
      continue;
    }
    const idx = subIndex(standard, p, c);
    subIndices[p] = idx;
    if (best === null || idx > best.value) best = { pollutant: p, value: idx };
  }

  if (best === null) return null;
  return {
    value: best.value,
    dominant: best.pollutant,
    subIndices,
    category: getCategory(standard, best.value),
  };
}
