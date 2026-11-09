"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { NAV_ITEMS } from "@/lib/nav";
import Logo from "@/components/ui/Logo";
import { IconClose, IconMenu } from "@/components/ui/Icons";

export default function Navbar() {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [sectionActive, setSectionActive] = useState("beranda");

  // Di beranda, menu aktif mengikuti bagian yang terlihat.
  // Di halaman lain, menu aktif mengikuti rute.
  const active =
    pathname === "/"
      ? sectionActive
      : (NAV_ITEMS.find((item) => !item.href.includes("#") && item.href !== "/" && pathname.startsWith(item.href))
          ?.id ?? "");

  // Kapsul jadi lebih pekat setelah halaman digulir
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Tandai menu aktif sesuai bagian yang sedang terlihat (hanya di beranda)
  useEffect(() => {
    if (pathname !== "/") return;
    const targets = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setSectionActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  const handleNavigate = (id: string) => {
    setSectionActive(id);
    setOpen(false);
  };

  return (
    <header className="site-nav fixed inset-x-0 top-3 z-50 flex justify-center px-4 sm:top-5">
      <nav
        aria-label="Navigasi utama"
        className={`w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/20 shadow-glass backdrop-blur-xl transition-colors duration-300 ${
          scrolled || open ? "bg-navy-950/75" : "bg-white/10"
        }`}
      >
        <div className="flex h-14 items-center justify-between pl-4 pr-2 sm:pl-5 lg:pr-3">
          <Link href="/" onClick={() => handleNavigate("beranda")} aria-label="UdaraKu, ke beranda">
            <Logo />
          </Link>

          {/* Menu desktop */}
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.id;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => handleNavigate(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative block rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                      isActive ? "text-white" : "text-white/70 hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-full bg-white/15 ring-1 ring-white/20"
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Tombol menu mobile */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            className="grid h-10 w-10 place-items-center rounded-full text-white transition-colors hover:bg-white/10 lg:hidden"
          >
            {open ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </button>
        </div>

        {/* Menu mobile */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="menu-mobile"
              key="menu-mobile"
              initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: reduce ? 0.01 : 0.25, ease: "easeOut" }}
              className="lg:hidden"
            >
              <ul className="flex flex-col gap-1 border-t border-white/10 p-3">
                {NAV_ITEMS.map((item) => {
                  const isActive = active === item.id;
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={() => handleNavigate(item.id)}
                        aria-current={isActive ? "page" : undefined}
                        className={`block rounded-2xl px-4 py-3 text-base font-medium transition-colors ${
                          isActive
                            ? "bg-white/15 text-white"
                            : "text-white/75 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}