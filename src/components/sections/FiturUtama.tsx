"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { IconArrow, IconInfo, IconLungs, IconPin, IconWind, IconCalendar, IconBadgeCheck, IconClock, IconCheck } from "@/components/ui/Icons";

/* ---------- Ilustrasi kecil tiap fitur (dekoratif, bukan data asli) ---------- */

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-white ring-1 ring-white/20 backdrop-blur-md">
      {children}
    </span>
  );
}

function MockCekUdara() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-3 p-6 text-white">
      <Chip>
        <IconWind className="h-5 w-5" />
      </Chip>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/90">ISPU Hari Ini</p>
      <p className="font-heading text-6xl font-extrabold leading-none sm:text-7xl">82</p>
      <span className="rounded-full bg-cyan px-4 py-1 text-xs font-bold text-ink">SEDANG</span>
      <div className="mt-1 h-2 w-3/4 overflow-hidden rounded-full bg-white/20">
        <div className="h-full w-[42%] rounded-full bg-gradient-to-r from-cyan to-ungu" />
      </div>
    </div>
  );
}

const BARS: { h: number; tone: "c" | "o" | "l" }[] = [
  { h: 30, tone: "l" }, { h: 52, tone: "c" }, { h: 38, tone: "l" }, { h: 72, tone: "c" },
  { h: 44, tone: "l" }, { h: 92, tone: "o" }, { h: 62, tone: "c" }, { h: 36, tone: "l" },
  { h: 76, tone: "c" }, { h: 48, tone: "c" }, { h: 84, tone: "o" }, { h: 40, tone: "l" },
];
const BAR_TONE = { c: "bg-cyan/80", o: "bg-[#F4B97A]", l: "bg-white/45" } as const;

function MockPrakiraan() {
  return (
    <div className="relative flex h-full flex-col justify-between p-6 text-white">
      <Chip>
        <IconCalendar className="h-5 w-5" />
      </Chip>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/90">Prakiraan</p>
        <p className="mt-1 font-heading text-lg font-extrabold sm:text-xl">Kualitas udara 72 jam</p>
      </div>
      <div>
        <div className="flex h-20 items-end gap-1.5 sm:h-24">
          {BARS.map((b, i) => (
            <span key={i} style={{ height: `${b.h}%` }} className={`flex-1 rounded-t-md ${BAR_TONE[b.tone]}`} />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-white/90">
          <span>Sekarang</span>
          <span>+24 jam</span>
          <span>+48 jam</span>
          <span>+72 jam</span>
        </div>
      </div>
    </div>
  );
}

function MockPeta() {
  return (
    <div className="relative h-full overflow-hidden text-white">
      <svg aria-hidden="true" viewBox="0 0 400 250" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <g stroke="rgba(255,255,255,0.14)" strokeWidth="1" fill="none">
          <path d="M0 60 L400 130" /><path d="M0 200 L400 110" /><path d="M120 0 L260 250" /><path d="M300 0 L180 250" />
          <path d="M0 140 Q150 90 400 190" />
        </g>
      </svg>
      <Chip>
        <IconPin className="h-5 w-5" />
      </Chip>
      <span className="absolute left-[16%] top-[30%] h-3.5 w-3.5 rounded-full bg-cyan shadow-[0_0_0_6px_rgba(34,211,238,0.25),0_0_24px_#22D3EE]" />
      <span className="absolute left-[58%] top-[34%] h-3 w-3 rounded-full bg-[#F4B97A] shadow-[0_0_0_5px_rgba(244,185,122,0.25)]" />
      <span className="absolute left-[34%] top-[68%] h-3 w-3 rounded-full bg-white/80 shadow-[0_0_0_5px_rgba(255,255,255,0.15)]" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-ink/60 px-5 py-3 backdrop-blur-md">
        <p className="font-heading text-base font-extrabold">Peta Udara</p>
        <p className="text-xs text-white/90">Lihat kondisi di sekitar lokasi</p>
      </div>
    </div>
  );
}

function MockEdukasi() {
  return (
    <div className="relative flex h-full flex-col justify-center gap-3 p-6 text-white">
      <Chip>
        <IconBadgeCheck className="h-5 w-5" />
      </Chip>
      <p className="font-heading text-lg font-extrabold sm:text-xl">Kenali polutan udara</p>
      <div className="rounded-2xl bg-white px-4 py-3 text-ink shadow-lg">
        <div className="flex items-center justify-between">
          <p className="font-heading text-xl font-extrabold text-navy">PM2.5</p>
          <IconInfo className="h-5 w-5 text-biru" />
        </div>
        <p className="mt-0.5 text-xs text-navy/75">Partikel sangat kecil yang dapat masuk jauh ke paru-paru.</p>
      </div>
      <p className="flex items-center gap-2 text-xs font-semibold text-white/85">
        <IconClock className="h-4 w-4" /> Pelajari dampaknya dan cara melindungi diri
      </p>
    </div>
  );
}

function MockKalkulator() {
  return (
    <div className="relative flex h-full flex-col justify-center gap-3 p-6 text-white">
      <Chip>
        <IconLungs className="h-5 w-5" />
      </Chip>
      <p className="font-heading text-lg font-extrabold sm:text-xl">Hitung Risikomu</p>
      <div className="grid max-w-md grid-cols-2 gap-2">
        {["Usia", "Riwayat asma", "Perokok", "Aktivitas"].map((t) => (
          <div key={t} className="rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-navy/75">
            {t}
          </div>
        ))}
      </div>
      <div className="max-w-md rounded-xl bg-ungu px-3 py-2 text-center text-xs font-bold text-white">Risiko: Waspada</div>
    </div>
  );
}

function MockTentang() {
  const items = ["Sumber data", "Rumus risiko", "Batasan", "Privasi (UU PDP)"];
  return (
    <div className="relative flex h-full flex-col justify-center gap-3 p-6 text-white">
      <Chip>
        <IconInfo className="h-5 w-5" />
      </Chip>
      <p className="font-heading text-lg font-extrabold sm:text-xl">Cara kami bekerja</p>
      <ul className="grid max-w-md grid-cols-2 gap-2">
        {items.map((t) => (
          <li key={t} className="flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-navy/80">
            <IconCheck className="h-4 w-4 shrink-0 text-biru" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Daftar fitur ---------- */

type Fitur = {
  id: string;
  title: string;
  desc: string;
  cta: string;
  href: string;
  media: ReactNode;
};

const FITUR: Fitur[] = [
  {
    id: "cek-udara",
    title: "Cek Udara Sekitarmu",
    desc: "Lihat kualitas udara di lokasimu sekarang, lengkap dengan angka PM2.5 dan tingkat ISPU. Semua dijelaskan dengan bahasa yang mudah dipahami.",
    cta: "Cek udara",
    href: "/cek-udara",
    media: <MockCekUdara />,
  },
  {
    id: "prakiraan",
    title: "Prakiraan Kualitas Udara",
    desc: "Pantau perubahan PM2.5 hingga 72 jam ke depan dan cari waktu yang lebih baik untuk beraktivitas di luar.",
    cta: "Lihat prakiraan",
    href: "/prakiraan",
    media: <MockPrakiraan />,
  },
  {
    id: "peta",
    title: "Peta Kualitas Udara",
    desc: "Lihat kondisi udara berdasarkan lokasi di peta, lengkap dengan penanda kualitas dan informasi titik panas.",
    cta: "Buka peta",
    href: "/peta",
    media: <MockPeta />,
  },
  {
    id: "kalkulator-risiko",
    title: "Kalkulator Risiko Napas",
    desc: "Isi usia, riwayat penyakit pernapasan, dan kebiasaanmu. Kami hitung seberapa besar udara hari ini berisiko untuk paru-parumu.",
    cta: "Hitung risiko",
    href: "/kalkulator-risiko",
    media: <MockKalkulator />,
  },
  {
    id: "edukasi",
    title: "Edukasi Udara dan Kesehatan",
    desc: "Pahami polutan, dampaknya bagi pernapasan, dan langkah sederhana untuk menjaga kesehatan.",
    cta: "Jelajahi edukasi",
    href: "/edukasi",
    media: <MockEdukasi />,
  },
  {
    id: "tentang",
    title: "Tentang dan Metodologi",
    desc: "Pelajari dari mana datanya, bagaimana risiko dihitung, apa batasannya, dan bagaimana privasimu dijaga.",
    cta: "Baca selengkapnya",
    href: "/tentang",
    media: <MockTentang />,
  },
];

export default function FiturUtama() {
  const reduce = useReducedMotion();

  return (
    <section
      id="fitur"
      className="relative overflow-hidden bg-gradient-to-b from-ink via-navy to-navy-800 px-5 pb-24 pt-20 sm:px-8 sm:pb-28 sm:pt-28 lg:px-12 xl:px-16"
    >
      {/* Cahaya latar halus, selaras dengan hero */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-24 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(74,102,221,0.35)_0%,transparent_65%)] blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 bottom-0 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.18)_0%,transparent_65%)] blur-3xl" />

      <div className="relative mx-auto max-w-[1560px]">
        <motion.header
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan">
              <span className="h-px w-8 bg-cyan/70" aria-hidden="true" />
              Fitur Utama
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl xl:text-5xl">
              Semua yang kamu butuhkan untuk{" "}
              <span className="bg-gradient-to-r from-cyan to-ungu bg-clip-text text-transparent">menjaga napas</span>
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-white/75 lg:text-right">
            Pilih fitur untuk melihat kondisi udara, memahami prakiraannya, dan menjaga kesehatan.
          </p>
        </motion.header>

        <div className="mt-12 grid auto-rows-fr gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-6">
          {FITUR.map(({ id, title, desc, cta, href, media }, i) => (
            <motion.article
              key={id}
              // id berawalan "fitur-" sengaja: Navbar menandai menu aktif dari elemen ber-id sama dengan nama menu
              id={`fitur-${id}`}
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.1, ease: "easeOut" }}
              className="group relative flex h-full scroll-mt-28 flex-col rounded-[28px] border border-white/15 bg-white/[0.08] p-3 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.6)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-cyan/50 hover:bg-white/[0.11] hover:shadow-[0_28px_70px_-28px_rgba(34,211,238,0.45)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <div className="aspect-[16/10] overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E3BB0] via-biru to-ungu ring-1 ring-white/20">
                {media}
              </div>
              <div className="flex flex-1 flex-col px-3 pb-3 pt-6">
                <h3 className="text-xl font-extrabold text-white">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/80 sm:text-[15px]">{desc}</p>
                <Link
                  href={href}
                  className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-cyan/40 px-5 py-2.5 font-heading text-sm font-bold text-cyan transition-colors duration-200 hover:bg-cyan hover:text-ink"
                >
                  {cta}
                  <IconArrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}