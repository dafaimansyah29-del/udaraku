import { describe, expect, it } from "vitest";
import { clearForm, DEFAULT_FORM, loadForm, sanitizeForm, saveForm, STORAGE_KEY } from "./risk-storage";
import type { StorageLike } from "./risk-storage";
import type { FormValues } from "./risk";

/** Penyimpanan palsu di memori. */
function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

/** Penyimpanan yang selalu melempar galat (mode privat, kuota penuh, dll.). */
const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
  removeItem: () => {
    throw new Error("SecurityError");
  },
};

const profile: FormValues = {
  age: "67",
  conditions: ["asthma", "allergy"],
  activity: "run",
  duration: "90",
  mask: "n95",
};

describe("simpan dan muat profil", () => {
  it("bolak-balik menghasilkan data yang sama", () => {
    const s = memoryStorage();
    expect(saveForm(profile, s)).toBe(true);
    expect(loadForm(s)).toEqual(profile);
  });

  it("belum ada data tersimpan: loadForm mengembalikan null", () => {
    expect(loadForm(memoryStorage())).toBeNull();
  });

  it("clearForm menghapus data dan loadForm kembali null", () => {
    const s = memoryStorage();
    saveForm(profile, s);
    expect(s.data[STORAGE_KEY]).toBeDefined();
    expect(clearForm(s)).toBe(true);
    expect(s.data[STORAGE_KEY]).toBeUndefined();
    expect(loadForm(s)).toBeNull();
  });

  it("yang disimpan hanya field profil dengan nomor versi", () => {
    const s = memoryStorage();
    saveForm(profile, s);
    const stored = JSON.parse(s.data[STORAGE_KEY]);
    expect(Object.keys(stored).sort()).toEqual(["form", "v"]);
    expect(Object.keys(stored.form).sort()).toEqual(["activity", "age", "conditions", "duration", "mask"]);
  });
});

describe("tahan galat penyimpanan (try/catch)", () => {
  it("penyimpanan yang melempar galat tidak membuat aplikasi crash", () => {
    expect(loadForm(throwingStorage)).toBeNull();
    expect(saveForm(profile, throwingStorage)).toBe(false);
    expect(clearForm(throwingStorage)).toBe(false);
  });

  it("penyimpanan tidak tersedia (null) ditangani", () => {
    expect(loadForm(null)).toBeNull();
    expect(saveForm(profile, null)).toBe(false);
    expect(clearForm(null)).toBe(false);
  });

  it("JSON rusak atau versi berbeda diabaikan", () => {
    expect(loadForm(memoryStorage({ [STORAGE_KEY]: "{bukan json" }))).toBeNull();
    expect(loadForm(memoryStorage({ [STORAGE_KEY]: "null" }))).toBeNull();
    expect(loadForm(memoryStorage({ [STORAGE_KEY]: JSON.stringify({ v: 99, form: profile }) }))).toBeNull();
    expect(loadForm(memoryStorage({ [STORAGE_KEY]: JSON.stringify([1, 2, 3]) }))).toBeNull();
  });
});

describe("sanitizeForm: isi penyimpanan tidak dipercaya", () => {
  it("data valid lolos apa adanya", () => {
    expect(sanitizeForm(profile)).toEqual(profile);
  });

  it("bukan objek: semua field memakai nilai bawaan", () => {
    for (const raw of [null, undefined, 42, "teks", [], true]) {
      expect(sanitizeForm(raw)).toEqual(DEFAULT_FORM);
    }
  });

  it("field yang rusak diganti bawaan, field yang benar dipertahankan", () => {
    const out = sanitizeForm({ age: "<script>alert(1)</script>", duration: "45", activity: "terbang", mask: "n95", conditions: "asma" });
    expect(out.age).toBe(DEFAULT_FORM.age);
    expect(out.duration).toBe("45");
    expect(out.activity).toBe(DEFAULT_FORM.activity);
    expect(out.mask).toBe("n95");
    expect(out.conditions).toEqual(DEFAULT_FORM.conditions);
  });

  it("angka bukan string, terlalu panjang, atau negatif ditolak", () => {
    expect(sanitizeForm({ age: 30 }).age).toBe(DEFAULT_FORM.age);
    expect(sanitizeForm({ age: "1234" }).age).toBe(DEFAULT_FORM.age);
    expect(sanitizeForm({ duration: "-5" }).duration).toBe(DEFAULT_FORM.duration);
  });

  it("kondisi tak dikenal dibuang, 'none' dirapikan", () => {
    expect(sanitizeForm({ conditions: ["asthma", "kanker", 7, "none"] }).conditions).toEqual(["asthma"]);
    expect(sanitizeForm({ conditions: ["kanker"] }).conditions).toEqual(["none"]);
    expect(sanitizeForm({ conditions: [] }).conditions).toEqual(["none"]);
  });

  it("nama properti bawaan JavaScript tidak dianggap pilihan valid", () => {
    for (const evil of ["toString", "constructor", "__proto__", "hasOwnProperty"]) {
      const out = sanitizeForm({ activity: evil, mask: evil, conditions: [evil] });
      expect(out.activity).toBe(DEFAULT_FORM.activity);
      expect(out.mask).toBe(DEFAULT_FORM.mask);
      expect(out.conditions).toEqual(["none"]);
    }
  });
});