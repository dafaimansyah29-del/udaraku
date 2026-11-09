import { MARQUEE_WORDS } from "@/lib/education";
import VideoCard from "./VideoCard";

/** Satu putaran teks: kata bergantian putih dan huruf berongga bergaris tepi cyan, dipisah garis miring ungu.
 * Isi huruf berongga sengaja diwarnai sama dengan latar dan paint-order stroke-fill dipakai supaya garis
 * potongan bentuk huruf di bagian dalam (artefak font variabel) tertutup dan tidak terlihat. */
function Words({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className={`${hidden ? "motion-reduce:hidden " : ""}flex shrink-0 items-center gap-[0.4em] pr-[0.4em] motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:pr-0 font-heading text-[clamp(2.25rem,6vw,5rem)] font-extrabold leading-none tracking-tight`}
    >
      {MARQUEE_WORDS.map((word, i) => (
        <li key={word} className="flex items-center gap-[0.4em]">
          <span
            className={
              i % 2 === 0
                ? "bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent"
                : "text-[#0c205e] [-webkit-text-stroke:3px_rgba(103,232,249,0.95)] [paint-order:stroke_fill]"
            }
          >
            {word}
          </span>
          <span className="text-ungu/80">/</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Teks besar berjalan horizontal (memudar di kedua tepi) lalu panel kaca berisi penjelasan
 * dan kartu video. Bila gerak dikurangi, teks berhenti dan dibungkus ke baris baru.
 */
export default function MarqueeSection() {
  return (
    <section
      aria-labelledby="minimal-judul"
      className="overflow-hidden px-5 pb-24 pt-14 sm:px-8 sm:pb-28 sm:pt-20 lg:px-12 xl:px-16"
    >
      <h2 id="minimal-judul" className="sr-only">
        Pelajari polutan dan prakiraan udara
      </h2>

      <div className="-mx-5 select-none py-4 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] sm:-mx-8 sm:py-6 lg:-mx-12 xl:-mx-16">
        <div className="flex w-max animate-marquee motion-reduce:w-auto motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center">
          <Words />
          <Words hidden />
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-[1560px] rounded-[32px] border border-white/15 bg-white/[0.06] p-5 shadow-[0_30px_80px_-40px_rgba(34,211,238,0.3)] backdrop-blur-sm sm:mt-14 sm:p-8 lg:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.25fr] lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan">
              <span className="h-px w-8 bg-cyan/70" aria-hidden="true" />
              Tonton
            </p>
            <h3 className="mt-3 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Polusi udara dan tubuhmu, dalam satu video singkat
            </h3>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/80">
              Pahami dari mana polusi datang, bagaimana ia masuk ke tubuh, dan langkah kecil yang bisa kamu lakukan
              setiap hari.
            </p>
          </div>
          <VideoCard />
        </div>
      </div>
    </section>
  );
}