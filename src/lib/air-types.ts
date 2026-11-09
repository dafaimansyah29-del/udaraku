/** Polutan yang diambil dari Open-Meteo Air Quality API. */
export type Pollutant = "pm2_5" | "pm10" | "no2" | "o3" | "so2" | "co";

/** Standar indeks yang bisa dipilih pengguna. */
export type Standard = "us" | "ispu";

/** Konsentrasi tiap polutan dalam µg/m³ (null = data tidak tersedia). */
export type Concentrations = Record<Pollutant, number | null>;

/** Lokasi yang dipilih pengguna (hasil pencarian kota atau Geolocation). */
export type Place = {
  name: string;
  /** Contoh: "Jawa Barat, Indonesia" atau teks koordinat. */
  subtitle?: string;
  lat: number;
  lon: number;
};

/** Bentuk respons dari route handler /api/air. */
export type AirResponse = {
  location: { lat: number; lon: number };
  /** Waktu data (ISO 8601, UTC). */
  updatedAt: string;
  /** Zona waktu IANA lokasi, mis. "Asia/Jakarta". */
  timezone: string;
  pollutants: Concentrations;
  weather: { temperature: number | null; humidity: number | null };
  /** Teks sumber data yang ditampilkan ke pengguna. */
  source: string;
  /** true bila API gagal dan yang tampil adalah data contoh. */
  isMock: boolean;
};
