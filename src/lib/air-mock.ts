import type { AirResponse } from "./air-types";

/**
 * Data contoh yang dipakai bila Open-Meteo gagal dihubungi.
 * Nilainya tetap (bukan data asli) dan selalu ditandai `isMock: true`
 * supaya antarmuka bisa memberi tahu pengguna.
 */
export function buildMockAir(lat: number, lon: number): AirResponse {
  // Bulatkan ke jam penuh agar waktu terlihat wajar
  const hour = new Date();
  hour.setMinutes(0, 0, 0);

  return {
    location: { lat, lon },
    updatedAt: hour.toISOString(),
    timezone: "Asia/Jakarta",
    pollutants: {
      pm2_5: 38.2,
      pm10: 61.4,
      no2: 24.8,
      o3: 71.5,
      so2: 9.3,
      co: 412,
    },
    weather: { temperature: 31.4, humidity: 68 },
    source: "Data contoh (bukan data asli)",
    isMock: true,
  };
}
