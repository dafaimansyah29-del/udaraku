import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import AlertBanner from "@/components/alert/AlertBanner";
import PwaRegister from "@/components/pwa/PwaRegister";
import { OG_IMAGE } from "@/lib/seo";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: `%s — ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["kualitas udara", "PM2.5", "ISPU", "polusi udara", "kesehatan pernapasan", "Indonesia", "SDGs 3"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: SITE_NAME,
    title: TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: SITE_DESCRIPTION, images: [OG_IMAGE.url] },
  icons: { apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

// Zoom tidak dibatasi (aksesibilitas).
export const viewport: Viewport = {
  themeColor: "#0B1E5B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" className={`${montserrat.variable} ${inter.variable}`}>
      <body>
        <a href="#konten" className="skip-link">
          Lewati ke konten utama
        </a>
        <AlertBanner />
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}