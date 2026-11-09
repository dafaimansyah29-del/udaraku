"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Dot = {
  x: number;
  y: number;
  size: number;
  color: string;
  blur: number;
  opacity: number;
  duration: number;
  delay: number;
  drift: number;
};

// Pseudo-random dengan seed tetap, supaya hasil server dan browser sama (tidak error hydration)
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COLORS = ["#22D3EE", "#6C5CE7", "#2F4BC4", "#FFFFFF", "#22D3EE", "#6C5CE7"];
const round = (n: number, d = 2) => Number(n.toFixed(d));

const rand = mulberry32(2026);
const DOTS: Dot[] = Array.from({ length: 26 }, () => {
  const size = 8 + rand() * 82;
  return {
    x: round(rand() * 100),
    y: round(rand() * 100),
    size: round(size, 1),
    color: COLORS[Math.floor(rand() * COLORS.length)],
    blur: round(size > 50 ? 6 + rand() * 8 : 1 + rand() * 4, 1),
    opacity: round(0.22 + rand() * 0.45),
    duration: round(6 + rand() * 8, 1),
    delay: round(rand() * 4, 1),
    drift: round(14 + rand() * 36, 1),
  };
});

function Bokeh() {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {DOTS.map((d, i) => {
        const style = {
          left: `${d.x}%`,
          top: `${d.y}%`,
          width: d.size,
          height: d.size,
          background: `radial-gradient(circle, ${d.color} 0%, ${d.color}55 40%, transparent 70%)`,
          filter: `blur(${d.blur}px)`,
          opacity: d.opacity,
        };

        // Bila pengguna memilih gerakan dikurangi: titik cahaya diam
        if (reduce) {
          return <span key={i} className="absolute rounded-full mix-blend-screen" style={style} />;
        }

        return (
          <motion.span
            key={i}
            className="absolute rounded-full mix-blend-screen"
            style={style}
            animate={{
              y: [0, -d.drift, 0],
              opacity: [d.opacity, Math.min(d.opacity * 1.7, 0.9), d.opacity],
            }}
            transition={{
              duration: d.duration,
              delay: d.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
}

export default memo(Bokeh);
