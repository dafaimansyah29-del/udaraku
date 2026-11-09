import { NextRequest, NextResponse } from "next/server";
import type { AirResponse, Concentrations } from "@/lib/air-types";
import { buildMockAir } from "@/lib/air-mock";
import { API, COORDINATES, ERROR_MESSAGES } from "@/lib/constants";

/**
 * GET /api/air?lat=-6.2&lon=106.8
 *
 * Mengambil data dari Open-Meteo (tanpa API key):
 *  - Air Quality API : PM2.5, PM10, NO2, O3, SO2, CO
 *  - Forecast API    : suhu dan kelembapan (API kualitas udara tidak menyediakannya)
 *
 * Cache: hasil dari Open-Meteo disimpan 15 menit di Data Cache Next.js, dan
 * respons memakai s-maxage=900 supaya CDN ikut menyimpan. Koordinat dibulatkan
 * ke 2 desimal (±1 km) agar permintaan berdekatan memakai cache yang sama.
 *
 * Bila Open-Meteo gagal, route mengembalikan data contoh (isMock: true)
 * dan TIDAK menyimpannya di cache.
 */

const AIR_URL = API.OPEN_METEO_AIR_URL;
const WEATHER_URL = API.OPEN_METEO_WEATHER_URL;
const REVALIDATE_SECONDS = API.CACHE_REVALIDATE_SECONDS;
const TIMEOUT_MS = API.TIMEOUT_MS;

type AirApiJson = {
  timezone?: string;
  utc_offset_seconds?: number;
  current?: Record<string, unknown>;
};

type WeatherApiJson = {
  current?: Record<string, unknown>;
};

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/** Ubah teks "12.5" jadi angka dalam rentang, selain itu null. */
function parseCoord(value: string | null, min: number, max: number): number | null {
  if (value === null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

async function fetchJson<T>(url: URL): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Open-Meteo membalas ${res.status}`);
  return (await res.json()) as T;
}


async function fetchAir(lat: number, lon: number) {
  const url = new URL(AIR_URL);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "current",
    "pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide",
  );
  url.searchParams.set("timezone", "auto");

  const json = await fetchJson<AirApiJson>(url);
  const c = json.current;
  if (!c || typeof c !== "object") throw new Error("Respons kualitas udara tidak lengkap");

  const pollutants: Concentrations = {
    pm2_5: num(c.pm2_5),
    pm10: num(c.pm10),
    no2: num(c.nitrogen_dioxide),
    o3: num(c.ozone),
    so2: num(c.sulphur_dioxide),
    co: num(c.carbon_monoxide),
  };
  if (Object.values(pollutants).every((v) => v === null)) {
    throw new Error("Tidak ada data polutan untuk lokasi ini");
  }

  // `time` berupa waktu lokal tanpa zona ("2026-10-28T13:00"); kembalikan ke UTC.
  const offset = num(json.utc_offset_seconds) ?? 0;
  const localAsUtc = Date.parse(`${String(c.time)}Z`);
  const updatedAt = Number.isNaN(localAsUtc)
    ? new Date().toISOString()
    : new Date(localAsUtc - offset * 1000).toISOString();

  return {
    pollutants,
    updatedAt,
    timezone: typeof json.timezone === "string" ? json.timezone : "UTC",
  };
}

async function fetchWeather(lat: number, lon: number) {
  const url = new URL(WEATHER_URL);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m");
  url.searchParams.set("timezone", "auto");

  const json = await fetchJson<WeatherApiJson>(url);
  return {
    temperature: num(json.current?.temperature_2m),
    humidity: num(json.current?.relative_humidity_2m),
  };
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const lat = parseCoord(sp.get("lat"), COORDINATES.MIN_LAT, COORDINATES.MAX_LAT);
  const lon = parseCoord(sp.get("lon"), COORDINATES.MIN_LON, COORDINATES.MAX_LON);

  if (lat === null || lon === null) {
    return NextResponse.json({ error: ERROR_MESSAGES.INVALID_COORDINATES }, { status: 400 });
  }

  const rLat = round2(lat);
  const rLon = round2(lon);

  const [air, weather] = await Promise.allSettled([
    fetchAir(rLat, rLon),
    fetchWeather(rLat, rLon),
  ]);

  // Data polutan adalah inti halaman: bila gagal, pakai data contoh.
  if (air.status === "rejected") {
    console.error("[api/air] Open-Meteo gagal, memakai data contoh:", air.reason);
    return NextResponse.json(buildMockAir(rLat, rLon), {
      headers: { "Cache-Control": "no-store" },
    });
  }

  // Suhu dan kelembapan hanya pelengkap: bila gagal, kosongkan saja.
  if (weather.status === "rejected") {
    console.error("[api/air] Data cuaca gagal:", weather.reason);
  }

  const body: AirResponse = {
    location: { lat: rLat, lon: rLon },
    updatedAt: air.value.updatedAt,
    timezone: air.value.timezone,
    pollutants: air.value.pollutants,
    weather:
      weather.status === "fulfilled" ? weather.value : { temperature: null, humidity: null },
    source: "Open-Meteo Air Quality (model CAMS)",
    isMock: false,
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=300`,
    },
  });
}
