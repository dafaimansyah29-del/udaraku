/** Ubah teks "12.5" jadi angka dalam rentang [min, max], selain itu null. */
export function parseCoord(value: string | null, min: number, max: number): number | null {
  if (value === null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

/** Bulatkan ke 2 desimal (±1 km) supaya permintaan berdekatan memakai cache yang sama. */
export const round2 = (n: number) => Math.round(n * 100) / 100;