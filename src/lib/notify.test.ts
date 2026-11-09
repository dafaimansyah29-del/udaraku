import { describe, expect, it } from "vitest";
import type { StorageLike } from "./last-air";
import {
  DEFAULT_PREFS,
  NOTIFY_KEY,
  NOTIFY_MIN_GAP_MS,
  clearPrefs,
  loadPrefs,
  placeKey,
  sanitizePrefs,
  savePrefs,
  shouldNotify,
} from "./notify";
import type { NotifyPrefs } from "./notify";

const mem = (): StorageLike & { data: Record<string, string> } => {
  const data: Record<string, string> = {};
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
};

const T0 = 1_000_000_000_000;
const on: NotifyPrefs = { ...DEFAULT_PREFS, enabled: true };
const notified = (level: number, place: string, at: number): NotifyPrefs => ({ ...on, lastLevel: level, lastAt: at, lastPlace: place });

describe("shouldNotify", () => {
  it("tidak pernah bila dimatikan atau tidak ada peringatan", () => {
    expect(shouldNotify(DEFAULT_PREFS, 1, "a", T0)).toBe(false);
    expect(shouldNotify(on, -1, "a", T0)).toBe(false);
  });

  it("ya untuk notifikasi pertama", () => {
    expect(shouldNotify(on, 0, "a", T0)).toBe(true);
  });

  it("tidak mengulang untuk lokasi dan tingkat sama dalam jarak minimum", () => {
    const p = notified(1, "a", T0);
    expect(shouldNotify(p, 1, "a", T0 + 1000)).toBe(false);
    expect(shouldNotify(p, 0, "a", T0 + 1000)).toBe(false);
    expect(shouldNotify(p, 1, "a", T0 + NOTIFY_MIN_GAP_MS - 1)).toBe(false);
  });

  it("ya bila tingkat naik, lokasi berganti, atau jarak minimum terlewati", () => {
    const p = notified(1, "a", T0);
    expect(shouldNotify(p, 2, "a", T0 + 1000)).toBe(true);
    expect(shouldNotify(p, 1, "b", T0 + 1000)).toBe(true);
    expect(shouldNotify(p, 1, "a", T0 + NOTIFY_MIN_GAP_MS)).toBe(true);
  });

  it("setelah udara bersih (lastLevel direset ke null), peringatan berikutnya langsung diberitahukan", () => {
    const reset: NotifyPrefs = { ...notified(1, "a", T0), lastLevel: null, lastAt: null };
    expect(shouldNotify(reset, 0, "a", T0 + 1000)).toBe(true);
  });
});

describe("placeKey", () => {
  it("membulatkan ke 1 desimal sehingga lokasi berdekatan memakai kunci sama", () => {
    expect(placeKey({ lat: -6.2088, lon: 106.8456 })).toBe("-6.2,106.8");
    expect(placeKey({ lat: -6.24, lon: 106.84 })).toBe(placeKey({ lat: -6.2, lon: 106.8 }));
  });
});

describe("prefs", () => {
  it("bawaan: mati, tanpa riwayat", () => {
    expect(loadPrefs(mem())).toEqual(DEFAULT_PREFS);
    expect(loadPrefs(null)).toEqual(DEFAULT_PREFS);
  });

  it("simpan lalu baca", () => {
    const s = mem();
    const prefs = notified(2, "-6.2,106.8", T0);
    expect(savePrefs(prefs, s)).toBe(true);
    expect(loadPrefs(s)).toEqual(prefs);
  });

  it("clearPrefs menghapus", () => {
    const s = mem();
    savePrefs(on, s);
    clearPrefs(s);
    expect(s.data[NOTIFY_KEY]).toBeUndefined();
  });

  it("data rusak atau tidak sah kembali ke bawaan", () => {
    expect(loadPrefs({ ...mem(), getItem: () => "{rusak" })).toEqual(DEFAULT_PREFS);
    expect(sanitizePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(sanitizePrefs({ v: 9, enabled: true })).toEqual(DEFAULT_PREFS);
    expect(sanitizePrefs({ v: 1, enabled: "ya" })).toEqual(DEFAULT_PREFS);
  });

  it("membuang riwayat yang tidak sah tetapi mempertahankan enabled", () => {
    const bad = (last: Record<string, unknown>) => sanitizePrefs({ v: 1, enabled: true, ...last });
    expect(bad({ lastLevel: 99, lastAt: 1, lastPlace: "a" })).toEqual({ ...on });
    expect(bad({ lastLevel: 1.5, lastAt: 1, lastPlace: "a" })).toEqual({ ...on });
    expect(bad({ lastLevel: "1", lastAt: 1, lastPlace: "a" })).toEqual({ ...on });
    expect(bad({ lastLevel: 1, lastAt: 1, lastPlace: "x".repeat(41) })).toEqual({ ...on, lastLevel: 1, lastAt: 1 });
  });

  it("storage yang melempar tidak membuat error", () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error("x");
      },
      setItem: () => {
        throw new Error("x");
      },
      removeItem: () => {
        throw new Error("x");
      },
    };
    expect(loadPrefs(broken)).toEqual(DEFAULT_PREFS);
    expect(savePrefs(on, broken)).toBe(false);
    expect(() => clearPrefs(broken)).not.toThrow();
  });
});