"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ComponentType, SVGProps } from "react";
import { IconBell, IconPulse, IconUserShield } from "@/components/ui/Icons";

type Pilar = {
  kata: string;
  judul: string;
  isi: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const PILAR: Pilar[] = [
  {
    kata: "Empowering",
    judul: "Warga diberi kuasa atas napasnya",
    isi: "Angka polusi yang rumit diubah menjadi saran sederhana sesuai usia, kondisi kesehatan, dan rencana aktivitasmu, sehingga setiap orang bisa memutuskan sendiri kapan aman beraktivitas di luar.",
    Icon: IconUserShield,
  },
  {
    kata: "Intelligent",
    judul: "Keputusan berbasis data terbuka",
    isi: "Data kualitas udara dan cuaca dari sumber terbuka dipadukan dengan ambang batas WHO dan ISPU. Penalarannya transparan: rumus dan batasannya dibuka di halaman Tentang.",
    Icon: IconPulse,
  },
  {
    kata: "Future",
    judul: "Siap menghadapi hari esok",
    isi: "Prakiraan 72 jam, jam terbaik beraktivitas, dan peringatan dini membantu kamu bersiap lebih awal, tanpa harus membuat akun atau menyerahkan data pribadi.",
    Icon: IconBell,
  },
];

/** Menghubungkan UdaraKu dengan tema lomba dan SDGs 3. */
export default function TemaLomba() {
  const reduce = useReducedMotion();

  return (
    <section
      id="tema"
      aria-labelledby="tema-judul"
      className="relative overflow-hidden bg-gradient-to-b from-navy-800 to-ink px-5 pb-24 pt-20 sm:px-8 sm:pb-28 sm:pt-24 lg:px-12 xl:px-16"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-10 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.16)_0%,transparent_65%)] blur-3xl" />

      <div className="relative mx-auto max-w-[1560px]">
        <motion.header
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan">
            <span className="h-px w-8 bg-cyan/70" aria-hidden="true" />
            Tema dan SDGs
          </p>
          <h2
            id="tema-judul"
            className="mt-4 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl xl:text-5xl"
          >
            Empowering Global Innovators for an{" "}
            <span className="bg-gradient-to-r from-cyan to-ungu bg-clip-text text-transparent">Intelligent Future</span>
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/80 sm:text-lg">
            UdaraKu adalah inovasi kecil untuk masalah global: polusi udara menyebabkan jutaan kematian dini tiap
            tahun menurut WHO. Kami menjawabnya dengan teknologi web yang ringan, terbuka, dan bisa dipakai siapa saja.
          </p>
        </motion.header>

        <ul className="mt-12 grid gap-5 lg:mt-14 lg:grid-cols-3 lg:gap-6">
          {PILAR.map(({ kata, judul, isi, Icon }, i) => (
            <motion.li
              key={kata}
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: reduce ? 0 : i * 0.1, ease: "easeOut" }}
              className="flex flex-col gap-4 rounded-3xl border border-white/15 bg-white/[0.06] p-6 shadow-[0_30px_80px_-40px_rgba(34,211,238,0.3)] backdrop-blur-sm sm:p-7"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan/10 text-cyan ring-1 ring-cyan/30">
                <Icon className="h-6 w-6" />
              </span>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan">{kata}</p>
              <h3 className="font-heading text-xl font-extrabold leading-snug text-white">{judul}</h3>
              <p className="text-sm leading-relaxed text-white/80 sm:text-base">{isi}</p>
            </motion.li>
          ))}
        </ul>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-6 flex flex-col gap-5 rounded-3xl bg-gradient-to-br from-[#0B1E5B]/80 to-[#16278A]/60 p-6 ring-1 ring-cyan/30 sm:flex-row sm:items-center sm:p-8 lg:mt-8"
        >
          <span
            aria-hidden="true"
            className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-biru to-ungu font-heading text-3xl font-extrabold text-white shadow-glow"
          >
            3
          </span>
          <div>
            <h3 className="font-heading text-lg font-extrabold text-white sm:text-xl">
              SDGs 3: Kehidupan Sehat dan Sejahtera
            </h3>
            <p className="mt-1 max-w-4xl text-sm leading-relaxed text-white/80 sm:text-base">
              UdaraKu berfokus pada target 3.9, yaitu mengurangi penyakit akibat pencemaran udara, dengan jalan
              edukasi dan peringatan dini. UdaraKu adalah alat edukasi, bukan diagnosis medis.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}