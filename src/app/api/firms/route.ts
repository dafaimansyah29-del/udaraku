import { NextRequest, NextResponse } from "next/server";
import { parseFirmsCsv, sanitizeBbox } from "@/lib/firms";
import type { FiresResponse } from "@/lib/firms";

/**
 * GET /api/firms?west=95&south=-11&east=141&north=6
 *
 * Titik panas kebakaran NASA FIRMS (VIIRS S-NPP, data hampir real-time)
 * untuk sekitar 24 jam terakhir di dalam area yang diminta.
 *
 * Lapisan ini OPSIONAL. Kunci API (FIRMS_MAP_KEY) hanya dibaca di server dan
 * tidak pernah dikirim ke peramban. Tanpa kunci, route membalas 404 dan
 * halaman Peta menyembunyikan tombolnya. Kunci gratis:
 * https://firms.modaps.eosdis.nasa.gov/api/area/
 *
 * Area dibulatkan ke derajat penuh dan di-cache 10 menit.
 */

const FIRMS_URL =
  process.env.FIRMS_API_URL ?? "https://firms.modaps.eosdis.nasa.gov/api/area/csv";
const SOURCE = "VIIRS_SNPP_NRT";
const DAY_RANGE = 1;
const REVALIDATE_SECONDS = 10 * 60;
const TIMEOUT_MS = 10_000;

export async function GET(request: NextRequest) {
  const key = process.env.FIRMS_MAP_KEY?.trim();
  if (!key) {
    return NextResponse.json({ error: "Lapisan titik panas tidak aktif." }, { status: 404 });
  }

  const sp = request.nextUrl.searchParams;
  const bbox = sanitizeBbox({
    west: sp.get("west"),
    south: sp.get("south"),
    east: sp.get("east"),
    north: sp.get("north"),
  });
  if (!bbox) {
    return NextResponse.json(
      { error: "Area peta tidak valid atau terlalu luas. Perbesar (zoom in) peta." },
      { status: 400 },
    );
  }

  try {
    const area = `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;
    const res = await fetch(`${FIRMS_URL}/${encodeURIComponent(key)}/${SOURCE}/${area}/${DAY_RANGE}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`FIRMS membalas ${res.status}`);
    const parsed = parseFirmsCsv(await res.text());

    const body: FiresResponse = {
      ...parsed,
      source: "NASA FIRMS (VIIRS S-NPP)",
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=120`,
      },
    });
  } catch (err) {
    // Jangan mencatat URL: di dalamnya ada kunci API.
    console.error("[api/firms] gagal:", err instanceof Error ? err.message : "kesalahan tak dikenal");
    return NextResponse.json(
      { error: "Data titik panas belum bisa diambil." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}