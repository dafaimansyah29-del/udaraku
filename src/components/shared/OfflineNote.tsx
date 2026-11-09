import { formatUpdated } from "@/lib/format";

type Props = {
  updatedAt: string | number;
  timezone: string;
  className?: string;
};

/**
 * Catatan offline: menampilkan kapan data terakhir diperbarui.
 * Digunakan saat data ditampilkan dari cache karena offline atau terjadi error.
 */
export default function OfflineNote({ updatedAt, timezone, className = "" }: Props) {
  const isoString = typeof updatedAt === "number" ? new Date(updatedAt).toISOString() : updatedAt;

  return (
    <p className={`text-xs text-gray-600 ${className}`}>
      Data dari {formatUpdated(isoString, timezone)}
    </p>
  );
}
