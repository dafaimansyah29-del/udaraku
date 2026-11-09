"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { IconArrow } from "./Icons";

const MotionLink = motion.create(Link);

type Props = {
  children: ReactNode;
  /** Bila diisi, tombol menjadi tautan. Bila kosong, menjadi <button>. */
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "primary" | "outline";
  showArrow?: boolean;
  className?: string;
};

const styles = {
  primary:
    "bg-biru text-white shadow-glow hover:bg-biru-terang hover:shadow-[0_14px_36px_-6px_rgba(34,211,238,0.55)]",
  outline:
    "border-2 border-biru text-biru bg-white hover:bg-biru hover:text-white",
} as const;

export default function PillButton({
  children,
  href,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
  showArrow = true,
  className = "",
}: Props) {
  const reduce = useReducedMotion();

  const classes = `inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 font-heading text-sm font-bold tracking-wide transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`;
  const motionProps = {
    whileHover: reduce || disabled ? undefined : { scale: 1.04 },
    whileTap: reduce || disabled ? undefined : { scale: 0.97 },
    transition: { type: "spring" as const, stiffness: 400, damping: 22 },
  };
  const content = (
    <>
      {children}
      {showArrow && <IconArrow className="h-4 w-4" />}
    </>
  );

  if (href !== undefined) {
    return (
      <MotionLink href={href} className={classes} {...motionProps}>
        {content}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...motionProps}
    >
      {content}
    </motion.button>
  );
}