import { describe, expect, it } from "vitest";
import { pm25Category, pm25Zones } from "./aqi";
import {
  bestHours,
  dayLabel,
  dayName,
  formatHour,
  hourOf,
  localHourKey,
  niceCeil,
  sliceFromNow,
  summarize,
} from "./forecast";
import type { ForecastPoint } from "./forecast";

const hourly = (startDay: string, hours: number) =>
  Array.from({ length: hours }, (_, i) => {
    const d = new Date(`${startDay}T00:00:00Z`);
    d.setUTCHours(i);
    return d.toISOString().slice(0, 16);
  });

describe("localHourKey", () => {
  it("mengubah UTC ke jam lokal memakai selisih zona", () => {
    // 2026-10-29 06:40 UTC = 13:40 WIB (UTC+7)
    const now = Date.UTC(2026, 9, 29, 6, 40);
    expect(localHourKey(now, 7 * 3600)).toBe("2026-10-29T13:00");
  });
  it("melewati pergantian hari", () => {
    const now = Date.UTC(2026, 9, 29, 20, 5);
    expect(localHourKey(now, 7 * 3600)).toBe("2026-10-30T03:00");
  });
});

describe("sliceFromNow", () => {
  const times = hourly("2026-10-29", 96);
  const values = times.map((_, i) => i);

  it("mulai dari jam sekarang dan mengambil 72 titik", () => {
    const pts = sliceFromNow(times, values, "2026-10-29T14:00", 72);
    expect(pts).toHaveLength(72);
    expect(pts[0]).toEqual({ time: "2026-10-29T14:00", pm25: 14 });
    expect(pts[71].time).toBe("2026-11-01T13:00");
  });
  it("tetap 72 titik walau sekarang jam 23.00", () => {
    expect(sliceFromNow(times, values, "2026-10-29T23:00", 72)).toHaveLength(72);
  });
  it("mengubah nilai tidak valid menjadi null", () => {
    const v: unknown[] = [...values];
    v[14] = null;
    v[15] = "x";
    v[16] = -3;
    v[17] = Number.NaN;
    const pts = sliceFromNow(times, v, "2026-10-29T14:00", 5);
    expect(pts.map((p) => p.pm25)).toEqual([null, null, null, null, 18]);
  });
  it("mengembalikan [] bila masukan bukan array atau jam sekarang tidak ada", () => {
    expect(sliceFromNow(undefined, values, "2026-10-29T14:00")).toEqual([]);
    expect(sliceFromNow(times, "x", "2026-10-29T14:00")).toEqual([]);
    expect(sliceFromNow(times, values, "2027-01-01T00:00")).toEqual([]);
  });
});

describe("waktu", () => {
  it("hourOf, formatHour", () => {
    expect(hourOf("2026-10-29T05:00")).toBe(5);
    expect(formatHour("2026-10-29T05:00")).toBe("05.00");
    expect(formatHour("rusak")).toBe("-");
    expect(Number.isNaN(hourOf("rusak"))).toBe(true);
  });
  it("dayLabel relatif terhadap jam sekarang", () => {
    const now = "2026-10-29T14:00"; // Kamis
    expect(dayLabel("2026-10-29T20:00", now)).toBe("Hari ini");
    expect(dayLabel("2026-10-30T00:00", now)).toBe("Besok");
    expect(dayLabel("2026-10-31T09:00", now)).toBe("Lusa");
    expect(dayLabel("2026-11-01T09:00", now)).toBe("Minggu");
  });
  it("dayName benar untuk tanggal yang diketahui", () => {
    expect(dayName("2026-10-29T00:00")).toBe("Kamis");
    expect(dayName("2026-10-30T00:00")).toBe("Jumat");
  });
});

describe("bestHours", () => {
  const mk = (vals: (number | null)[], startHour = 0): ForecastPoint[] =>
    vals.map((pm25, i) => ({
      time: `2026-10-29T${String((startHour + i) % 24).padStart(2, "0")}:00`,
      pm25,
    }));

  it("memilih 3 jam terendah, urut dari yang terendah", () => {
    const pts = mk([30, 12, 25, 8, 40, 9]);
    expect(bestHours(pts).map((h) => [h.rank, h.pm25])).toEqual([
      [1, 8],
      [2, 9],
      [3, 12],
    ]);
  });
  it("hanya melihat 24 jam pertama", () => {
    const vals = Array.from({ length: 72 }, (_, i) => (i < 24 ? 50 : 1));
    const best = bestHours(mk(vals));
    expect(best).toHaveLength(3);
    expect(best.every((h) => h.pm25 === 50)).toBe(true);
  });
  it("mengabaikan null dan nilai yang sama diurutkan dari jam paling awal", () => {
    const pts = mk([null, 10, 10, 10, 10]);
    expect(bestHours(pts).map((h) => h.time.slice(11, 13))).toEqual(["01", "02", "03"]);
  });
  it("kurang dari 3 data: kembalikan yang ada; kosong: []", () => {
    expect(bestHours(mk([null, 7, null]))).toHaveLength(1);
    expect(bestHours(mk([null, null]))).toEqual([]);
    expect(bestHours([])).toEqual([]);
  });
  it("opsi siang hari hanya 05.00 sampai 21.00", () => {
    const pts = mk([1, 1, 1, 50, 50, 20, 30, 40, 99], 0); // jam 0..8
    const night = bestHours(pts, { daytimeOnly: true });
    expect(night.every((h) => hourOf(h.time) >= 5)).toBe(true);
    expect(night.map((h) => h.pm25)).toEqual([20, 30, 40]);
    // batas: jam 21 termasuk, jam 22 dan 04 tidak
    const edge = mk([1, 2, 3], 20); // 20, 21, 22
    expect(bestHours(edge, { daytimeOnly: true }).map((h) => hourOf(h.time))).toEqual([20, 21]);
  });
});

describe("summarize", () => {
  it("menghitung sekarang, tertinggi, dan rata-rata (null dilewati)", () => {
    const s = summarize([
      { time: "a", pm25: 10 },
      { time: "b", pm25: null },
      { time: "c", pm25: 30 },
    ]);
    expect(s.now).toBe(10);
    expect(s.max).toEqual({ time: "c", pm25: 30 });
    expect(s.average).toBe(20);
  });
  it("semua null", () => {
    expect(summarize([{ time: "a", pm25: null }])).toEqual({ now: null, max: null, average: null });
  });
});

describe("niceCeil", () => {
  it("membulatkan ke atas dengan langkah yang rapi", () => {
    expect(niceCeil(0)).toBe(5);
    expect(niceCeil(24.1)).toBe(30);
    expect(niceCeil(61)).toBe(75);
    expect(niceCeil(151)).toBe(200);
  });
});

describe("pm25Zones", () => {
  it("ISPU: 5 zona berurutan, batas atas mengikuti tabel ISPU", () => {
    const z = pm25Zones("ispu");
    expect(z).toHaveLength(5);
    expect(z[0]).toMatchObject({ from: 0, to: 15.5 });
    expect(z[1]).toMatchObject({ from: 15.5, to: 55.4 });
    z.forEach((zone, i) => i > 0 && expect(zone.from).toBe(z[i - 1].to));
  });
  it("US AQI: 6 zona, batas Baik 9,0 (revisi EPA 2024)", () => {
    const z = pm25Zones("us");
    expect(z).toHaveLength(6);
    expect(z[0].to).toBe(9);
    expect(z[5].category.label).toBe("Berbahaya");
  });
  it("kategori nilai sejalan dengan zona", () => {
    expect(pm25Category("ispu", 10).label).toBe("Baik");
    expect(pm25Category("ispu", 52.3).label).toBe("Sedang");
    expect(pm25Category("ispu", 100).label).toBe("Tidak Sehat");
    expect(pm25Category("us", 8).label).toBe("Baik");
    expect(pm25Category("us", 20).label).toBe("Sedang");
  });
});