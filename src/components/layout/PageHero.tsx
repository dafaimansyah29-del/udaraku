"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Bokeh from "@/components/hero/Bokeh";

type Props = {
  /** Bagian judul berwarna putih, lalu `accent` berwarna gradasi. */
  lead: string;
  accent: string;
  subtitle: string;
  /** Mis. pencari lokasi, tampil di bawah subjudul. */
  children?: ReactNode;
  /** Mode gelap penuh (tanpa latar biru sendiri, wadah lebar) untuk halaman bergaya beranda. */
  dark?: boolean;
};

/** Hero gelap untuk halaman dalam: gradasi navy, bokeh, judul, dan slot untuk kontrol. */
export default function PageHero({ lead, accent, subtitle, children, dark = false }: Props) {
  const reduce = useReducedMotion();
  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: "easeOut" as const },
  });

  return (
    <section
      className={
        dark ? "relative pb-12 pt-28 sm:pb-16 sm:pt-36" : "relative bg-hero pb-28 pt-28 sm:pb-32 sm:pt-36"
      }
    >
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 top-6 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(108,92,231,0.4)_0%,transparent_65%)] blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.2)_0%,transparent_65%)] blur-3xl" />
        <Bokeh />
      </div>

      <div
        className={`relative mx-auto px-5 text-center sm:px-8 ${
          dark ? "max-w-[1560px] lg:px-12 xl:px-16" : "max-w-7xl"
        }`}
      >
        <motion.h1 {...fade(0)} className={`text-4xl font-extrabold tracking-tight text-white sm:text-5xl ${dark ? "xl:text-6xl" : ""}`}>
          {lead}{" "}
          <span className="bg-gradient-to-r from-cyan to-ungu bg-clip-text text-transparent">{accent}</span>
        </motion.h1>
        <motion.p
          {...fade(0.1)}
          className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
        >
          {subtitle}
        </motion.p>
        {children && (
          <motion.div {...fade(0.2)} className="mt-8">
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}