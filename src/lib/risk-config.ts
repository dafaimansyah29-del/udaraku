/**
 * KONFIGURASI KALKULATOR RISIKO PERSONAL
 * ======================================
 * Semua koefisien model ada di SATU file ini. Mengubah angka di sini cukup
 * untuk mengubah hasil di seluruh aplikasi dan unit test.
 *
 * Rumus (lihat lib/risk.ts):
 *   dosis = PM2.5 (µg/m³) × laju napas (m³/jam) × durasi (jam)
 *           × faktor kerentanan × (1 − efektivitas masker)        [satuan: µg]
 *   rasio = dosis ÷ dosis acuan WHO
 *
 * PERINGATAN UNTUK PENGEMBANG
 * Ini model edukasi yang disederhanakan, BUKAN model klinis. Ada dua jenis angka:
 *  (A) Angka yang bersumber dari dokumen rujukan, tetapi DIBULATKAN dari
 *      ingatan pembuat kode. Cocokkan dengan dokumen aslinya sebelum rilis publik.
 *  (B) Angka "penilaian kehati-hatian" (judgement). Tidak ada tabel baku yang
 *      memberi faktor kerentanan sebagai pengali, jadi nilainya dipilih
 *      konservatif dan ditandai jelas di bawah.
 * Disarankan ditinjau oleh tenaga kesehatan masyarakat sebelum dipublikasikan.
 */

/* ------------------------------------------------------------------ */
/* Tipe pilihan                                                        */
/* ------------------------------------------------------------------ */

export type Activity = "idle" | "walk" | "bike" | "run";
export type Condition = "asthma" | "allergy" | "chronic" | "pregnant" | "none";
export type Mask = "none" | "cloth" | "medical" | "n95";
export type RiskLevelId = "low" | "medium" | "high" | "very-high";

/* ------------------------------------------------------------------ */
/* 1. Ambang WHO dan dosis acuan                                       */
/* ------------------------------------------------------------------ */

/**
 * Pedoman WHO 2021 untuk PM2.5, rata-rata 24 jam = 15 µg/m³
 * (persentil ke-99, artinya boleh terlewati 3-4 hari per tahun).
 * Pedoman tahunan = 5 µg/m³ (tidak dipakai di model ini).
 * TERVERIFIKASI (29 Okt 2026) pada ringkasan resmi WHO 2021: 24 jam = 15 µg/m³,
 * dengan catatan kaki "99th percentile (i.e. 3-4 exceedance days per year)".
 *
 * SUMBER RUJUKAN (A):
 *  - WHO. WHO global air quality guidelines: particulate matter (PM2.5 and PM10),
 *    ozone, nitrogen dioxide, sulfur dioxide and carbon monoxide. Geneva: 2021.
 */
export const WHO_PM25_24H = 15;

/**
 * Laju napas orang dewasa saat istirahat (m³/jam), dipakai sebagai dasar
 * dosis acuan. Sama dengan laju napas aktivitas "diam" di bawah.
 */
export const REFERENCE_BREATH_RATE = 0.5;

/** Lama acuan (jam): satu hari penuh, sesuai rata-rata 24 jam pedoman WHO. */
export const REFERENCE_HOURS = 24;

/**
 * DOSIS ACUAN = dosis PM2.5 yang terhirup orang dewasa yang diam (istirahat)
 * selama 24 jam di udara tepat pada batas WHO:
 *   15 µg/m³ × 0,5 m³/jam × 24 jam = 180 µg.
 * Sebut saja "anggaran dosis harian WHO". Dosis satu sesi aktivitas
 * dibandingkan dengan anggaran ini.
 *
 * PENGECEKAN: EPA EFH 2011, Tabel 6-1, rata-rata napas harian dewasa 15,7-16,0
 * m³/hari (21-<61 tahun). Acuan di sini 0,5 × 24 = 12 m³/hari, sekitar 25% lebih
 * rendah, jadi kategori sedikit lebih mudah naik (konservatif).
 */
export const REFERENCE_DOSE = WHO_PM25_24H * REFERENCE_BREATH_RATE * REFERENCE_HOURS;

/* ------------------------------------------------------------------ */
/* 2. Laju napas per aktivitas                                         */
/* ------------------------------------------------------------------ */

/**
 * Laju napas orang dewasa (m³ udara per jam) menurut tingkat aktivitas.
 * Semakin berat aktivitas, semakin banyak udara (dan polutan) terhirup.
 *
 * SUMBER RUJUKAN (A), nilai dibulatkan:
 *  - US EPA. Exposure Factors Handbook: 2011 Edition (EPA/600/R-09/052F),
 *    Bab 6 "Inhalation Rates": laju napas menurut tingkat aktivitas.
 *  - Adams WC. Measurement of breathing rate and volume in routinely performed
 *    daily activities. California Air Resources Board, 1993.
 *  - Tainio M dkk. Can air pollution negate the health benefits of cycling and
 *    walking? Preventive Medicine, 2016; 87: 233-236 (laju napas jalan dan sepeda).
 *
 * Ringkasan kasar: istirahat ± 6-8 L/menit, jalan ± 20-25 L/menit,
 * sepeda santai ± 35-40 L/menit, lari ± 50-70 L/menit (1 m³/jam ≈ 16,7 L/menit).
 *
 * HASIL PENGECEKAN ke sumbernya (29 Okt 2026, dibaca langsung):
 *  - EPA EFH 2011, Tabel 6-2, rata-rata dewasa 21-<31 tahun: sedentary 4,2×10⁻³
 *    m³/menit (0,25 m³/jam), ringan 1,2×10⁻² (0,72), sedang 2,6×10⁻² (1,56),
 *    berat 5,0×10⁻² (3,0 m³/jam).
 *  - Tainio dkk. 2016 (Prev Med 87:233-236) memakai ventilasi istirahat 0,61,
 *    jalan 1,37, sepeda 2,55 (satuan tidak ditulis di makalah, kemungkinan m³/jam).
 *  - Angka di tabel ini cocok dengan rentang itu untuk jalan dan sepeda. Untuk
 *    "diam" (0,5 vs EPA 0,25) dan "lari" (3,6 vs EPA berat 3,0) angkanya lebih
 *    tinggi, jadi model cenderung menaksir dosis lebih besar (konservatif).
 */
export const ACTIVITIES: Record<
  Activity,
  { label: string; hint: string; breathRate: number }
> = {
  idle: { label: "Diam", hint: "Duduk atau istirahat", breathRate: 0.5 },
  walk: { label: "Jalan", hint: "Jalan santai", breathRate: 1.5 },
  bike: { label: "Bersepeda", hint: "Bersepeda santai", breathRate: 2.5 },
  run: { label: "Lari", hint: "Lari atau jogging", breathRate: 3.6 },
};

/* ------------------------------------------------------------------ */
/* 3. Faktor kerentanan: usia dan kondisi                              */
/* ------------------------------------------------------------------ */

/**
 * FAKTOR KERENTANAN = pengali "kehati-hatian" untuk kelompok yang lebih
 * mudah terdampak polusi. Nilai 1,0 = orang dewasa sehat.
 *
 * SUMBER RUJUKAN (kelompok mana yang lebih rentan) (A):
 *  - WHO 2021, global air quality guidelines (bagian kelompok rentan).
 *  - US EPA. Integrated Science Assessment for Particulate Matter, 2019
 *    (EPA/600/R-19/188): populasi berisiko, yaitu anak-anak, lansia, penderita
 *    penyakit jantung/paru, dan kelompok lain.
 *  - US EPA AirNow: definisi "kelompok sensitif" pada US AQI.
 *  - US EPA Exposure Factors Handbook 2011, Bab 6: anak bernapas lebih banyak
 *    per kilogram berat badan.
 *
 * CATATAN (B): sumber-sumber di atas menyebut SIAPA yang rentan, tetapi tidak
 * memberi satu angka pengali. Angka di bawah adalah penilaian kehati-hatian,
 * bukan hasil pengukuran, dan dibatasi maksimum 2,0 per aspek.
 */
export const AGE_BANDS: readonly { min: number; max: number; label: string; factor: number }[] = [
  { min: 0, max: 12, label: "Anak (0-12 tahun)", factor: 1.5 },
  { min: 13, max: 17, label: "Remaja (13-17 tahun)", factor: 1.2 },
  { min: 18, max: 59, label: "Dewasa (18-59 tahun)", factor: 1.0 },
  { min: 60, max: 74, label: "Lansia (60-74 tahun)", factor: 1.3 },
  { min: 75, max: 120, label: "Lansia (75 tahun ke atas)", factor: 1.5 },
];

/**
 * Faktor kondisi kesehatan (B: penilaian kehati-hatian).
 * Bila memilih lebih dari satu kondisi, dipakai yang TERTINGGI (bukan dikali),
 * supaya hasil tidak membengkak. Faktor usia dikalikan dengan faktor kondisi,
 * jadi faktor kerentanan total paling besar 1,5 × 2,0 = 3,0.
 */
export const CONDITIONS: Record<
  Condition,
  { label: string; hint: string; factor: number }
> = {
  asthma: { label: "Asma", hint: "Mudah sesak atau mengi", factor: 1.8 },
  allergy: { label: "Alergi", hint: "Misalnya alergi debu atau rinitis", factor: 1.3 },
  chronic: { label: "Jantung/paru kronis", hint: "Misalnya PPOK atau penyakit jantung", factor: 2.0 },
  pregnant: { label: "Hamil", hint: "Sedang mengandung", factor: 1.4 },
  none: { label: "Tidak ada", hint: "Tidak punya kondisi di atas", factor: 1.0 },
};

/** Urutan tampil di formulir. */
export const CONDITION_ORDER: readonly Condition[] = ["asthma", "allergy", "chronic", "pregnant", "none"];

/* ------------------------------------------------------------------ */
/* 4. Efektivitas masker terhadap PM2.5                                */
/* ------------------------------------------------------------------ */

/**
 * Efektivitas masker = porsi PM2.5 yang TIDAK ikut terhirup (0 = tidak
 * melindungi, 1 = menahan semuanya). Ini efektivitas "dunia nyata":
 * kemampuan filter dikurangi kebocoran di sisi wajah.
 *
 * SUMBER RUJUKAN (A), nilai dibulatkan dan sengaja konservatif:
 *  - NIOSH, 42 CFR Part 84: respirator N95 menyaring ≥ 95% partikel uji.
 *    Tanpa uji kecocokan (fit test) kebocoran umum terjadi, jadi dipakai 0,80.
 *  - Konda A dkk. Aerosol filtration efficiency of common fabrics used in
 *    respiratory cloth masks. ACS Nano, 2020; 14(5): 6339-6347 (kain sangat
 *    bervariasi menurut bahan dan lapisan).
 *  - Cherrie JW dkk. Effectiveness of face masks used to protect Beijing
 *    residents against particulate air pollution. Occupational and
 *    Environmental Medicine, 2018; 75: 446-452 (perlindungan masker nyata
 *    di lapangan umumnya lebih kecil dari angka uji laboratorium).
 *
 * CATATAN (B): angka kain dan medis adalah perkiraan tengah dari rentang yang
 * lebar pada penelitian di atas.
 *
 * PENGECEKAN Cherrie dkk. (OEM 2018; 75(6): 446-452), dibaca langsung: 9 masker
 * komersial di Beijing, penetrasi filter 0,26-29%; pada 4 masker yang diuji ke
 * sukarelawan, kebocoran total ke dalam 3-68% (duduk) dan 7-66% (aktif); hanya satu
 * jenis yang kebocoran rata-ratanya di bawah 10%. Makalah itu TIDAK memberi angka
 * per jenis (N95, medis, kain), jadi 0,15 / 0,35 / 0,80 tetap penilaian (B),
 * bukan hasil pengukuran. Kesimpulannya searah: kecocokan di wajah menentukan.
 */
export const MASKS: Record<Mask, { label: string; hint: string; effectiveness: number }> = {
  none: { label: "Tidak pakai", hint: "Tanpa masker", effectiveness: 0 },
  cloth: { label: "Masker kain", hint: "Kain biasa", effectiveness: 0.15 },
  medical: { label: "Masker medis", hint: "Masker bedah sekali pakai", effectiveness: 0.35 },
  n95: { label: "N95/KN95", hint: "Pas dan rapat di wajah", effectiveness: 0.8 },
};

/** Urutan tampil di formulir. */
export const MASK_ORDER: readonly Mask[] = ["none", "cloth", "medical", "n95"];
export const ACTIVITY_ORDER: readonly Activity[] = ["idle", "walk", "bike", "run"];

/* ------------------------------------------------------------------ */
/* 5. Kategori risiko                                                  */
/* ------------------------------------------------------------------ */

/**
 * Kategori ditentukan oleh RASIO = dosis sesi ÷ dosis acuan WHO (180 µg).
 * Cara membacanya: "Sesi ini menghabiskan berapa persen anggaran dosis
 * harian di udara standar WHO?"
 *
 *   Rendah       rasio < 0,25   (kurang dari seperempat anggaran harian)
 *   Sedang       0,25 sampai < 0,5
 *   Tinggi       0,5 sampai < 1,0
 *   Sangat Tinggi ≥ 1,0         (satu sesi saja melampaui anggaran sehari penuh)
 *
 * CATATAN (B): batas ini pilihan desain, bukan standar baku. Dikalibrasi agar
 * mendekati panduan US AQI untuk orang dewasa sehat yang berjalan 1 jam:
 * "Rendah" sampai kira-kira PM2.5 ≤ 30 µg/m³, "Sangat Tinggi" mulai kira-kira
 * PM2.5 ≥ 120 µg/m³. Aktivitas lebih berat atau kondisi lebih rentan
 * menggeser kategori naik.
 */
export const RISK_LEVELS: readonly {
  id: RiskLevelId;
  label: string;
  /** Rasio minimum (inklusif) kategori ini. */
  minRatio: number;
  color: string;
  /** Warna teks yang terbaca di atas `color`. */
  ink: string;
  summary: string;
}[] = [
  { id: "low", label: "Rendah", minRatio: 0, color: "#22C55E", ink: "#0B1E5B", summary: "Paparan polusi sesi ini kecil. Aktivitasmu relatif aman." },
  { id: "medium", label: "Sedang", minRatio: 0.25, color: "#FACC15", ink: "#0B1E5B", summary: "Paparan polusi sesi ini cukup terasa. Kurangi dengan langkah sederhana." },
  { id: "high", label: "Tinggi", minRatio: 0.5, color: "#F97316", ink: "#0B1E5B", summary: "Paparan polusi sesi ini besar. Sebaiknya ubah rencanamu." },
  { id: "very-high", label: "Sangat Tinggi", minRatio: 1, color: "#DC2626", ink: "#FFFFFF", summary: "Paparan polusi sesi ini melampaui dosis sehari standar WHO. Sebaiknya tunda." },
];

/** Rasio di ujung kanan meter (jarum mentok di sini atau lebih). */
export const METER_MAX_RATIO = 2;

/* ------------------------------------------------------------------ */
/* 6. Batas masukan formulir                                           */
/* ------------------------------------------------------------------ */

export const INPUT_LIMITS = {
  age: { min: 0, max: 120 },
  /** Menit. */
  duration: { min: 5, max: 480 },
} as const;