/**
 * Identitas situs: nama, alamat dasar (SEO, Open Graph, peta situs), dan kontak pengelola.
 * Semua dibaca dari variabel lingkungan saat build/server (lihat .env.example).
 */

export const SITE_NAME = "UdaraKu";
export const SITE_TAGLINE = "Cek Udara, Kenali Risiko Paru-Parumu";
export const SITE_DESCRIPTION =
  "UdaraKu mengubah data polusi udara menjadi risiko kesehatan pernapasan yang personal untukmu. Mendukung SDGs 3: Kehidupan Sehat dan Sejahtera.";

/** Tanggal peninjauan terakhir kebijakan privasi di halaman Tentang. Ubah setiap kali isinya berubah. */
export const POLICY_UPDATED = "31 Oktober 2026";

type Env = Record<string, string | undefined>;

/**
 * Alamat dasar situs (hanya asal: skema + host, tanpa path atau garis miring akhir). Urutan:
 *  1. NEXT_PUBLIC_SITE_URL (domain sendiri, disarankan untuk produksi), hanya http/https
 *  2. VERCEL_PROJECT_PRODUCTION_URL (diisi otomatis oleh Vercel)
 *  3. VERCEL_URL (alamat deployment, termasuk preview)
 *  4. http://localhost:3000
 */
export function resolveSiteUrl(env: Env = process.env): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    try {
      const url = new URL(explicit);
      if (url.protocol === "http:" || url.protocol === "https:") return url.origin;
    } catch {
      /* tidak sah: lanjut ke pilihan berikutnya */
    }
  }
  for (const name of ["VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL"] as const) {
    const host = env[name]?.trim();
    if (host && /^[\w.-]+(:\d+)?$/.test(host)) return `https://${host}`;
  }
  return "http://localhost:3000";
}

const EMAIL_RE = /^[^\s@<>"'`]+@[^\s@<>"'`]+\.[^\s@<>"'`]+$/;

/**
 * Nama dan surel pengelola untuk bagian privasi. Tidak ada nilai bawaan karena
 * kontak itu milik pengelola; kosong = halaman Tentang menulis bahwa kontak belum diatur.
 * Surel yang tidak sah atau berisi tanda markup ditolak; nama dipotong 100 karakter.
 */
export function parseOwner(env: Env = process.env): { name: string; email: string } {
  const name = (env.NEXT_PUBLIC_OWNER_NAME ?? "").trim().slice(0, 100);
  const email = (env.NEXT_PUBLIC_CONTACT_EMAIL ?? "").trim();
  return { name, email: EMAIL_RE.test(email) && email.length <= 254 ? email : "" };
}

export const SITE_URL = resolveSiteUrl();

const owner = parseOwner();
export const OPERATOR_NAME = owner.name;
export const CONTACT_EMAIL = owner.email;

/** Semua halaman publik, untuk sitemap.xml. */
export const SITE_ROUTES: readonly { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/cek-udara", priority: 0.9 },
  { path: "/kalkulator-risiko", priority: 0.9 },
  { path: "/prakiraan", priority: 0.8 },
  { path: "/peta", priority: 0.7 },
  { path: "/edukasi", priority: 0.7 },
  { path: "/tentang", priority: 0.5 },
];