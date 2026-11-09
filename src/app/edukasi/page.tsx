import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Navbar from "@/components/layout/Navbar";
import PageHero from "@/components/layout/PageHero";
import ArticleCarousel from "@/components/edukasi/ArticleCarousel";
import MarqueeSection from "@/components/edukasi/MarqueeSection";
import SiteFooter from "@/components/sections/SiteFooter";
import { ARTICLES } from "@/lib/education";

export const metadata: Metadata = pageMeta({
  title: "Edukasi Udara Bersih",
  description:
    "Artikel singkat berbahasa awam: apa itu PM2.5, cara memilih masker, tips udara dalam ruangan, dan kelompok rentan.",
  path: "/edukasi",
});

export default function EdukasiPage() {
  return (
    <>
      <Navbar />
      <main
        id="konten"
        tabIndex={-1}
        className="bg-gradient-to-b from-ink via-navy to-navy-800 focus:outline-none focus:!shadow-none"
      >
        <PageHero
          dark
          lead="Edukasi"
          accent="Udara Bersih"
          subtitle="Empat bacaan singkat dengan bahasa sederhana, supaya kamu tahu apa yang perlu dilakukan saat udara buruk."
        />

        {/* Panel artikel: kaca gelap, selaras dengan beranda */}
        <section className="relative z-10 px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="mx-auto max-w-[1560px]">
            <h2 className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan">
              <span className="h-px w-8 bg-cyan/70" aria-hidden="true" />
              Artikel Edukasi
            </h2>
            <div className="rounded-[32px] border border-white/15 bg-white/[0.06] p-3 shadow-[0_30px_80px_-40px_rgba(34,211,238,0.3)] backdrop-blur-sm sm:p-6">
              <ArticleCarousel articles={ARTICLES} />
            </div>
          </div>
        </section>

        <MarqueeSection />
      </main>
      <SiteFooter />
    </>
  );
}