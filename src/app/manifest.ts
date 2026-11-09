import type { MetadataRoute } from "next";

/** Manifest PWA, disajikan di /manifest.webmanifest. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "UdaraKu — Cek Udara, Kenali Risiko Paru-Parumu",
    short_name: "UdaraKu",
    description:
      "Data polusi udara jadi risiko kesehatan pernapasan yang personal untukmu. Mendukung SDGs 3.",
    lang: "id",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#050F33",
    theme_color: "#0B1E5B",
    categories: ["health", "weather", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Cek Udara", url: "/cek-udara", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Kalkulator Risiko", url: "/kalkulator-risiko", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Prakiraan 72 Jam", url: "/prakiraan", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
    ],
  };
}