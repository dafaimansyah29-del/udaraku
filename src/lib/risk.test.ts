import { describe, expect, it } from "vitest";
import {
  ageFactor,
  buildAdvice,
  calculateRisk,
  conditionFactor,
  levelForRatio,
  minutesForRatio,
  normalizeConditions,
  ratioToMeterPosition,
  validateForm,
  vulnerabilityFactor,
} from "./risk";
import type { RiskInput } from "./risk";
import {
  ACTIVITIES,
  ACTIVITY_ORDER,
  AGE_BANDS,
  CONDITIONS,
  MASKS,
  MASK_ORDER,
  REFERENCE_DOSE,
  RISK_LEVELS,
  WHO_PM25_24H,
} from "./risk-config";
import type { Condition } from "./risk-config";

/** Dewasa sehat, jalan 1 jam, tanpa masker, PM2.5 = 30 → dosis 45 µg → rasio 0,25. */
const base: RiskInput = {
  pm25: 30,
  age: 30,
  conditions: ["none"],
  activity: "walk",
  durationMin: 60,
  mask: "none",
};
const withInput = (patch: Partial<RiskInput>): RiskInput => ({ ...base, ...patch });

describe("konfigurasi", () => {
  it("ambang WHO 2021 untuk PM2.5 24 jam adalah 15 µg/m³", () => {
    expect(WHO_PM25_24H).toBe(15);
  });

  it("dosis acuan = 15 µg/m³ × 0,5 m³/jam × 24 jam = 180 µg", () => {
    expect(REFERENCE_DOSE).toBe(180);
  });

  it("tabel usia menutup 0-120 tanpa celah dan tanpa tumpang tindih", () => {
    expect(AGE_BANDS[0].min).toBe(0);
    expect(AGE_BANDS[AGE_BANDS.length - 1].max).toBe(120);
    for (let i = 1; i < AGE_BANDS.length; i++) {
      expect(AGE_BANDS[i].min).toBe(AGE_BANDS[i - 1].max + 1);
    }
  });

  it("kategori diurutkan naik dan dimulai dari rasio 0", () => {
    expect(RISK_LEVELS[0].minRatio).toBe(0);
    for (let i = 1; i < RISK_LEVELS.length; i++) {
      expect(RISK_LEVELS[i].minRatio).toBeGreaterThan(RISK_LEVELS[i - 1].minRatio);
    }
  });
});

describe("calculateRisk: rumus dosis", () => {
  it("lari 60 menit di PM2.5 30: dosis 108 µg, rasio 0,6, kategori Tinggi", () => {
    const r = calculateRisk(withInput({ activity: "run" }));
    expect(r.dose).toBeCloseTo(108, 9);
    expect(r.ratio).toBeCloseTo(0.6, 9);
    expect(r.level.label).toBe("Tinggi");
    expect(r.levelIndex).toBe(2);
  });

  it("memakai semua faktor: PM2.5 × laju napas × jam × kerentanan × (1 − masker)", () => {
    const input = withInput({
      pm25: 52.3,
      age: 8,
      conditions: ["asthma"],
      activity: "run",
      durationMin: 45,
      mask: "medical",
    });
    const expected = 52.3 * 3.6 * 0.75 * (1.5 * 1.8) * (1 - 0.35);
    const r = calculateRisk(input);
    expect(r.dose).toBeCloseTo(expected, 9);
    expect(r.ratio).toBeCloseTo(expected / 180, 9);
    expect(r.factors.vulnerability).toBeCloseTo(2.7, 9);
    expect(r.pm25VsWho).toBeCloseTo(52.3 / 15, 9);
  });

  it("PM2.5 nol menghasilkan dosis nol dan kategori Rendah", () => {
    const r = calculateRisk(withInput({ pm25: 0 }));
    expect(r.dose).toBe(0);
    expect(r.ratio).toBe(0);
    expect(r.level.id).toBe("low");
  });

  it("dosis naik linear terhadap durasi dan PM2.5", () => {
    const one = calculateRisk(withInput({ durationMin: 30 })).dose;
    expect(calculateRisk(withInput({ durationMin: 60 })).dose).toBeCloseTo(one * 2, 9);
    expect(calculateRisk(withInput({ durationMin: 90 })).dose).toBeCloseTo(one * 3, 9);
    const p = calculateRisk(withInput({ pm25: 10 })).dose;
    expect(calculateRisk(withInput({ pm25: 40 })).dose).toBeCloseTo(p * 4, 9);
  });

  it("makin berat aktivitas, makin besar dosis (diam < jalan < sepeda < lari)", () => {
    const doses = ACTIVITY_ORDER.map((a) => calculateRisk(withInput({ activity: a })).dose);
    for (let i = 1; i < doses.length; i++) expect(doses[i]).toBeGreaterThan(doses[i - 1]);
  });

  it("makin baik masker, makin kecil dosis; N95 menyisakan 20%", () => {
    const doses = MASK_ORDER.map((m) => calculateRisk(withInput({ mask: m })).dose);
    for (let i = 1; i < doses.length; i++) expect(doses[i]).toBeLessThan(doses[i - 1]);
    expect(calculateRisk(withInput({ mask: "n95" })).dose).toBeCloseTo(
      calculateRisk(withInput({ mask: "none" })).dose * (1 - MASKS.n95.effectiveness),
      9,
    );
  });

  it("kondisi rentan menaikkan dosis dibanding dewasa sehat", () => {
    const healthy = calculateRisk(base).dose;
    for (const c of ["asthma", "allergy", "chronic", "pregnant"] as Condition[]) {
      expect(calculateRisk(withInput({ conditions: [c] })).dose).toBeGreaterThan(healthy);
    }
    expect(calculateRisk(withInput({ age: 8 })).dose).toBeGreaterThan(healthy);
    expect(calculateRisk(withInput({ age: 80 })).dose).toBeGreaterThan(healthy);
  });

  it("menolak masukan tidak valid dengan RangeError", () => {
    expect(() => calculateRisk(withInput({ pm25: NaN }))).toThrow(RangeError);
    expect(() => calculateRisk(withInput({ pm25: -1 }))).toThrow(RangeError);
    expect(() => calculateRisk(withInput({ pm25: Infinity }))).toThrow(RangeError);
    expect(() => calculateRisk(withInput({ durationMin: -5 }))).toThrow(RangeError);
    expect(() => calculateRisk(withInput({ age: NaN }))).toThrow(RangeError);
  });
});

describe("batas kategori", () => {
  it("rasio tepat di batas masuk kategori yang lebih tinggi", () => {
    // jalan 60 menit: dosis = PM2.5 × 1,5 → rasio = PM2.5 / 120
    expect(calculateRisk(withInput({ pm25: 29.99 })).level.label).toBe("Rendah");
    expect(calculateRisk(withInput({ pm25: 30 })).level.label).toBe("Sedang"); // 0,25
    expect(calculateRisk(withInput({ pm25: 59.99 })).level.label).toBe("Sedang");
    expect(calculateRisk(withInput({ pm25: 60 })).level.label).toBe("Tinggi"); // 0,5
    expect(calculateRisk(withInput({ pm25: 119.9 })).level.label).toBe("Tinggi");
    expect(calculateRisk(withInput({ pm25: 120 })).level.label).toBe("Sangat Tinggi"); // 1,0
    expect(calculateRisk(withInput({ pm25: 400 })).level.label).toBe("Sangat Tinggi");
  });

  it("galat floating point tidak menggeser batas (0,7 − 0,45 ≈ 0,25)", () => {
    expect(0.7 - 0.45).not.toBe(0.25); // buktikan galatnya memang ada
    expect(levelForRatio(0.7 - 0.45).index).toBe(1);
  });

  it("udara tepat di batas WHO: jalan 1 jam = Rendah, lari 1 jam = Sedang", () => {
    expect(calculateRisk(withInput({ pm25: 15 })).level.label).toBe("Rendah");
    expect(calculateRisk(withInput({ pm25: 15, activity: "run" })).level.label).toBe("Sedang");
  });
});

describe("faktor kerentanan", () => {
  it("faktor usia per kelompok, termasuk batas-batasnya", () => {
    const cases: [number, number][] = [
      [0, 1.5], [12, 1.5], [13, 1.2], [17, 1.2], [18, 1], [59, 1],
      [60, 1.3], [74, 1.3], [75, 1.5], [120, 1.5],
    ];
    for (const [age, factor] of cases) expect(ageFactor(age)).toBe(factor);
  });

  it("beberapa kondisi: dipakai yang tertinggi, tidak dikali", () => {
    expect(conditionFactor(["asthma", "allergy"])).toBe(CONDITIONS.asthma.factor);
    expect(conditionFactor(["allergy", "pregnant"])).toBe(CONDITIONS.pregnant.factor);
    expect(conditionFactor(["asthma", "chronic", "pregnant"])).toBe(CONDITIONS.chronic.factor);
  });

  it("'Tidak ada' atau daftar kosong = 1,0; 'Tidak ada' diabaikan bila ada kondisi lain", () => {
    expect(conditionFactor(["none"])).toBe(1);
    expect(conditionFactor([])).toBe(1);
    expect(conditionFactor(["none", "asthma"])).toBe(CONDITIONS.asthma.factor);
  });

  it("faktor total = usia × kondisi, paling besar 3,0", () => {
    expect(vulnerabilityFactor(8, ["asthma"])).toBeCloseTo(2.7, 9);
    expect(vulnerabilityFactor(30, ["none"])).toBe(1);
    const max = Math.max(...AGE_BANDS.map((b) => b.factor)) * Math.max(...Object.values(CONDITIONS).map((c) => c.factor));
    expect(max).toBe(3);
    expect(vulnerabilityFactor(80, ["chronic"])).toBe(3);
  });
});

describe("minutesForRatio", () => {
  it("durasi hasilnya menghasilkan tepat rasio target", () => {
    const { durationMin: _ignored, ...rest } = base;
    void _ignored;
    for (const target of [0.25, 0.5, 1]) {
      const minutes = minutesForRatio({ ...rest, pm25: 80, activity: "run" }, target);
      const r = calculateRisk({ ...rest, pm25: 80, activity: "run", durationMin: minutes });
      expect(r.ratio).toBeCloseTo(target, 9);
    }
  });

  it("PM2.5 nol: tidak ada batas durasi (Infinity)", () => {
    const { durationMin: _ignored, ...rest } = base;
    void _ignored;
    expect(minutesForRatio({ ...rest, pm25: 0 }, 0.25)).toBe(Infinity);
  });
});

describe("ratioToMeterPosition", () => {
  it("titik-titik penting", () => {
    expect(ratioToMeterPosition(0)).toBe(0);
    expect(ratioToMeterPosition(0.25)).toBeCloseTo(0.25, 9);
    expect(ratioToMeterPosition(0.5)).toBeCloseTo(0.5, 9);
    expect(ratioToMeterPosition(0.75)).toBeCloseTo(0.625, 9);
    expect(ratioToMeterPosition(1)).toBeCloseTo(0.75, 9);
    expect(ratioToMeterPosition(2)).toBe(1);
  });

  it("selalu di rentang 0-1 dan tidak pernah turun saat rasio naik", () => {
    let prev = -1;
    for (let r = 0; r <= 3; r += 0.01) {
      const p = ratioToMeterPosition(r);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });

  it("masukan aneh tidak merusak meter", () => {
    expect(ratioToMeterPosition(-3)).toBe(0);
    expect(ratioToMeterPosition(NaN)).toBe(0);
    expect(ratioToMeterPosition(1e9)).toBe(1);
  });

  it("jarum berada di segmen yang sama dengan kategorinya", () => {
    for (const ratio of [0.1, 0.3, 0.7, 1.4]) {
      const segment = Math.min(3, Math.floor(ratioToMeterPosition(ratio) * 4));
      expect(segment).toBe(levelForRatio(ratio).index);
    }
  });
});

describe("validateForm", () => {
  it("menerima nilai wajar dan batas-batasnya", () => {
    expect(validateForm({ age: "30", duration: "30" })).toEqual({ ok: true, age: 30, durationMin: 30 });
    expect(validateForm({ age: "0", duration: "5" }).ok).toBe(true);
    expect(validateForm({ age: "120", duration: "480" }).ok).toBe(true);
    expect(validateForm({ age: " 25 ", duration: " 45 " }).ok).toBe(true);
  });

  it("menolak usia di luar 0-120, kosong, bukan angka, desimal, atau negatif", () => {
    for (const age of ["121", "", "abc", "12.5", "-1", "1e2", "٣٠"]) {
      const v = validateForm({ age, duration: "30" });
      expect(v.ok).toBe(false);
      if (!v.ok) expect(v.errors.age).toMatch(/usia 0-120/i);
    }
  });

  it("menolak durasi di luar 5-480 menit", () => {
    for (const duration of ["4", "481", "0", "", "x", "30.5"]) {
      const v = validateForm({ age: "30", duration });
      expect(v.ok).toBe(false);
      if (!v.ok) expect(v.errors.duration).toMatch(/durasi 5-480/i);
    }
  });

  it("melaporkan kedua galat sekaligus", () => {
    const v = validateForm({ age: "", duration: "" });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(Object.keys(v.errors).sort()).toEqual(["age", "duration"]);
  });
});

describe("normalizeConditions", () => {
  it("kosong menjadi ['none']", () => {
    expect(normalizeConditions([])).toEqual(["none"]);
  });
  it("'none' dibuang bila ada kondisi lain, duplikat dibuang", () => {
    expect(normalizeConditions(["none", "asthma", "asthma"])).toEqual(["asthma"]);
  });
  it("hanya 'none' tetap ['none']", () => {
    expect(normalizeConditions(["none", "none"])).toEqual(["none"]);
  });
});

describe("buildAdvice", () => {
  it("selalu tepat 3 saran, unik, dan tidak kosong untuk semua kombinasi", () => {
    const conditionSets: Condition[][] = [["none"], ["asthma"], ["chronic", "pregnant"], ["allergy"], ["asthma", "allergy", "chronic", "pregnant"]];
    let combos = 0;
    for (const activity of ACTIVITY_ORDER)
      for (const mask of MASK_ORDER)
        for (const conditions of conditionSets)
          for (const pm25 of [0, 10, 35, 80, 200, 500])
            for (const age of [5, 30, 70])
              for (const durationMin of [5, 30, 480]) {
                const input: RiskInput = { pm25, age, conditions, activity, durationMin, mask };
                const tips = buildAdvice(input, calculateRisk(input));
                expect(tips).toHaveLength(3);
                expect(new Set(tips).size).toBe(3);
                for (const t of tips) expect(t.trim().length).toBeGreaterThan(10);
                combos++;
              }
    expect(combos).toBe(4 * 4 * 5 * 6 * 3 * 3);
  });

  it("risiko Rendah: saran pertama menyatakan aman", () => {
    const input = withInput({ pm25: 5 });
    const tips = buildAdvice(input, calculateRisk(input));
    expect(tips[0]).toMatch(/aman/i);
  });

  it("lari saat risiko Sangat Tinggi: saran pertama menunda lari", () => {
    const input = withInput({ pm25: 120, activity: "run" });
    const result = calculateRisk(input);
    expect(result.level.id).toBe("very-high");
    expect(buildAdvice(input, result)[0]).toMatch(/tunda lari/i);
  });

  it("bersepeda saat risiko Tinggi: saran pertama menunda bersepeda", () => {
    const input = withInput({ pm25: 40, activity: "bike" });
    const result = calculateRisk(input);
    expect(result.level.id).toBe("high");
    expect(buildAdvice(input, result)[0]).toMatch(/tunda bersepeda/i);
  });

  it("tanpa masker dan risiko Sedang ke atas: menyarankan N95", () => {
    const input = withInput({ pm25: 40 });
    const tips = buildAdvice(input, calculateRisk(input));
    expect(tips.join(" ")).toMatch(/N95/);
  });

  it("sudah pakai N95: tidak menyuruh ganti ke N95, hanya memastikan pas", () => {
    const input = withInput({ pm25: 200, mask: "n95" });
    const text = buildAdvice(input, calculateRisk(input)).join(" ");
    expect(text).not.toMatch(/Pakai masker N95/);
    expect(text).toMatch(/rapat/i);
  });

  it("batas durasi yang disarankan benar-benar menurunkan risiko ke Rendah", () => {
    const input = withInput({ pm25: 60, durationMin: 120 });
    const tips = buildAdvice(input, calculateRisk(input));
    const tip = tips.find((t) => /Batasi aktivitas sekitar/.test(t));
    expect(tip).toBeDefined();
    const minutes = Number(/sekitar (\d+) menit/.exec(tip ?? "")?.[1]);
    expect(minutes).toBeGreaterThanOrEqual(5);
    expect(minutes).toBeLessThan(120);
    expect(calculateRisk({ ...input, durationMin: minutes }).level.id).toBe("low");
  });

  it("saran khusus kondisi muncul bila kondisi dipilih dan risiko tidak Rendah", () => {
    // 150 × 1,5 × 1 jam × 2,0 × (1 − 0,8) = 90 µg → rasio 0,5 → Tinggi, meski sudah pakai N95
    const input = withInput({ pm25: 150, conditions: ["chronic"], activity: "walk", mask: "n95" });
    const result = calculateRisk(input);
    expect(result.levelIndex).toBeGreaterThanOrEqual(1);
    expect(buildAdvice(input, result).join(" ")).toMatch(/pertolongan medis/i);
  });

  it("risiko Rendah: tidak ada saran khusus kondisi (tidak menakut-nakuti)", () => {
    // N95 menurunkan dosis penderita jantung/paru kronis ke Rendah
    const input = withInput({ pm25: 50, conditions: ["chronic"], mask: "n95" });
    const result = calculateRisk(input);
    expect(result.level.id).toBe("low");
    expect(buildAdvice(input, result).join(" ")).not.toMatch(/pertolongan medis/i);
  });
});

describe("kategori berubah masuk akal pada skenario nyata", () => {
  it("PM2.5 52 µg/m³ (±3,5× batas WHO): dewasa sehat jalan 30 menit Rendah, penderita asma Sedang", () => {
    const healthy = calculateRisk(withInput({ pm25: 52, durationMin: 30 }));
    const asthma = calculateRisk(withInput({ pm25: 52, durationMin: 30, conditions: ["asthma"] }));
    expect(healthy.level.id).toBe("low");
    expect(asthma.level.id).toBe("medium");
  });

  it("anak penderita asma lari 60 menit di PM2.5 52 µg/m³ tanpa masker: Sangat Tinggi; dengan N95 turun", () => {
    const input = withInput({ pm25: 52, age: 8, conditions: ["asthma"], activity: "run" });
    expect(calculateRisk(input).level.id).toBe("very-high");
    expect(calculateRisk({ ...input, mask: "n95" }).levelIndex).toBeLessThan(3);
  });

  it("udara bersih (PM2.5 8 µg/m³): lari 60 menit tetap Rendah", () => {
    expect(calculateRisk(withInput({ pm25: 8, activity: "run" })).level.id).toBe("low");
  });
});

describe("konsistensi tabel aktivitas", () => {
  it("laju napas 'diam' sama dengan laju napas acuan (0,5 m³/jam)", () => {
    expect(ACTIVITIES.idle.breathRate).toBe(0.5);
  });
});