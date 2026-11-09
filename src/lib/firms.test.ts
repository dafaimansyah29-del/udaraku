import { describe, expect, it } from "vitest";
import { MAX_FIRES, parseFirmsCsv, roundBbox, sanitizeBbox } from "./firms";

const HEADER = "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,confidence,version,bright_ti5,frp,daynight";

describe("parseFirmsCsv", () => {
  it("membaca kolom lewat nama dan menyusun waktu UTC", () => {
    const csv = `${HEADER}\n-2.51,112.40,340.1,0.4,0.4,2026-10-29,0130,N,h,2.0NRT,300.2,18.5,N\n`;
    const { fires, total, truncated } = parseFirmsCsv(csv);
    expect(total).toBe(1);
    expect(truncated).toBe(false);
    expect(fires[0]).toEqual({
      lat: -2.51,
      lon: 112.4,
      time: "2026-10-29T01:30:00Z",
      frp: 18.5,
      confidence: "tinggi",
    });
  });
  it("urutan kolom tidak berpengaruh", () => {
    const csv = "frp,acq_date,longitude,latitude,confidence,acq_time\n7.2,2026-10-29,100.5,1.5,n,945";
    expect(parseFirmsCsv(csv).fires[0]).toMatchObject({ lat: 1.5, lon: 100.5, time: "2026-10-29T09:45:00Z", frp: 7.2, confidence: "normal" });
  });
  it("keyakinan angka (MODIS) dan huruf (VIIRS)", () => {
    const csv = `latitude,longitude,acq_date,acq_time,confidence,frp\n1,1,2026-10-29,0000,10,1\n1,2,2026-10-29,0000,50,1\n1,3,2026-10-29,0000,95,1\n1,4,2026-10-29,0000,l,1\n1,5,2026-10-29,0000,zzz,1`;
    const conf = parseFirmsCsv(csv).fires.sort((a, b) => a.lon - b.lon).map((f) => f.confidence);
    expect(conf).toEqual(["rendah", "normal", "tinggi", "rendah", null]);
  });
  it("melewati baris rusak", () => {
    const csv = `latitude,longitude,acq_date,acq_time,frp\nabc,1,2026-10-29,0000,1\n1,2,bukan-tanggal,0000,1\n99,2,2026-10-29,0000,1\n3,4,2026-10-29,0000,\n5,6,2026-10-29,0000,2`;
    const { fires } = parseFirmsCsv(csv);
    expect(fires).toHaveLength(2);
    expect(fires.find((f) => f.lat === 3)?.frp).toBeNull();
  });
  it("hanya header = tidak ada titik", () => {
    expect(parseFirmsCsv(`${HEADER}\n`).fires).toEqual([]);
  });
  it("melempar error bila respons bukan CSV FIRMS (mis. kunci tidak valid)", () => {
    expect(() => parseFirmsCsv("Invalid MAP_KEY.")).toThrow();
    expect(() => parseFirmsCsv("")).toThrow();
  });
  it("memangkas ke MAX_FIRES titik terkuat", () => {
    const rows = Array.from({ length: MAX_FIRES + 50 }, (_, i) => `1,1,2026-10-29,0000,${i}`);
    const { fires, total, truncated } = parseFirmsCsv(`latitude,longitude,acq_date,acq_time,frp\n${rows.join("\n")}`);
    expect(total).toBe(MAX_FIRES + 50);
    expect(truncated).toBe(true);
    expect(fires).toHaveLength(MAX_FIRES);
    expect(fires[0].frp).toBe(MAX_FIRES + 49);
  });
});

describe("roundBbox / sanitizeBbox", () => {
  it("membulatkan keluar ke derajat penuh", () => {
    expect(roundBbox({ west: 95.2, south: -10.8, east: 120.1, north: 5.4 })).toEqual({
      west: 95,
      south: -11,
      east: 121,
      north: 6,
    });
  });
  it("menolak area terbalik, terlalu luas, atau bukan angka", () => {
    expect(roundBbox({ west: 10, south: 0, east: 5, north: 5 })).toBeNull();
    expect(roundBbox({ west: -180, south: -90, east: 180, north: 90 })).toBeNull();
    expect(roundBbox({ west: Number.NaN, south: 0, east: 5, north: 5 })).toBeNull();
  });
  it("membatasi ke batas dunia", () => {
    expect(roundBbox({ west: -200, south: -95, east: -150, north: -40 })).toEqual({
      west: -180,
      south: -90,
      east: -150,
      north: -40,
    });
  });
  it("sanitizeBbox membaca teks query dan menolak yang kosong", () => {
    expect(sanitizeBbox({ west: "95", south: "-11", east: "141", north: "6" })).toEqual({
      west: 95,
      south: -11,
      east: 141,
      north: 6,
    });
    expect(sanitizeBbox({ west: null, south: "-11", east: "141", north: "6" })).toBeNull();
    expect(sanitizeBbox({ west: "x", south: "-11", east: "141", north: "6" })).toBeNull();
    expect(sanitizeBbox({ west: "95", south: "-11", east: "999", north: "6" })).toBeNull();
  });
});