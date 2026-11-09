import type { Metadata } from "next";
import { SITE_NAME } from "./site";

/** Gambar Open Graph bawaan (1200x630). File ada di public/og/. */
export const OG_IMAGE = {
  url: "/og/udaraku-og.png",
  width: 1200,
  height: 630,
  alt: "UdaraKu: cek kualitas udara dan kenali risiko paru-parumu",
} as const;

/**
 * Metadata satu halaman: judul, deskripsi, alamat kanonik, Open Graph, dan Twitter.
 * Judul diberi akhiran " — UdaraKu" oleh `title.template` di layout.
 * Open Graph di halaman menggantikan seluruh objek dari layout, jadi gambar ditulis ulang di sini.
 */
export function pageMeta({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const fullTitle = `${title} — ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url: path,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}