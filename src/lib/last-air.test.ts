import { describe, expect, it } from "vitest";
import type { AirResponse, Place } from "./air-types";
import {
  LAST_AIR_KEY,
  ageMinutes,
  airFromSnapshot,
  clearSnapshot,
  loadSnapshot,
  samePlace,
  sanitizeSnapshot,
  saveSnapshot,
  snapshotFromAir,
} from "./last-air";
import type { StorageLike } from "./last-air";

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

const place: Place = { name: "Jakarta", subtitle: "DKI Jakarta, Indonesia", lat: -6.21, lon: 106.85 };
const air = (over: Partial<AirResponse> = {}): AirResponse => ({
  location: { lat: -6.21, lon: 106.85 },
  updatedAt: "2026-10-30T00:00:00.000Z",
  timezone: "Asia/Jakarta",
  pollutants: { pm2_5: 52.3, pm10: 80, no2: 1, o3: 1, so2: 1, co: 1 },
  weather: { temperature: 30, humidity: 70 },
  source: "Open-Meteo",
  isMock: false,
  ...over,
});
const NOW = new Date("2026-10-30T01:00:00.000Z");

describe("snapshotFromAir", () => {
  it("memetakan respons udara ke snapshot", () => {
    expect(snapshotFromAir(place, air(), NOW)).toEqual({
      v: 1,
      place: { name: "Jakarta", subtitle: "DKI Jakarta, Indonesia", lat: -6.21, lon: 106.85 },
      pm25: 52.3,
      updatedAt: "2026-10-30T00:00:00.000Z",
      timezone: "Asia/Jakarta",
      savedAt: NOW.toISOString(),
    });
  });

  it("TIDAK membuat snapshot dari data contoh (isMock)", () => {
    expect(snapshotFromAir(place, air({ isMock: true }), NOW)).toBeNull();
  });

  it("PM2.5 null dipertahankan (untuk menimpa lokasi lama)", () => {
    const a = air();
    a.pollutants.pm2_5 = null;
    expect(snapshotFromAir(place, a, NOW)?.pm25).toBeNull();
  });

  it("hanya memuat bidang yang dibutuhkan (tanpa polutan lain, cuaca, atau sumber)", () => {
    const keys = Object.keys(snapshotFromAir(place, air(), NOW)!).sort();
    expect(keys).toEqual(["place", "pm25", "savedAt", "timezone", "updatedAt", "v"]);
  });

  it("null bila datanya tidak sah (waktu rusak)", () => {
    expect(snapshotFromAir(place, air({ updatedAt: "kemarin" }), NOW)).toBeNull();
  });
});

describe("saveSnapshot / loadSnapshot / clearSnapshot", () => {
  const snap = snapshotFromAir(place, air(), NOW)!;

  it("menyimpan lalu membaca kembali isi yang sama", () => {
    const s = memoryStorage();
    expect(saveSnapshot(snap, s)).toBe(true);
    expect(loadSnapshot(s)).toEqual(snap);
  });

  it("menolak snapshot yang tidak sah", () => {
    const s = memoryStorage();
    expect(saveSnapshot({ ...snap, pm25: -5 }, s)).toBe(false);
    expect(s.data[LAST_AIR_KEY]).toBeUndefined();
  });

  it("tidak melempar bila storage null atau penuh/diblokir", () => {
    expect(saveSnapshot(snap, null)).toBe(false);
    expect(loadSnapshot(null)).toBeNull();
    const broken: StorageLike = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(saveSnapshot(snap, broken)).toBe(false);
    expect(loadSnapshot(broken)).toBeNull();
    expect(() => clearSnapshot(broken)).not.toThrow();
  });

  it("JSON rusak menghasilkan null", () => {
    expect(loadSnapshot(memoryStorage({ [LAST_AIR_KEY]: "{bukan json" }))).toBeNull();
  });

  it("clearSnapshot menghapus data", () => {
    const s = memoryStorage();
    saveSnapshot(snap, s);
    clearSnapshot(s);
    expect(loadSnapshot(s)).toBeNull();
  });
});

describe("sanitizeSnapshot (data dari localStorage tidak dipercaya)", () => {
  const good = {
    v: 1,
    place: { name: "Bandung", lat: -6.9, lon: 107.6 },
    pm25: 20,
    updatedAt: "2026-10-30T00:00:00Z",
    timezone: "Asia/Jakarta",
    savedAt: "2026-10-30T00:05:00Z",
  };

  it("menerima data sah", () => {
    expect(sanitizeSnapshot(good)).not.toBeNull();
  });

  it.each([
    ["bukan objek", "teks"],
    ["null", null],
    ["versi salah", { ...good, v: 2 }],
    ["lat di luar rentang", { ...good, place: { ...good.place, lat: 91 } }],
    ["lon bukan angka", { ...good, place: { ...good.place, lon: "107" } }],
    ["nama kosong", { ...good, place: { ...good.place, name: "" } }],
    ["nama terlalu panjang", { ...good, place: { ...good.place, name: "x".repeat(121) } }],
    ["pm25 negatif", { ...good, pm25: -1 }],
    ["pm25 NaN", { ...good, pm25: Number.NaN }],
    ["pm25 teks", { ...good, pm25: "50" }],
    ["updatedAt bukan tanggal", { ...good, updatedAt: "kemarin" }],
    ["timezone kosong", { ...good, timezone: "" }],
  ])("menolak: %s", (_name, value) => {
    expect(sanitizeSnapshot(value)).toBeNull();
  });

  it("membuang bidang tambahan yang tidak dikenal", () => {
    const got = sanitizeSnapshot({ ...good, evil: "<script>", place: { ...good.place, x: 1 } }) as unknown as Record<string, unknown>;
    expect(got.evil).toBeUndefined();
    expect((got.place as Record<string, unknown>).x).toBeUndefined();
  });
});

describe("ageMinutes", () => {
  const snap = snapshotFromAir(place, air(), new Date("2026-10-30T00:00:00Z"))!;
  const t0 = Date.parse("2026-10-30T00:00:00Z");

  it("menghitung menit sejak disimpan (bukan sejak waktu data sumber)", () => {
    expect(ageMinutes(snap, t0)).toBe(0);
    expect(ageMinutes(snap, t0 + 60 * 60_000)).toBe(60);
    expect(ageMinutes(snap, t0 + 90 * 60_000)).toBe(90);
  });

  it("tidak pernah negatif bila jam perangkat mundur", () => {
    expect(ageMinutes(snap, t0 - 5 * 60_000)).toBe(0);
  });

  it("waktu simpan yang rusak dianggap sangat tua", () => {
    expect(ageMinutes({ ...snap, savedAt: "rusak" })).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("samePlace", () => {
  it("sama bila selisih ≤ 0,01° (±1 km), beda bila lebih", () => {
    expect(samePlace({ lat: -6.21, lon: 106.85 }, { lat: -6.21, lon: 106.85 })).toBe(true);
    expect(samePlace({ lat: -6.21, lon: 106.85 }, { lat: -6.2149, lon: 106.8451 })).toBe(true);
    expect(samePlace({ lat: -6.21, lon: 106.85 }, { lat: -6.23, lon: 106.85 })).toBe(false);
    expect(samePlace({ lat: -6.21, lon: 106.85 }, { lat: -6.21, lon: 107.5 })).toBe(false);
  });
});

describe("airFromSnapshot", () => {
  it("hanya PM2.5 yang terisi, bukan data contoh, lokasi dan waktu sama", () => {
    const snap = snapshotFromAir(place, air(), NOW)!;
    const a = airFromSnapshot(snap);
    expect(a.isMock).toBe(false);
    expect(a.pollutants).toEqual({ pm2_5: 52.3, pm10: null, no2: null, o3: null, so2: null, co: null });
    expect(a.weather).toEqual({ temperature: null, humidity: null });
    expect(a.updatedAt).toBe(snap.updatedAt);
    expect(a.timezone).toBe(snap.timezone);
    expect(a.location).toEqual({ lat: -6.21, lon: 106.85 });
  });
});