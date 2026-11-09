import { NextRequest, NextResponse } from "next/server";
import { parseCoord, round2 } from "@/lib/coords";
import { FORECAST_HOURS, localHourKey, sliceFromNow } from "@/lib/forecast";
import type { ForecastPoint, ForecastResponse } from "@/lib/forecast";

/**
 * GET /api/forecast?lat=-6.2&lon=106.8
 *
 * Prakiraan PM2.5 per jam untuk 72 jam ke depan dari Open-Meteo Air Quality
 * (tanpa API key). Open-Meteo mengirim data sejak 00.00 hari ini, jadi kita
 * minta 4 hari lalu memotongnya mulai dari jam saat ini di lokasi tersebut.
 *
 * Cache: 15 menit (sama seperti /api/air). Bila Open-Meteo gagal, route
 * membalas 502 dan TIDAK mengarang grafik: halaman menampilkan pesan error.
 */

const AIR_URL =
  process.env.OPEN_METEO_AIR_URL ?? "https://air-quality-api.open-meteo.com/v1/air-quality";
const REVALIDATE_SECONDS = 15 * 60;
const TIMEOUT_MS = 8000;

type ForecastApiJson = {
  timezone?: string;
  utc_offset_seconds?: number;
  hourly?: { time?: unknown; pm2_5?: unknown };
};

async function fetchPoints(
  url: URL,
  useCache: boolean,
): Promise<{ points: ForecastPoint[]; timezone: string }> {
  const res = await fetch(url, {
    ...(useCache ? { next: { revalidate: REVALIDATE_SECONDS } } : { cache: "no-store" as const }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Open-Meteo membalas ${res.status}`);
  const json = (await res.json()) as ForecastApiJson;
  const offset = typeof json.utc_offset_seconds === "number" ? json.utc_offset_seconds : 0;
  return {
    points: sliceFromNow(json.hourly?.time, json.hourly?.pm2_5, localHourKey(Date.now(), offset), FORECAST_HOURS),
    timezone: typeof json.timezone === "string" ? json.timezone : "UTC",
  };
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const lat = parseCoord(sp.get("lat"), -90, 90);
  const lon = parseCoord(sp.get("lon"), -180, 180);
  if (lat === null || lon === null) {
    return NextResponse.json({ error: "Koordinat tidak valid." }, { status: 400 });
  }
  const rLat = round2(lat);
  const rLon = round2(lon);

  try {
    const url = new URL(AIR_URL);
    url.searchParams.set("latitude", String(rLat));
    url.searchParams.set("longitude", String(rLon));
    url.searchParams.set("hourly", "pm2_5");
    url.searchParams.set("forecast_days", "4");
    url.searchParams.set("timezone", "auto");

    let { points, timezone } = await fetchPoints(url, true);
    // Cache Next.js menyajikan data lama satu kali setelah kedaluwarsa. Bila data lama itu
    // sudah tidak mencakup 72 jam ke depan (mis. situs lama tidak dibuka), ambil yang baru.
    if (points.length < FORECAST_HOURS) ({ points, timezone } = await fetchPoints(url, false));
    if (points.length === 0 || points.every((p) => p.pm25 === null)) {
      throw new Error("Tidak ada data prakiraan untuk lokasi ini");
    }

    const body: ForecastResponse = {
      location: { lat: rLat, lon: rLon },
      timezone,
      generatedAt: new Date().toISOString(),
      points,
      source: "Open-Meteo Air Quality (model CAMS)",
    };
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=300`,
      },
    });
  } catch (err) {
    console.error("[api/forecast] gagal:", err instanceof Error ? err.message : "kesalahan tak dikenal");
    return NextResponse.json(
      { error: "Prakiraan belum bisa diambil." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}