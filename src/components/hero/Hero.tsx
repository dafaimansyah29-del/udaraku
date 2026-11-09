"use client";

import { motion, useReducedMotion } from "framer-motion";
import Bokeh from "./Bokeh";
import HeroVisual from "./HeroVisual";
import PillButton from "@/components/ui/PillButton";

export default function Hero() {
  const reduce = useReducedMotion();

  const fadeUp = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: "easeOut" as const },
        };

  return (
    <section
      id="beranda"
      className="relative isolate overflow-hidden bg-hero lg:bg-none lg:bg-[#010308] pb-28 pt-28 sm:pb-32 sm:pt-32 lg:pb-36"
    >
      <div
        aria-hidden="true"
        className="absolute -left-32 bottom-0 -z-10 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.22)_0%,transparent_65%)] blur-3xl"
      />
      {/* Pudar ke warna bagian berikutnya supaya tidak ada garis pemisah */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-44 bg-gradient-to-b from-transparent to-ink" />
      <Bokeh />

      <div className="relative mx-auto grid max-w-[1560px] items-center gap-10 px-5 sm:px-8 lg:px-12 xl:px-16 lg:min-h-[560px] lg:grid-cols-2 lg:gap-6">
        {/* Teks */}
        <div className="text-center lg:text-left">
          <motion.p
            {...fadeUp(0)}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md lg:mx-0"
          >
            <span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#22D3EE]" />
            Mendukung SDGs 3 · Kehidupan Sehat dan Sejahtera
          </motion.p>

          <motion.h1
            {...fadeUp(0.1)}
            className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl xl:text-6xl"
          >
            Kenali Udara,
            <br />
            Lindungi{" "}
            <span className="whitespace-nowrap bg-gradient-to-r from-cyan to-ungu bg-clip-text text-transparent">
              Paru-Parumu
            </span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.22)}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg lg:mx-0 lg:max-w-md xl:max-w-lg"
          >
            UdaraKu mengubah data polusi udara menjadi risiko kesehatan pernapasan yang
            sesuai dengan kondisi tubuhmu. Tahu kapan aman keluar rumah, dan kapan harus
            berhati-hati.
          </motion.p>

          <motion.div {...fadeUp(0.34)} className="mt-8 flex justify-center lg:justify-start">
            <PillButton href="/cek-udara">MULAI CEK UDARA</PillButton>
          </motion.div>
        </div>

        {/* Kolom kanan dikosongkan di layar lebar: paru-paru ada di gambar latar */}
        <div aria-hidden="true" className="hidden lg:block" />
      </div>

      {/* Visual: latar penuh di layar lebar, kartu di bawah teks di layar kecil */}
      <div className="px-5 sm:px-8 lg:contents">
        <HeroVisual />
      </div>
    </section>
  );
}