import { IconClock } from "@/components/ui/Icons";
import { formatUpdated } from "@/lib/format";

/**
 * Label data offline. Teks sesuai permintaan: "Data offline, terakhir diperbarui ...".
 * `updatedAt` adalah waktu DATA (bukan waktu membuka halaman).
 */
export default function OfflineNote({
  updatedAt,
  timezone,
  className = "",
}: {
  updatedAt: string;
  timezone: string;
  className?: string;
}) {
  return (
    <p
      role="status"
      data-testid="data-offline"
      className={`flex items-start gap-2 rounded-2xl bg-navy px-4 py-3 text-sm font-medium text-white ${className}`}
    >
      <IconClock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
      <span>
        Data offline, terakhir diperbarui {formatUpdated(updatedAt, timezone)}. Sambungkan internet untuk data
        terbaru.
      </span>
    </p>
  );
}