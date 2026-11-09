/**
 * Hapus semua data UdaraKu di perangkat ini: profil kalkulator, data udara
 * terakhir, pengaturan notifikasi, tanda "banner ditutup", dan cache service
 * worker (yang berisi halaman dan jawaban API termasuk koordinat lokasi yang
 * pernah dilihat). Laporannya jujur: hanya menghitung yang benar-benar ada, dan
 * `ok: false` bila ada langkah yang gagal (langkah lain tetap dijalankan).
 */
import { LAST_AIR_EVENT, LAST_AIR_KEY } from "./last-air";
import type { StorageLike } from "./last-air";
import { NOTIFY_KEY, NOTIF_CHANGED_EVENT } from "./notify";
import { STORAGE_KEY as PROFILE_KEY, getStorage } from "./risk-storage";

/** Kunci sessionStorage: tingkat banner terakhir yang ditutup pengguna. */
export const ALERT_DISMISS_KEY = "udaraku:banner-ditutup:v1";
/** Semua cache milik UdaraKu berawalan ini (lihat public/sw.js). */
export const CACHE_PREFIX = "udaraku-";

/** Kunci localStorage milik UdaraKu. */
export const LOCAL_KEYS = [PROFILE_KEY, LAST_AIR_KEY, NOTIFY_KEY] as const;

/** Bagian CacheStorage yang dipakai, supaya mudah diganti saat uji. */
export type CacheStorageLike = {
  keys: () => Promise<string[]>;
  delete: (name: string) => Promise<boolean>;
};

export type ClearOptions = {
  /** undefined = localStorage peramban; null = lewati. */
  local?: StorageLike | null;
  session?: StorageLike | null;
  cacheStorage?: CacheStorageLike | null;
  /** Kirim peristiwa ke window supaya banner dan tombol notifikasi ikut diperbarui. Bawaan true. */
  notify?: boolean;
};

export type ClearReport = {
  /** Jumlah data yang ada lalu dihapus (localStorage + sessionStorage). */
  keys: number;
  /** Jumlah cache yang dihapus. */
  caches: number;
  /** false bila ada langkah yang gagal. */
  ok: boolean;
};

function getSession(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : (window.sessionStorage ?? null);
  } catch {
    return null;
  }
}

function getCacheStorage(): CacheStorageLike | null {
  try {
    return typeof caches === "undefined" ? null : caches;
  } catch {
    return null;
  }
}

/** Hapus kunci dari satu storage. Mengembalikan jumlah yang ada, dan apakah semua langkah berhasil. */
function removeKeys(storage: StorageLike | null, keys: readonly string[]): { count: number; ok: boolean } {
  let count = 0;
  let ok = true;
  if (!storage) return { count, ok };
  for (const key of keys) {
    try {
      if (storage.getItem(key) !== null) count += 1;
    } catch {
      ok = false;
    }
    try {
      storage.removeItem(key);
    } catch {
      ok = false;
    }
  }
  return { count, ok };
}

export async function clearAllLocalData(options: ClearOptions = {}): Promise<ClearReport> {
  const local = options.local === undefined ? getStorage() : options.local;
  const session = options.session === undefined ? getSession() : options.session;
  const cacheStorage = options.cacheStorage === undefined ? getCacheStorage() : options.cacheStorage;

  const a = removeKeys(local, LOCAL_KEYS);
  const b = removeKeys(session, [ALERT_DISMISS_KEY]);
  let ok = a.ok && b.ok;

  let deleted = 0;
  if (cacheStorage) {
    try {
      const names = (await cacheStorage.keys()).filter((n) => n.startsWith(CACHE_PREFIX));
      const results = await Promise.all(
        names.map(async (n) => {
          try {
            return await cacheStorage.delete(n);
          } catch {
            return false;
          }
        }),
      );
      deleted = results.filter(Boolean).length;
      if (deleted !== names.length) ok = false;
    } catch {
      ok = false;
    }
  }

  if (options.notify !== false && typeof window !== "undefined") {
    try {
      window.dispatchEvent(new Event(LAST_AIR_EVENT));
      window.dispatchEvent(new Event(NOTIF_CHANGED_EVENT));
    } catch {
      /* tidak penting */
    }
  }

  return { keys: a.count + b.count, caches: deleted, ok };
}