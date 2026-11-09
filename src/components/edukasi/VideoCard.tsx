"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DEFAULT_EDU_VIDEO_ID, getVideoId } from "@/lib/education";
import { IconLungs, IconPlay } from "@/components/ui/Icons";

const TITLE = "Polusi udara dan tubuhmu";

/**
 * Kartu video membulat dengan tombol play bulat. Video YouTube baru dimuat
 * (dari youtube-nocookie.com) setelah tombol play ditekan, jadi membuka halaman
 * ini tidak menghubungi pihak ketiga. ID video diambil dari NEXT_PUBLIC_EDU_YOUTUBE_ID,
 * atau video bawaan bila kosong. Tautan "Buka di YouTube" jadi cadangan bila video tidak bisa diputar.
 */
export default function VideoCard() {
  const reduce = useReducedMotion();
  const videoId = getVideoId() ?? DEFAULT_EDU_VIDEO_ID;
  const [playing, setPlaying] = useState(false);

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0B1E5B] via-[#2A2F9E] to-ungu shadow-[0_30px_80px_-30px_rgba(34,211,238,0.35)] ring-1 ring-white/20 sm:rounded-[36px]">
        {playing ? (
          <iframe
            title={TITLE}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <>
            {/* Sampul: lingkaran bersusun seperti pengukur udara */}
            <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
              <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full border-[28px] border-white/10" />
              <div className="absolute -bottom-16 -left-10 h-72 w-72 rounded-full border-[36px] border-cyan/15" />
              <div className="absolute right-[12%] top-[18%] h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.35),transparent_70%)] blur-sm" />
              <IconLungs className="absolute bottom-6 right-6 h-20 w-20 text-white/20 sm:h-28 sm:w-28" />
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              <div className="text-white">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/85">Video edukasi</p>
                <p className="mt-1 font-heading text-lg font-extrabold leading-tight sm:text-2xl">{TITLE}</p>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Putar video: ${TITLE}`}
              whileHover={reduce ? undefined : { scale: 1.08 }}
              whileTap={reduce ? undefined : { scale: 0.95 }}
              className="absolute left-1/2 top-[42%] grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ungu shadow-[0_12px_40px_-6px_rgba(108,92,231,0.9)] sm:h-24 sm:w-24"
            >
              {!reduce && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 animate-ping rounded-full bg-white/60 motion-reduce:hidden"
                  style={{ animationDuration: "2.4s" }}
                />
              )}
              <IconPlay className="relative ml-1 h-8 w-8 sm:h-10 sm:w-10" />
            </motion.button>
          </>
        )}
      </div>
      <p className="mt-3 px-1 text-xs text-white/75">
        Video belum bisa diputar?{" "}
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block py-1 font-semibold text-cyan underline underline-offset-2 hover:text-white"
        >
          Buka di YouTube
        </a>
      </p>
    </div>
  );
}