/**
 * Penyimpanan profil kalkulator di localStorage perangkat pengguna.
 * Data TIDAK dikirim ke server mana pun. Semua akses dibungkus try/catch
 * karena localStorage bisa melempar galat atau kosong (mode privat, data
 * situs diblokir, kuota penuh, dll.). Aplikasi harus tetap jalan tanpanya.
 */
import { ACTIVITIES, CONDITIONS, MASKS } from "./risk-config";
import type { Activity, Condition, Mask } from "./risk-config";
import { normalizeConditions } from "./risk";
import type { FormValues } from "./risk";

export const STORAGE_KEY = "udaraku:profil-risiko:v1";
const STORAGE_VERSION = 1;

export const DEFAULT_FORM: FormValues = {
  age: "30",
  conditions: ["none"],
  activity: "walk",
  duration: "30",
  mask: "none",
};

/** Bagian Storage yang dipakai, supaya mudah diganti saat uji. */
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Ambil localStorage dengan aman. null bila tidak tersedia. */
export function getStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isKey = <T extends string>(obj: Record<T, unknown>, v: unknown): v is T =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(obj, v);
const DIGITS = /^\d{1,3}$/;

/**
 * Bersihkan data mentah dari penyimpanan. Isi localStorage bisa diubah siapa
 * saja, jadi setiap field divalidasi; field yang rusak diganti nilai bawaan.
 */
export function sanitizeForm(raw: unknown): FormValues {
  const src = isObject(raw) ? raw : {};

  const conditions: Condition[] = Array.isArray(src.conditions)
    ? src.conditions.filter((c): c is Condition => isKey(CONDITIONS, c))
    : [];

  return {
    age: typeof src.age === "string" && DIGITS.test(src.age) ? src.age : DEFAULT_FORM.age,
    conditions: conditions.length > 0 ? normalizeConditions(conditions) : [...DEFAULT_FORM.conditions],
    activity: isKey<Activity>(ACTIVITIES, src.activity) ? src.activity : DEFAULT_FORM.activity,
    duration:
      typeof src.duration === "string" && DIGITS.test(src.duration) ? src.duration : DEFAULT_FORM.duration,
    mask: isKey<Mask>(MASKS, src.mask) ? src.mask : DEFAULT_FORM.mask,
  };
}

/** Baca profil tersimpan. null bila belum ada, rusak, atau penyimpanan tidak tersedia. */
export function loadForm(storage: StorageLike | null = getStorage()): FormValues | null {
  if (!storage) return null;
  try {
    const text = storage.getItem(STORAGE_KEY);
    if (!text) return null;
    const parsed: unknown = JSON.parse(text);
    if (!isObject(parsed) || parsed.v !== STORAGE_VERSION) return null;
    return sanitizeForm(parsed.form);
  } catch {
    return null;
  }
}

/** Simpan profil. true bila berhasil. */
export function saveForm(form: FormValues, storage: StorageLike | null = getStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ v: STORAGE_VERSION, form }));
    return true;
  } catch {
    return false;
  }
}

/** Hapus profil tersimpan. true bila berhasil (atau memang tidak ada). */
export function clearForm(storage: StorageLike | null = getStorage()): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}