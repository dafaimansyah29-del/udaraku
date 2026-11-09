"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Latar hero: render paru-paru kristal (public/images/hero-paru-paru.webp, 16:9, 1376x768).
 * - Layar lebar (lg ke atas): menempel di kanan dengan rasio asli (tidak terpotong), sisi kirinya memudar ke hitam.
 * - Layar kecil: tampil sebagai kartu 16:9 di bawah teks, bersudut membulat.
 * Untuk mengganti gambar, timpa file itu (rasio 16:9, disarankan lebar 1600 sampai 1920 px, di bawah 300 KB).
 */
export default function HeroVisual() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.1, ease: "easeOut" }}
      className="relative -z-10 mx-auto mt-8 aspect-video w-full lg:aspect-video max-w-2xl overflow-hidden rounded-3xl ring-1 ring-white/10 sm:mt-10 lg:absolute lg:inset-y-0 lg:right-0 lg:mx-0 lg:mt-0 lg:h-full lg:w-auto lg:max-w-none lg:overflow-visible lg:rounded-none lg:ring-0 lg:[mask-image:linear-gradient(to_right,transparent_0%,#000_30%)]"
    >
      <Image
        src="/images/hero-paru-paru.webp"
        alt="Ilustrasi 3D sepasang paru-paru dari kaca dan kristal yang bercahaya biru, dengan percabangan bronkus dan partikel udara yang melayang"
        fill
        priority
        sizes="(min-width: 1024px) 100vw, (min-width: 672px) 672px, 100vw"
        className="object-cover object-[75%_35%] lg:object-center"
      />
    </motion.div>
  );
}