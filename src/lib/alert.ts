/**
 * Tingkat peringatan untuk banner di bagian atas situs.
 *
 * Banner muncul saat PM2.5 LEBIH DARI 15 µg/m³, yaitu pedoman WHO 2021 untuk
 * rata-rata 24 jam (WHO_PM25_24H). Nilai tepat 15 belum memicu peringatan.
 *
 * Catatan penting: yang dibandingkan adalah nilai per jam saat ini dengan
 * pedoman rata-rata 24 jam. Itu perkiraan awal, bukan penetapan resmi, dan
 * teks banner menyebutnya "saat ini".
 *
 * Batas bawah tiap tingkat (`above`, tidak inklusif) adalah penilaian produk,
 * dengan acuan:
 *   15     Pedoman WHO 2021 (AQG), 24 jam
 *   37,5   WHO 2021 interim target 3 (IT-3), 24 jam
 *   75     WHO 2021 interim target 1 (IT-1), 24 jam
 *   150    kira-kira batas atas kategori "Tidak Sehat" ISPU untuk PM2.5 (150,4)
 * Jadi tepat 37,5 masih tingkat 1, dan 37,51 sudah tingkat 2 (dan seterusnya).
 *
 * Warna dan warna teks (ink) memakai palet kategori indeks di lib/aqi.ts. Kontras
 * teks terhadap latar diuji di alert.test.ts (WCAG AA, minimal 4,5:1).
 */
import { WHO_PM25_24H } from "./risk-config";

export type AlertLevelId = "waspada" | "rentan" | "tidak-sehat" | "berbahaya";

export type AlertLevel = {
  id: AlertLevelId;
  label: string;
  /** PM2.5 (µg/m³) harus LEBIH BESAR dari angka ini untuk masuk tingkat ini. */
  above: number;
  /** Satu kalimat saran, bahasa sederhana. */
  advice: string;
  color: string;
  /** Warna teks di atas `color`. */
  ink: string;
};

const NAVY = "#0B1E5B";

export const ALERT_LEVELS: readonly AlertLevel[] = [
  {
    id: "waspada",
    label: "Waspada",
    above: WHO_PM25_24H,
    advice: "Orang yang sensitif sebaiknya mengurangi aktivitas berat di luar rumah.",
    color: "#FACC15",
    ink: NAVY,
  },
  {
    id: "rentan",
    label: "Tidak sehat bagi kelompok rentan",
    above: 37.5,
    advice: "Anak, lansia, ibu hamil, dan penderita asma atau jantung sebaiknya di dalam ruangan.",
    color: "#F97316",
    ink: NAVY,
  },
  {
    id: "tidak-sehat",
    label: "Tidak sehat",
    above: 75,
    advice: "Kurangi aktivitas di luar rumah dan pakai masker N95 bila harus keluar.",
    color: "#DC2626",
    ink: "#FFFFFF",
  },
  {
    id: "berbahaya",
    label: "Berbahaya",
    above: 150,
    advice: "Tetap di dalam ruangan dengan jendela tertutup. Hindari aktivitas di luar.",
    color: "#7F1D1D",
    ink: "#FFFFFF",
  },
];

/**
 * Indeks tingkat peringatan (0 sampai 3) untuk satu nilai PM2.5, atau -1 bila
 * tidak perlu peringatan (nilai ≤ 15, kosong, atau tidak sah).
 */
export function alertIndexFor(pm25: number | null | undefined): number {
  if (typeof pm25 !== "number" || !Number.isFinite(pm25) || pm25 <= WHO_PM25_24H) return -1;
  let index = -1;
  ALERT_LEVELS.forEach((level, i) => {
    if (pm25 > level.above) index = i;
  });
  return index;
}

export type AlertResult = {
  index: number;
  level: AlertLevel;
  pm25: number;
  /** Kelipatan dari pedoman WHO 24 jam. */
  ratio: number;
};

/** Hasil peringatan untuk satu nilai PM2.5, atau null bila tidak perlu peringatan. */
export function alertForPm25(pm25: number | null | undefined): AlertResult | null {
  const index = alertIndexFor(pm25);
  if (index < 0 || typeof pm25 !== "number") return null;
  return { index, level: ALERT_LEVELS[index], pm25, ratio: whoMultiple(pm25) };
}

/** Berapa kali lipat nilai PM2.5 dari pedoman WHO 24 jam. */
export function whoMultiple(pm25: number): number {
  return pm25 / WHO_PM25_24H;
}