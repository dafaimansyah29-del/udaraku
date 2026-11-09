/** Isi halaman Edukasi: artikel singkat berbahasa awam. */

export type Article = {
  id: string;
  title: string;
  /** Label kecil di kartu. */
  tag: string;
  /** Perkiraan waktu baca, dalam menit. */
  minutes: number;
  summary: string;
  /** Isi artikel, satu paragraf per elemen. */
  body: string[];
  /** Poin penting yang ditampilkan di akhir artikel. */
  points: string[];
};

export const ARTICLES: Article[] = [
  {
    id: "apa-itu-pm25",
    title: "Apa itu PM2.5?",
    tag: "Dasar",
    minutes: 2,
    summary: "Debu super halus yang bisa masuk jauh ke dalam paru-paru dan memengaruhi kesehatan.",
    body: [
      "PM2.5 adalah partikel debu yang sangat kecil, ukurannya 2,5 mikrometer atau kurang. Itu jauh lebih kecil dari lebar rambut manusia, jadi tidak terlihat dan mudah terhirup.",
      "Partikel ini berasal dari asap kendaraan, pembakaran sampah, asap pabrik, memasak dengan kayu atau arang, dan kebakaran hutan atau lahan.",
      "Karena sangat kecil, PM2.5 bisa masuk jauh ke dalam paru-paru dan sebagian bisa sampai ke aliran darah. Paparan yang berulang dikaitkan dengan masalah pernapasan dan penyakit jantung.",
      "WHO (2021) menyarankan kadar PM2.5 tidak lebih dari 15 µg/m³ untuk rata-rata 24 jam, dan 5 µg/m³ untuk rata-rata setahun.",
    ],
    points: [
      "Ukurannya lebih kecil dari rambut, jadi tidak terlihat",
      "Berasal dari asap kendaraan, pembakaran, dan kebakaran lahan",
      "Batas harian WHO: 15 µg/m³",
    ],
  },
  {
    id: "cara-memilih-masker",
    title: "Cara memilih masker",
    tag: "Perlindungan",
    minutes: 3,
    summary: "Tidak semua masker menyaring debu halus. Kenali mana yang cocok dan cara memakainya.",
    body: [
      "Untuk debu halus PM2.5, masker N95 atau KN95 adalah pilihan terbaik. Bahannya menyaring partikel kecil dan bentuknya menempel rapat di wajah.",
      "Masker bedah dan masker kain lebih longgar, jadi sebagian udara masuk lewat celah di pinggir. Tetap lebih baik daripada tanpa masker, tetapi perlindungannya lebih rendah.",
      "Cara memakai: tutup hidung dan mulut, tekan klip hidung, lalu pastikan tidak ada celah di pipi dan dagu. Masker yang longgar atau jenggot yang tebal membuat perlindungannya turun.",
      "Ganti masker bila basah, kotor, rusak, atau terasa sulit bernapas. Masker sekali pakai tidak untuk dicuci.",
      "Penderita penyakit jantung atau paru kronis dan ibu hamil sebaiknya bertanya ke dokter sebelum memakai N95 dalam waktu lama, karena napas bisa terasa lebih berat.",
    ],
    points: [
      "N95/KN95 paling menyaring bila rapat di wajah",
      "Masker bedah dan kain: perlindungan lebih rendah",
      "Ganti bila basah atau rusak",
    ],
  },
  {
    id: "udara-dalam-ruangan",
    title: "Tips udara dalam ruangan",
    tag: "Di rumah",
    minutes: 2,
    summary: "Rumah bisa jadi tempat berlindung dari polusi, asalkan udaranya dijaga.",
    body: [
      "Saat udara luar buruk, tutup jendela dan pintu. Buka jendela ketika halaman Cek Udara menunjukkan udara baik, supaya udara di dalam rumah tetap segar.",
      "Jangan menyalakan sumber asap di dalam rumah, seperti rokok, obat nyamuk bakar, dupa, dan lilin yang berasap.",
      "Saat memasak, nyalakan kipas penyedot asap atau buka jendela dapur. Bersihkan debu dengan lap basah atau penyedot debu, bukan disapu kering.",
      "Penyaring udara (air purifier) dengan filter HEPA membantu mengurangi partikel halus di ruangan tertutup. Pilih yang sesuai dengan luas ruangan dan ganti filternya secara rutin.",
    ],
    points: [
      "Tutup jendela saat udara luar buruk",
      "Hindari rokok dan obat nyamuk bakar di dalam rumah",
      "Pakai filter HEPA di ruangan tertutup",
    ],
  },
  {
    id: "kelompok-rentan",
    title: "Kelompok rentan",
    tag: "Siapa yang perlu ekstra hati-hati",
    minutes: 2,
    summary: "Beberapa orang lebih mudah sakit akibat polusi. Kenali apakah kamu atau keluargamu termasuk.",
    body: [
      "Kelompok yang lebih rentan adalah anak-anak, lansia, ibu hamil, serta orang dengan asma, PPOK, alergi berat, atau penyakit jantung.",
      "Anak-anak bernapas lebih cepat dan paru-parunya masih berkembang. Lansia dan penderita penyakit kronis punya cadangan tubuh yang lebih terbatas.",
      "Saat udara tidak sehat, kurangi olahraga di luar rumah, siapkan obat yang biasa dipakai (misalnya inhaler), dan perhatikan kondisi tubuh.",
      "Segera cari pertolongan medis bila muncul sesak napas, nyeri dada, batuk yang tidak reda, atau napas berbunyi (mengi). Informasi ini untuk edukasi, bukan diagnosis medis.",
    ],
    points: [
      "Anak, lansia, ibu hamil, dan penderita asma atau jantung lebih rentan",
      "Kurangi aktivitas berat di luar saat udara buruk",
      "Sesak napas atau nyeri dada: segera ke dokter",
    ],
  },
];

/** Kata-kata di teks berjalan (marquee). */
export const MARQUEE_WORDS = ["PM2.5", "PM10", "NO2", "O3", "PRAKIRAAN"] as const;

/**
 * ID video edukasi dari NEXT_PUBLIC_EDU_YOUTUBE_ID (11 karakter dari tautan YouTube).
 * Bila kosong atau tidak valid, kartu video memakai DEFAULT_EDU_VIDEO_ID. Ganti nilainya lalu build ulang. Video baru dimuat (dari youtube-nocookie.com) setelah tombol play ditekan.
 */
export function getVideoId(raw: string | undefined = process.env.NEXT_PUBLIC_EDU_YOUTUBE_ID): string | null {
  const id = raw?.trim() ?? "";
  return /^[\w-]{11}$/.test(id) ? id : null;
}

/**
 * Video bawaan bila NEXT_PUBLIC_EDU_YOUTUBE_ID belum diisi: "Breathe Life" dari WHO tentang
 * dampak polusi udara pada tubuh. Ganti lewat .env untuk memakai video lain (mis. berbahasa Indonesia).
 */
export const DEFAULT_EDU_VIDEO_ID = "GVBeY1jSG9Y";