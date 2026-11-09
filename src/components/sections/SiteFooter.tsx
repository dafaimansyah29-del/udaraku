import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

/** Penutup halaman beranda: sambung ke latar gelap, dengan tautan ke Tentang & Metodologi dan Edukasi. */
export default function SiteFooter() {
  return (
    <footer className="bg-navy-800 px-5 pb-10 sm:px-8 lg:px-12 xl:px-16">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-4 border-t border-white/15 pt-8 text-sm text-white/80 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-heading font-bold text-white">{SITE_NAME}</span> · Mendukung SDGs 3: Kehidupan Sehat dan
          Sejahtera. Edukasi, bukan diagnosis medis.
        </p>
        <nav aria-label="Tautan bawah" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/edukasi" className="rounded underline-offset-4 hover:text-white hover:underline">
            Edukasi
          </Link>
          <Link href="/tentang" className="rounded underline-offset-4 hover:text-white hover:underline">
            Tentang &amp; Metodologi
          </Link>
          <Link href="/tentang#privasi" className="rounded underline-offset-4 hover:text-white hover:underline">
            Privasi
          </Link>
        </nav>
      </div>
    </footer>
  );
}