"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ComponentType, SVGProps } from "react";
import {
  IconBadgeCheck,
  IconBell,
  IconCalendar,
  IconPulse,
  IconUserShield,
} from "@/components/ui/Icons";

type Point = {
  title: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const POINTS: Point[] = [
  { title: "Data Real-Time", Icon: IconPulse },
  { title: "Prakiraan 72 Jam", Icon: IconCalendar },
  { title: "Risiko Personal", Icon: IconUserShield },
  { title: "Peringatan Dini", Icon: IconBell },
  { title: "Standar WHO & ISPU", Icon: IconBadgeCheck },
];

/** Strip keunggulan: kaca gelap yang menyambung dari hero. */
export default function InfoStrip() {
  const reduce = useReducedMotion();

  return (
    <section aria-label="Keunggulan UdaraKu" className="relative z-10 -mt-14 bg-ink px-5 sm:-mt-16 sm:px-8 lg:px-12 xl:px-16">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mx-auto max-w-[1560px] rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.12] to-white/[0.05] px-4 py-6 shadow-[0_30px_80px_-30px_rgba(34,211,238,0.25)] backdrop-blur-xl sm:px-6 sm:py-7"
      >
        <ul className="grid grid-cols-2 gap-y-6 md:grid-cols-5 md:gap-y-0">
          {POINTS.map(({ title, Icon }, i) => (
            <li
              key={title}
              className={`flex flex-col items-center gap-3 px-2 text-center md:px-4 ${
                i > 0 ? "md:border-l md:border-white/10" : ""
              } ${i === 4 ? "col-span-2 md:col-span-1" : ""}`}
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-cyan/10 text-cyan ring-1 ring-cyan/30">
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-heading text-xs font-bold leading-snug text-white sm:text-sm">{title}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}