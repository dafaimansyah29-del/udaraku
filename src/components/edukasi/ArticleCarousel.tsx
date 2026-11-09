"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { Article } from "@/lib/education";
import { IconArrow, IconChevronLeft, IconChevronRight, IconClose } from "@/components/ui/Icons";

const ICON_TONE = ["from-biru to-ungu", "from-cyan to-biru", "from-ungu to-biru", "from-biru to-cyan"];

/** Tombol panah bulat. */
function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? IconChevronLeft : IconChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Artikel sebelumnya" : "Artikel berikutnya"}
      className="grid h-12 w-12 place-items-center rounded-full bg-biru text-white shadow-glow transition hover:bg-biru-terang disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
    >
      <Icon className="h-5 w-5" strokeWidth={2.4} />
    </button>
  );
}

/** Jendela baca artikel, memakai <dialog> bawaan (fokus terkunci, Esc menutup). */
function ArticleDialog({ article, onClose }: { article: Article | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (article && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    }
    if (!article && dialog.open) dialog.close();
    return () => {
      document.body.style.overflow = "";
    };
  }, [article]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="artikel-judul"
      onClose={onClose}
      onClick={(e) => {
        // Klik di area gelap (di luar kotak isi) menutup jendela
        if (e.target === ref.current) ref.current?.close();
      }}
      className="m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-4xl bg-[#0B1E5B] p-0 text-white shadow-card-lg ring-1 ring-white/20 backdrop:bg-ink/80 backdrop:backdrop-blur-sm"
    >
      {article && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-4 bg-gradient-to-br from-biru to-ungu px-6 pb-6 pt-5 text-white sm:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/85">
                {article.tag} · {article.minutes} menit baca
              </p>
              <h3 id="artikel-judul" className="mt-1 font-heading text-2xl font-extrabold sm:text-3xl">
                {article.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Tutup artikel"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 transition hover:bg-white/25"
            >
              <IconClose className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4 overflow-y-auto px-6 py-6 text-base leading-relaxed text-white/85 sm:px-8">
            {article.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <div className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
              <p className="font-heading text-sm font-extrabold text-white">Intinya</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {article.points.map((pt) => (
                  <li key={pt} className="flex gap-2">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

export default function ArticleCarousel({ articles }: { articles: Article[] }) {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [open, setOpen] = useState<Article | null>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = trackRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: dir * (first.offsetWidth + gap), behavior: reduce ? "auto" : "smooth" });
  };

  const close = () => {
    setOpen(null);
    lastTrigger.current?.focus();
  };

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Artikel edukasi">
      <div className="mb-4 flex items-center justify-between gap-4 px-1">
        <p className="text-sm text-white/75">Geser atau pakai panah untuk melihat artikel lain.</p>
        <div className="flex gap-2.5">
          <ArrowButton direction="prev" disabled={!canPrev} onClick={() => scrollByCard(-1)} />
          <ArrowButton direction="next" disabled={!canNext} onClick={() => scrollByCard(1)} />
        </div>
      </div>

      <ul
        ref={trackRef}
        onScroll={update}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden"
      >
        {articles.map((a, i) => (
          <li
            key={a.id}
            className="w-full shrink-0 snap-start md:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)] xl:w-[calc((100%-3.75rem)/4)]"
          >
            <article
              aria-label={`Artikel ${i + 1} dari ${articles.length}: ${a.title}`}
              className="flex h-full flex-col rounded-3xl bg-white/[0.07] p-5 ring-1 ring-white/10 transition hover:bg-white/[0.11] hover:ring-cyan/40 sm:p-6"
            >
              <span
                aria-hidden="true"
                className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br font-heading text-xl font-extrabold text-white shadow-glow ${ICON_TONE[i % ICON_TONE.length]}`}
              >
                {i + 1}
              </span>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-cyan">
                {a.tag} · {a.minutes} menit
              </p>
              <h3 className="mt-2 font-heading text-xl font-extrabold leading-snug text-white">{a.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/80">{a.summary}</p>
              <button
                type="button"
                onClick={(e) => {
                  lastTrigger.current = e.currentTarget;
                  setOpen(a);
                }}
                aria-label={`Baca artikel: ${a.title}`}
                className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-biru px-5 py-2.5 font-heading text-xs font-bold tracking-wide text-white shadow-glow transition hover:bg-biru-terang"
              >
                BACA
                <IconArrow className="h-4 w-4" />
              </button>
            </article>
          </li>
        ))}
      </ul>

      <ArticleDialog article={open} onClose={close} />
    </div>
  );
}