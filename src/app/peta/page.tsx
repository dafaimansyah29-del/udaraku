import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Navbar from "@/components/layout/Navbar";
import PetaClient from "@/components/map/PetaClient";
import SiteFooter from "@/components/sections/SiteFooter";

export const metadata: Metadata = pageMeta({
  title: "Peta Kualitas Udara",
  description:
    "Peta lokasi dengan penanda berwarna sesuai kategori kualitas udara dan nilai PM2.5.",
  path: "/peta",
});

// Dibaca saat permintaan (bukan saat build), supaya FIRMS_MAP_KEY di .env server
// langsung berlaku tanpa build ulang. Hanya status ada/tidaknya yang dikirim ke
// peramban; nilai kuncinya tetap di server.
export const dynamic = "force-dynamic";

export default function PetaPage() {
  const firmsEnabled = Boolean(process.env.FIRMS_MAP_KEY?.trim());
  return (
    <>
      <Navbar />
      <main id="konten" tabIndex={-1} className="bg-gradient-to-b from-ink via-navy to-navy-800 focus:outline-none focus:!shadow-none">
        <PetaClient firmsEnabled={firmsEnabled} />
      </main>
      <SiteFooter />
    </>
  );
}