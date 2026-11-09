/**
 * Titik panas (hotspot) kebakaran dari NASA FIRMS.
 * Lapisan ini opsional: hanya aktif bila FIRMS_MAP_KEY ada di .env.
 *
 * Catatan: titik panas adalah deteksi satelit atas suhu yang tinggi. Itu
 * BUKAN konfirmasi kebakaran. Bisa juga pembakaran lahan terencana atau
 * sumber panas lain, dan datanya tertunda beberapa jam.
 */
import { parseCoord } from "./coords";

export type FireConfidence = "rendah" | "normal" | "tinggi";

export type FirePoint = {
  lat: number;
  lon: number;
  /** Waktu deteksi satelit (ISO 8601, UTC). */
  time: string;
  /** Fire Radiative Power (MW): ukuran kekuatan api. */
  frp: number | null;
  confidence: FireConfidence | null;
};

export type FiresResponse = {
  fires: FirePoint[];
  /** Jumlah titik sebelum dipangkas ke MAX_FIRES. */
  total: number;
  truncated: boolean;
  source: string;
  fetchedAt: string;
};

export type Bbox = { west: number; south: number; east: number; north: number };

/** Batas luas area per permintaan, supaya data tetap kecil. */
export const MAX_SPAN_LON = 90;
export const MAX_SPAN_LAT = 60;
export const MAX_FIRES = 1000;
/** Di bawah zoom ini peta terlalu luas, permintaan tidak dikirim. */
export const MIN_FIRE_ZOOM = 4;

/**
 * Bulatkan area keluar ke derajat penuh dan batasi ke dunia.
 * Pembulatan membuat pergeseran peta kecil memakai cache yang sama.
 * Mengembalikan null bila area tidak valid atau terlalu luas.
 */
export function roundBbox(b: Bbox): Bbox | null {
  const nums = [b.west, b.south, b.east, b.north];
  if (!nums.every(Number.isFinite)) return null;
  const west = Math.max(-180, Math.floor(b.west));
  const south = Math.max(-90, Math.floor(b.south));
  const east = Math.min(180, Math.ceil(b.east));
  const north = Math.min(90, Math.ceil(b.north));
  if (west >= east || south >= north) return null;
  if (east - west > MAX_SPAN_LON || north - south > MAX_SPAN_LAT) return null;
  return { west, south, east, north };
}

/** Baca area dari query string (west, south, east, north). */
export function sanitizeBbox(raw: {
  west: string | null;
  south: string | null;
  east: string | null;
  north: string | null;
}): Bbox | null {
  const west = parseCoord(raw.west, -180, 180);
  const east = parseCoord(raw.east, -180, 180);
  const south = parseCoord(raw.south, -90, 90);
  const north = parseCoord(raw.north, -90, 90);
  if (west === null || east === null || south === null || north === null) return null;
  return roundBbox({ west, south, east, north });
}

function toConfidence(raw: string | undefined): FireConfidence | null {
  if (raw === undefined) return null;
  const v = raw.trim().toLowerCase();
  // VIIRS memakai huruf: l (low), n (nominal), h (high)
  if (v === "l" || v === "low") return "rendah";
  if (v === "n" || v === "nominal") return "normal";
  if (v === "h" || v === "high") return "tinggi";
  // MODIS memakai angka 0-100
  const n = Number(v);
  if (v !== "" && Number.isFinite(n)) return n < 30 ? "rendah" : n < 80 ? "normal" : "tinggi";
  return null;
}

/**
 * Ubah CSV FIRMS menjadi daftar titik. Kolom dicari lewat nama di baris judul,
 * jadi urutan kolom tidak berpengaruh. Baris yang rusak dilewati.
 * Melempar Error bila respons bukan CSV FIRMS (mis. pesan kunci tidak valid).
 */
export function parseFirmsCsv(csv: string): { fires: FirePoint[]; total: number; truncated: boolean } {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim() !== "");
  const header = (lines[0] ?? "").split(",").map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const iLat = col("latitude");
  const iLon = col("longitude");
  const iDate = col("acq_date");
  if (iLat < 0 || iLon < 0 || iDate < 0) throw new Error("Respons FIRMS tidak dikenali");
  const iTime = col("acq_time");
  const iFrp = col("frp");
  const iConf = col("confidence");

  const all: FirePoint[] = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    const lat = Number(cells[iLat]);
    const lon = Number(cells[iLon]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      continue;
    }
    const hhmm = (iTime >= 0 ? (cells[iTime] ?? "").trim() : "").padStart(4, "0");
    const iso = `${(cells[iDate] ?? "").trim()}T${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}:00Z`;
    if (Number.isNaN(Date.parse(iso))) continue;
    const frp = iFrp >= 0 && cells[iFrp]?.trim() !== "" ? Number(cells[iFrp]) : Number.NaN;
    all.push({
      lat,
      lon,
      time: iso,
      frp: Number.isFinite(frp) ? frp : null,
      confidence: iConf >= 0 ? toConfidence(cells[iConf]) : null,
    });
  }

  // Bila terlalu banyak, simpan yang api-nya paling kuat
  all.sort((a, b) => (b.frp ?? -1) - (a.frp ?? -1));
  return { fires: all.slice(0, MAX_FIRES), total: all.length, truncated: all.length > MAX_FIRES };
}