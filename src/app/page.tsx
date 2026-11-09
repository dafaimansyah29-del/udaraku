import Navbar from "@/components/layout/Navbar";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import Hero from "@/components/hero/Hero";
import InfoStrip from "@/components/sections/InfoStrip";
import FiturUtama from "@/components/sections/FiturUtama";
import TemaLomba from "@/components/sections/TemaLomba";
import SiteFooter from "@/components/sections/SiteFooter";

// Data terstruktur untuk mesin pencari. Seluruh isinya konstanta, tidak ada masukan pengguna.
const JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  inLanguage: "id",
  offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
}).replace(/</g, "\\u003c");

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
      <Navbar />
      <main id="konten" tabIndex={-1} className="bg-ink focus:outline-none focus:!shadow-none">
        <Hero />
        <InfoStrip />
        <FiturUtama />
        <TemaLomba />
      </main>
      <SiteFooter />
    </>
  );
}