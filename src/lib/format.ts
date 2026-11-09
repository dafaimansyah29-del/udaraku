/** Waktu update dalam zona waktu lokasi, mis. "28 Okt 2026, 13.00 WIB". */
export function formatUpdated(iso: string, timeZone: string): string {
  const date = new Date(iso);
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
      timeZoneName: "short",
    }).format(date);
  } catch {
    return date.toLocaleString("id-ID");
  }
}

/** Angka berformat Indonesia (koma desimal), mis. 52,3. */
export function formatNumber(value: number, digits = 1): string {
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}