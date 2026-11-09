import { describe, expect, it } from "vitest";
import { LAST_AIR_KEY } from "./last-air";
import type { StorageLike } from "./last-air";
import { ALERT_DISMISS_KEY, CACHE_PREFIX, LOCAL_KEYS, clearAllLocalData } from "./local-data";
import { NOTIFY_KEY } from "./notify";
import { STORAGE_KEY } from "./risk-storage";

const mem = (initial: Record<string, string>): StorageLike & { data: Record<string, string> } => {
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
};

const fakeCaches = (names: string[]) => {
  const left = new Set(names);
  return {
    left,
    keys: async () => [...left],
    delete: async (n: string) => left.delete(n),
  };
};

describe("clearAllLocalData", () => {
  it("menghapus semua kunci UdaraKu dan cache berawalan udaraku-, tetapi tidak milik pihak lain", async () => {
    const local = mem({ [STORAGE_KEY]: "{}", [LAST_AIR_KEY]: "{}", [NOTIFY_KEY]: "{}", "lain:kunci": "tetap" });
    const session = mem({ [ALERT_DISMISS_KEY]: "1", "lain:sesi": "tetap" });
    const caches = fakeCaches([`${CACHE_PREFIX}api-v1`, `${CACHE_PREFIX}pages-v1`, "cache-orang-lain"]);

    const report = await clearAllLocalData({ local, session, cacheStorage: caches, notify: false });

    expect(report).toEqual({ keys: 4, caches: 2, ok: true });
    expect(Object.keys(local.data)).toEqual(["lain:kunci"]);
    expect(Object.keys(session.data)).toEqual(["lain:sesi"]);
    expect([...caches.left]).toEqual(["cache-orang-lain"]);
  });

  it("menghitung hanya data yang benar-benar ada (laporan jujur)", async () => {
    const local = mem({ [LAST_AIR_KEY]: "{}" });
    const report = await clearAllLocalData({ local, session: mem({}), cacheStorage: fakeCaches([]), notify: false });
    expect(report).toEqual({ keys: 1, caches: 0, ok: true });
    const empty = await clearAllLocalData({ local: mem({}), session: mem({}), cacheStorage: fakeCaches([]), notify: false });
    expect(empty).toEqual({ keys: 0, caches: 0, ok: true });
  });

  it("LOCAL_KEYS mencakup profil, lokasi terakhir, dan notifikasi", () => {
    expect([...LOCAL_KEYS].sort()).toEqual([LAST_AIR_KEY, NOTIFY_KEY, STORAGE_KEY].sort());
  });

  it("satu kegagalan tidak menghentikan langkah lain dan dilaporkan (ok: false)", async () => {
    const local = mem({ [LAST_AIR_KEY]: "{}" });
    const session: StorageLike = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    const caches = fakeCaches([`${CACHE_PREFIX}api-v1`]);
    const report = await clearAllLocalData({ local, session, cacheStorage: caches, notify: false });
    expect(report.ok).toBe(false);
    expect(report.keys).toBe(1);
    expect(report.caches).toBe(1);
    expect(local.data[LAST_AIR_KEY]).toBeUndefined();
    expect(caches.left.size).toBe(0);
  });

  it("cache yang gagal dihapus dilaporkan, penyimpanan tetap terhapus", async () => {
    const local = mem({ [NOTIFY_KEY]: "{}" });
    const report = await clearAllLocalData({
      local,
      session: null,
      cacheStorage: {
        keys: async () => {
          throw new Error("x");
        },
        delete: async () => false,
      },
      notify: false,
    });
    expect(report).toEqual({ keys: 1, caches: 0, ok: false });
    expect(local.data[NOTIFY_KEY]).toBeUndefined();
  });

  it("aman bila semua penyimpanan tidak tersedia", async () => {
    await expect(clearAllLocalData({ local: null, session: null, cacheStorage: null, notify: false })).resolves.toEqual({
      keys: 0,
      caches: 0,
      ok: true,
    });
  });
});