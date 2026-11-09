"use client";

import { useState } from "react";
import { IconTrash } from "@/components/ui/Icons";
import { clearAllLocalData } from "@/lib/local-data";

/** Menghapus semua data UdaraKu di perangkat ini (profil, lokasi terakhir, notifikasi, cache offline). */
export default function ClearDataButton() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    const r = await clearAllLocalData();
    setBusy(false);
    setDone(
      !r.ok
        ? "Sebagian data belum bisa dihapus (penyimpanan peramban mungkin diblokir). Hapus data situs UdaraKu lewat pengaturan peramban."
        : r.keys + r.caches === 0
          ? "Tidak ada data UdaraKu yang tersimpan di perangkat ini."
          : `Selesai. ${r.keys} data tersimpan dan ${r.caches} cache offline dihapus dari perangkat ini.`,
    );
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full border-2 border-red-300/70 bg-red-500/10 px-6 py-3 font-heading text-sm font-bold text-red-200 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-60"
      >
        <IconTrash className="h-4 w-4" aria-hidden="true" />
        Hapus semua data saya
      </button>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-white/80">
        {done}
      </p>
    </div>
  );
}