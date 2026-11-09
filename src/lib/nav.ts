export type NavItem = {
  /** id elemen di beranda, juga dipakai untuk menandai menu aktif */
  id: string;
  label: string;
  href: string;
};

/**
 * Cek Udara, Kalkulator Risiko, Prakiraan, Peta, dan Edukasi sudah punya halaman sendiri.
 * "Tentang" masih mengarah ke anchor di beranda; ganti href-nya menjadi rute
 * saat halamannya dibuat. Menu dengan "#" di href tidak ikut penandaan menu aktif lewat rute.
 */
export const NAV_ITEMS: NavItem[] = [
  { id: "beranda", label: "Beranda", href: "/" },
  { id: "cek-udara", label: "Cek Udara", href: "/cek-udara" },
  { id: "kalkulator-risiko", label: "Kalkulator Risiko", href: "/kalkulator-risiko" },
  { id: "prakiraan", label: "Prakiraan", href: "/prakiraan" },
  { id: "peta", label: "Peta", href: "/peta" },
  { id: "edukasi", label: "Edukasi", href: "/edukasi" },
  { id: "tentang", label: "Tentang", href: "/tentang" },
];