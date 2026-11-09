import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Navbar from "@/components/layout/Navbar";
import RiskCalculatorClient from "@/components/risk/RiskCalculatorClient";
import SiteFooter from "@/components/sections/SiteFooter";

export const metadata: Metadata = pageMeta({
  title: "Kalkulator Risiko Personal",
  description:
    "Hitung seberapa besar polusi udara hari ini berisiko untuk napasmu, sesuai usia, kondisi kesehatan, jenis aktivitas, dan masker. Edukasi, bukan diagnosis medis.",
  path: "/kalkulator-risiko",
});

export default function KalkulatorRisikoPage() {
  return (
    <>
      <Navbar />
      <main id="konten" tabIndex={-1} className="bg-gradient-to-b from-ink via-navy to-navy-800 focus:outline-none focus:!shadow-none">
        <RiskCalculatorClient />
      </main>
      <SiteFooter />
    </>
  );
}