import type { Metadata } from "next";
import AboutContent from "@/components/about/AboutContent";
import Navbar from "@/components/layout/Navbar";
import PageHero from "@/components/layout/PageHero";
import SiteFooter from "@/components/sections/SiteFooter";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Tentang & Metodologi",
  description:
    "Sumber data UdaraKu, cara kalkulator risiko menghitung, batasannya, dan kebijakan privasi singkat berdasarkan UU PDP No. 27 Tahun 2022.",
  path: "/tentang",
});

export default function TentangPage() {
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
          lead="Tentang &"
          accent="Metodologi"
          subtitle="Dari mana datanya, bagaimana risiko dihitung, apa batasannya, dan bagaimana kami menjaga privasimu."
        />

        {/* Panel isi: kaca gelap, selaras dengan beranda */}
        <section className="relative z-10 px-5 pb-24 sm:px-8 sm:pb-28 lg:px-12 xl:px-16">
          <div className="mx-auto max-w-[1560px]">
            <h2 className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan">
              <span className="h-px w-8 bg-cyan/70" aria-hidden="true" />
              Tentang &amp; Metodologi
            </h2>
            <div className="rounded-[32px] border border-white/15 bg-white/[0.06] p-3 shadow-[0_30px_80px_-40px_rgba(34,211,238,0.3)] backdrop-blur-sm sm:p-6">
              <AboutContent />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}