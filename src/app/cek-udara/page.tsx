import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Navbar from "@/components/layout/Navbar";
import CekUdaraClient from "@/components/air/CekUdaraClient";
import SiteFooter from "@/components/sections/SiteFooter";

export const metadata: Metadata = pageMeta({
  title: "Cek Udara",
  description:
    "Lihat kualitas udara di lokasimu sekarang: indeks ISPU atau US AQI, rincian polutan, dan saran untuk kesehatan napasmu.",
  path: "/cek-udara",
});

export default function CekUdaraPage() {
  return (
    <>
      <Navbar />
      <main id="konten" tabIndex={-1} className="bg-gradient-to-b from-ink via-navy to-navy-800 focus:outline-none focus:!shadow-none">
        <CekUdaraClient />
      </main>
      <SiteFooter />
    </>
  );
}