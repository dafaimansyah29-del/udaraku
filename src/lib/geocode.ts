import { SEARCH, API } from "@/lib/constants";
import type { Place } from "./air-types";

type GeocodingJson = {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    admin1?: string;
    country?: string;
  }>;
};

/**
 * Cari kota lewat Open-Meteo Geocoding API (tanpa API key, mendukung CORS).
 * Dipanggil langsung dari browser. Bila tidak ada hasil, API tidak memberi
 * field `results`, jadi hasilnya array kosong.
 */
export async function searchCities(query: string, signal?: AbortSignal): Promise<Place[]> {
  const url = new URL(API.OPEN_METEO_GEOCODING_URL);
  url.searchParams.set("name", query);
  url.searchParams.set("count", String(SEARCH.GEOCODING_RESULT_COUNT));
  url.searchParams.set("language", "id");
  url.searchParams.set("format", "json");

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Geocoding membalas ${res.status}`);

  const json = (await res.json()) as GeocodingJson;
  return (json.results ?? []).map((r) => ({
    name: r.name,
    subtitle: [r.admin1, r.country].filter(Boolean).join(", ") || undefined,
    lat: r.latitude,
    lon: r.longitude,
  }));
}
