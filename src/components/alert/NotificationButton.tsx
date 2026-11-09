"use client";

import { IconBell } from "@/components/ui/Icons";
import { useNotifications } from "@/hooks/useNotifications";

type Props = {
  /** "banner": kecil, di dalam banner berwarna. "page": besar, di halaman putih. */
  tone?: "banner" | "page";
};

/**
 * Tombol notifikasi. Izin peramban baru diminta SETELAH tombol ini diklik.
 * Tidak tampil bila peramban tidak mendukung Notification API.
 */
export default function NotificationButton({ tone = "banner" }: Props) {
  const { supported, permission, enabled, message, enable, disable } = useNotifications();
  if (!supported) return null;

  const base =
    tone === "banner"
      ? "inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-xs font-bold text-white ring-1 ring-white/40 transition-colors hover:bg-navy-800 sm:text-sm"
      : "inline-flex items-center gap-2 rounded-full bg-biru px-6 py-3 font-heading text-sm font-bold text-white shadow-glow transition-colors hover:bg-biru-terang";

  const note = (text: string) => (
    <p role="status" className={tone === "banner" ? "text-xs font-medium" : "mt-2 text-sm text-white/80"}>
      {text}
    </p>
  );

  if (permission === "denied") {
    return note("Notifikasi diblokir di peramban. Ubah lewat pengaturan situs bila ingin menyalakannya.");
  }

  return (
    <div className={tone === "banner" ? "flex flex-col gap-1" : ""}>
      {enabled ? (
        <button type="button" onClick={disable} className={base} aria-pressed="true">
          <IconBell className="h-4 w-4" aria-hidden="true" />
          Matikan notifikasi
        </button>
      ) : (
        <button type="button" onClick={() => void enable()} className={base} aria-pressed="false">
          <IconBell className="h-4 w-4" aria-hidden="true" />
          {permission === "granted" ? "Nyalakan notifikasi" : "Aktifkan notifikasi"}
        </button>
      )}
      {message && note(message)}
    </div>
  );
}