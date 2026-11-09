/**
 * Fungsi hitung risiko personal. Semua angka koefisien ada di ./risk-config.
 * File ini hanya berisi logika murni (tanpa React, tanpa akses jaringan)
 * sehingga mudah diuji.
 */
import {
  ACTIVITIES,
  AGE_BANDS,
  CONDITIONS,
  INPUT_LIMITS,
  MASKS,
  METER_MAX_RATIO,
  REFERENCE_DOSE,
  RISK_LEVELS,
  WHO_PM25_24H,
} from "./risk-config";
import type { Activity, Condition, Mask } from "./risk-config";

/* ------------------------------------------------------------------ */
/* Tipe                                                                */
/* ------------------------------------------------------------------ */

export type RiskInput = {
  /** PM2.5 terkini, µg/m³. */
  pm25: number;
  /** Usia, tahun. */
  age: number;
  conditions: readonly Condition[];
  activity: Activity;
  /** Lama aktivitas, menit. */
  durationMin: number;
  mask: Mask;
};

export type RiskLevel = (typeof RISK_LEVELS)[number];

export type RiskResult = {
  /** Dosis PM2.5 yang terhirup selama sesi, µg. */
  dose: number;
  /** Dosis acuan WHO (anggaran harian), µg. */
  referenceDose: number;
  /** dosis ÷ dosis acuan. */
  ratio: number;
  level: RiskLevel;
  /** 0 = Rendah ... 3 = Sangat Tinggi. */
  levelIndex: number;
  /** PM2.5 saat ini dibanding batas WHO 24 jam (kali lipat). */
  pm25VsWho: number;
  factors: {
    breathRate: number;
    hours: number;
    ageFactor: number;
    conditionFactor: number;
    vulnerability: number;
    maskEffectiveness: number;
  };
};

/** Nilai formulir mentah (teks, karena pengguna masih mengetik). */
export type FormValues = {
  age: string;
  conditions: Condition[];
  activity: Activity;
  duration: string;
  mask: Mask;
};

export type FormErrors = { age?: string; duration?: string };

export type Validation =
  | { ok: true; age: number; durationMin: number }
  | { ok: false; errors: FormErrors };

/* ------------------------------------------------------------------ */
/* Faktor kerentanan                                                   */
/* ------------------------------------------------------------------ */

/** Faktor usia. Usia di luar tabel dianggap dewasa (1,0). */
export function ageFactor(age: number): number {
  const band = AGE_BANDS.find((b) => age >= b.min && age <= b.max);
  return band ? band.factor : 1;
}

/**
 * Faktor kondisi = yang TERTINGGI dari kondisi yang dipilih (bukan dikali).
 * "Tidak ada" diabaikan bila ada kondisi lain; daftar kosong = 1,0.
 */
export function conditionFactor(conditions: readonly Condition[]): number {
  let max = 1;
  for (const c of conditions) {
    if (c !== "none") max = Math.max(max, CONDITIONS[c].factor);
  }
  return max;
}

export function vulnerabilityFactor(age: number, conditions: readonly Condition[]): number {
  return ageFactor(age) * conditionFactor(conditions);
}

/* ------------------------------------------------------------------ */
/* Perhitungan inti                                                    */
/* ------------------------------------------------------------------ */

/** Tentukan kategori dari rasio. Dibulatkan 9 desimal agar batas tidak goyah oleh galat floating point. */
export function levelForRatio(ratio: number): { level: RiskLevel; index: number } {
  const r = Math.round(ratio * 1e9) / 1e9;
  let index = 0;
  RISK_LEVELS.forEach((l, i) => {
    if (r >= l.minRatio) index = i;
  });
  return { level: RISK_LEVELS[index], index };
}

function assertValid(input: RiskInput): void {
  const nums: [string, number][] = [
    ["pm25", input.pm25],
    ["age", input.age],
    ["durationMin", input.durationMin],
  ];
  for (const [name, v] of nums) {
    if (!Number.isFinite(v) || v < 0) throw new RangeError(`${name} harus angka >= 0`);
  }
}

/**
 * dosis = PM2.5 × laju napas × durasi × faktor kerentanan × (1 − efektivitas masker)
 * rasio = dosis ÷ dosis acuan WHO
 */
export function calculateRisk(input: RiskInput): RiskResult {
  assertValid(input);

  const breathRate = ACTIVITIES[input.activity].breathRate;
  const hours = input.durationMin / 60;
  const age = ageFactor(input.age);
  const cond = conditionFactor(input.conditions);
  const vulnerability = age * cond;
  const maskEffectiveness = MASKS[input.mask].effectiveness;

  const dose = input.pm25 * breathRate * hours * vulnerability * (1 - maskEffectiveness);
  const ratio = dose / REFERENCE_DOSE;
  const { level, index } = levelForRatio(ratio);

  return {
    dose,
    referenceDose: REFERENCE_DOSE,
    ratio,
    level,
    levelIndex: index,
    pm25VsWho: input.pm25 / WHO_PM25_24H,
    factors: {
      breathRate,
      hours,
      ageFactor: age,
      conditionFactor: cond,
      vulnerability,
      maskEffectiveness,
    },
  };
}

/**
 * Berapa menit aktivitas yang menghasilkan rasio tertentu (semua masukan lain tetap).
 * Mengembalikan Infinity bila dosis per jam = 0 (mis. PM2.5 = 0).
 */
export function minutesForRatio(input: Omit<RiskInput, "durationMin">, targetRatio: number): number {
  const perHour =
    input.pm25 *
    ACTIVITIES[input.activity].breathRate *
    vulnerabilityFactor(input.age, input.conditions) *
    (1 - MASKS[input.mask].effectiveness);
  if (perHour <= 0) return Infinity;
  return ((targetRatio * REFERENCE_DOSE) / perHour) * 60;
}

/**
 * Posisi jarum meter, 0 sampai 1. Meter dibagi 4 segmen sama lebar (satu per
 * kategori); di dalam tiap segmen posisi naik linear. Segmen terakhir
 * berakhir di METER_MAX_RATIO.
 */
export function ratioToMeterPosition(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0) return 0;
  const bounds = [...RISK_LEVELS.map((l) => l.minRatio), METER_MAX_RATIO];
  const segments = RISK_LEVELS.length;
  if (ratio >= METER_MAX_RATIO) return 1;
  let i = 0;
  for (let k = 0; k < segments; k++) if (ratio >= bounds[k]) i = k;
  const frac = (ratio - bounds[i]) / (bounds[i + 1] - bounds[i]);
  return (i + frac) / segments;
}

/* ------------------------------------------------------------------ */
/* Validasi formulir                                                   */
/* ------------------------------------------------------------------ */

/** Hanya bilangan bulat tanpa tanda, maksimum 3 digit. */
const INTEGER = /^\d{1,3}$/;

export function validateForm(form: Pick<FormValues, "age" | "duration">): Validation {
  const errors: FormErrors = {};
  const { age: a, duration: d } = INPUT_LIMITS;

  let age = NaN;
  if (INTEGER.test(form.age.trim())) age = Number(form.age.trim());
  if (!(age >= a.min && age <= a.max)) {
    errors.age = `Masukkan usia ${a.min}-${a.max} tahun.`;
  }

  let durationMin = NaN;
  if (INTEGER.test(form.duration.trim())) durationMin = Number(form.duration.trim());
  if (!(durationMin >= d.min && durationMin <= d.max)) {
    errors.duration = `Masukkan durasi ${d.min}-${d.max} menit.`;
  }

  if (errors.age || errors.duration) return { ok: false, errors };
  return { ok: true, age, durationMin };
}

/**
 * Rapikan daftar kondisi: tanpa duplikat; "Tidak ada" hilang bila ada kondisi
 * lain; kosong menjadi ["none"].
 */
export function normalizeConditions(list: readonly Condition[]): Condition[] {
  const unique = Array.from(new Set(list));
  const real = unique.filter((c) => c !== "none");
  return real.length > 0 ? real : ["none"];
}

/* ------------------------------------------------------------------ */
/* Saran                                                               */
/* ------------------------------------------------------------------ */

const ACTIVITY_VERB: Record<Activity, string> = {
  idle: "beristirahat di luar ruangan",
  walk: "jalan kaki",
  bike: "bersepeda",
  run: "lari",
};

/**
 * Tepat 3 saran konkret, diurutkan dari yang paling penting.
 * Setiap saran punya prioritas; 3 dengan prioritas terkecil dipilih.
 * Daftar selalu berisi minimal 3 saran karena ada saran umum di bagian akhir.
 */
export function buildAdvice(input: RiskInput, result: RiskResult): string[] {
  const tips: { priority: number; text: string }[] = [];
  const add = (priority: number, text: string) => tips.push({ priority, text });

  const idx = result.levelIndex;
  const intense = input.activity === "run" || input.activity === "bike";
  const hasCondition = !input.conditions.every((c) => c === "none");
  const weakMask = input.mask !== "n95";

  if (idx === 0) {
    add(1, "Aman untuk beraktivitas sesuai rencana. Nikmati udara luar.");
  }

  if (idx >= 2 && intense) {
    const verb = ACTIVITY_VERB[input.activity];
    add(
      1,
      idx === 3
        ? `Tunda ${verb} hari ini. Ganti dengan jalan santai atau olahraga ringan di dalam ruangan.`
        : `Tunda ${verb} sekarang, atau turunkan jadi jalan santai. Aktivitas berat membuat polusi lebih banyak terhirup.`,
    );
  }

  if (idx >= 1 && weakMask) {
    add(2, "Pakai masker N95 atau KN95 yang menempel rapat di wajah. Masker kain dan masker medis kurang menahan PM2.5.");
  }
  if (idx >= 1 && !weakMask) {
    add(2, "Pastikan masker N95 terpasang rapat, tanpa celah di sekitar hidung dan pipi.");
  }
  if (idx >= 2 && !weakMask && intense) {
    add(2, "Masker N95 bisa membuat napas lebih berat saat olahraga keras. Kurangi intensitas, jangan hanya mengandalkan masker.");
  }

  if (idx >= 1) {
    const target = RISK_LEVELS[1].minRatio; // batas bawah "Sedang" = ambang "Rendah"
    const minutes = minutesForRatio(input, target);
    const rounded = Math.floor(minutes / 5 - 1e-9) * 5;
    if (Number.isFinite(minutes) && rounded >= 5 && rounded < input.durationMin) {
      add(3, `Batasi aktivitas sekitar ${rounded} menit saja agar risikomu turun ke Rendah.`);
    } else if (Number.isFinite(minutes) && rounded < 5) {
      add(3, "Tunda aktivitas ini sampai udara lebih bersih. Dengan kondisi sekarang, waktu amannya sangat singkat.");
    }
  }

  if (idx >= 1) {
    add(4, "Pilih jam saat PM2.5 lebih rendah. Polusi berubah sepanjang hari, jadi cek lagi di halaman Cek Udara sebelum berangkat.");
  }

  if (idx >= 1 && input.activity !== "idle") {
    add(5, "Pilih rute yang jauh dari jalan raya, misalnya taman atau jalan kampung yang sepi kendaraan.");
  }

  if (idx >= 1 && hasCondition) {
    if (input.conditions.includes("asthma")) {
      add(3.5, "Bawa obat pelega yang diresepkan dokter dan ikuti rencana penanganan asmamu.");
    }
    if (input.conditions.includes("chronic")) {
      add(3.5, "Segera berhenti dan cari pertolongan medis bila muncul sesak napas, nyeri dada, atau pusing.");
    }
    if (input.conditions.includes("pregnant")) {
      add(3.5, "Bila sering beraktivitas di udara berpolusi, bicarakan dengan dokter atau bidan.");
    }
    if (input.conditions.includes("allergy")) {
      add(3.5, "Setelah pulang, cuci muka dan ganti baju agar debu tidak terbawa ke dalam rumah.");
    }
  }

  if (idx >= 1 && input.age <= 12) {
    add(3.6, "Anak sebaiknya ditemani orang dewasa dan diminta berhenti bila batuk atau sesak.");
  }

  // Saran umum: selalu ada, sebagai pengisi bila saran di atas kurang dari 3.
  add(8, "Dengarkan tubuhmu. Berhenti dan istirahat bila batuk, sesak napas, atau pusing.");
  add(9, "Cek lagi kualitas udara sebelum aktivitas berikutnya, karena polusi bisa berubah cepat.");
  add(10, "Setelah beraktivitas di luar, minum air putih dan bersihkan wajah serta hidungmu.");

  return tips
    .sort((a, b) => a.priority - b.priority)
    .map((t) => t.text)
    .filter((text, i, all) => all.indexOf(text) === i)
    .slice(0, 3);
}