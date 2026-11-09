import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Navbar from "@/components/layout/Navbar";
import PrakiraanClient from "@/components/forecast/PrakiraanClient";
import SiteFooter from "@/components/sections/SiteFooter";

export const metadata: Metadata = pageMeta({
  title: "Prakiraan Udara 72 Jam",
  description:
    "Prakiraan PM2.5 per jam untuk 72 jam ke depan, lengkap dengan jam terbaik untuk beraktivitas di luar rumah.",
  path: "/prakiraan",
});

export default function PrakiraanPage() {
  return (
    <>
      <Navbar />
      <main id="konten" tabIndex={-1} className="bg-gradient-to-b from-ink via-navy to-navy-800 focus:outline-none focus:!shadow-none">
        <PrakiraanClient />
      </main>
      <SiteFooter />
    </>
  );
}