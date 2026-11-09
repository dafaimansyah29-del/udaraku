import { describe, expect, it } from "vitest";
import { ALERT_LEVELS, alertForPm25, alertIndexFor, whoMultiple } from "./alert";
import { WHO_PM25_24H } from "./risk-config";

describe("alertIndexFor", () => {
  it("tidak memberi peringatan sampai dan termasuk tepat 15 µg/m³", () => {
    expect(alertIndexFor(0)).toBe(-1);
    expect(alertIndexFor(14.99)).toBe(-1);
    expect(alertIndexFor(WHO_PM25_24H)).toBe(-1);
    expect(WHO_PM25_24H).toBe(15);
  });

  it("peringatan mulai tepat di atas 15", () => {
    expect(alertIndexFor(15.01)).toBe(0);
    expect(alertIndexFor(37.5)).toBe(0);
  });

  it("naik tingkat di atas batas (batas atas inklusif pada tingkat lama)", () => {
    expect(alertIndexFor(37.51)).toBe(1);
    expect(alertIndexFor(75)).toBe(1);
    expect(alertIndexFor(75.01)).toBe(2);
    expect(alertIndexFor(150)).toBe(2);
    expect(alertIndexFor(150.01)).toBe(3);
    expect(alertIndexFor(999)).toBe(3);
  });

  it("nilai kosong atau tidak sah tidak memicu peringatan", () => {
    expect(alertIndexFor(null)).toBe(-1);
    expect(alertIndexFor(undefined)).toBe(-1);
    expect(alertIndexFor(Number.NaN)).toBe(-1);
    expect(alertIndexFor(Number.POSITIVE_INFINITY)).toBe(-1);
    expect(alertIndexFor("50" as unknown as number)).toBe(-1);
  });
});

describe("alertForPm25", () => {
  it("null bila tidak perlu peringatan", () => {
    expect(alertForPm25(10)).toBeNull();
    expect(alertForPm25(15)).toBeNull();
    expect(alertForPm25(null)).toBeNull();
  });

  it("memuat indeks, tingkat, nilai, dan kelipatan WHO", () => {
    const r = alertForPm25(52.3)!;
    expect(r.index).toBe(1);
    expect(r.level.id).toBe("rentan");
    expect(r.pm25).toBe(52.3);
    expect(r.ratio).toBeCloseTo(3.4867, 3);
    expect(alertForPm25(80)?.level.id).toBe("tidak-sehat");
  });
});

describe("ALERT_LEVELS", () => {
  it("batasnya naik berurutan dan dimulai dari batas WHO", () => {
    expect(ALERT_LEVELS[0].above).toBe(WHO_PM25_24H);
    for (let i = 1; i < ALERT_LEVELS.length; i++) {
      expect(ALERT_LEVELS[i].above).toBeGreaterThan(ALERT_LEVELS[i - 1].above);
    }
  });

  it("warna dan warna teks berupa hex 6 digit dan berbeda antar-tingkat", () => {
    const colors = new Set<string>();
    for (const l of ALERT_LEVELS) {
      expect(l.color).toMatch(/^#[0-9A-F]{6}$/);
      expect(l.ink).toMatch(/^#[0-9A-F]{6}$/);
      colors.add(l.color);
    }
    expect(colors.size).toBe(ALERT_LEVELS.length);
  });

  /** Kontras WCAG: teks di atas warna latar tiap tingkat harus minimal 4,5:1 (AA). */
  it("kontras teks terhadap latar minimal 4,5:1 (WCAG AA)", () => {
    const lum = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => {
        const c = parseInt(hex.slice(i, i + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    for (const l of ALERT_LEVELS) {
      const [a, b] = [lum(l.color), lum(l.ink)].sort((x, y) => y - x);
      expect((a + 0.05) / (b + 0.05), l.id).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("whoMultiple", () => {
  it("kelipatan dari 15", () => {
    expect(whoMultiple(30)).toBe(2);
  });
});