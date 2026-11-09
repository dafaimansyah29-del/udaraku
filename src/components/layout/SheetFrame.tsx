import type { ReactNode, Ref } from "react";

type Props = {
  /** Judul pada tab biru yang menempel di atas kartu. */
  tab: string;
  children: ReactNode;
  /** Dipakai untuk menggulir ke hasil. */
  innerRef?: Ref<HTMLDivElement>;
};

/** Lembar putih membulat yang menutupi hero, berisi tab biru dan kartu putih. */
export default function SheetFrame({ tab, children, innerRef }: Props) {
  return (
    <section className="relative z-10 -mt-12 rounded-t-[2.5rem] bg-white px-4 pb-16 pt-10 sm:px-8 sm:pb-20">
      <div ref={innerRef} className="mx-auto max-w-6xl scroll-mt-24">
        <div className="rounded-t-4xl bg-biru px-6 pb-8 pt-4 sm:px-10 sm:pt-5">
          <h2 className="text-lg font-extrabold uppercase tracking-wide text-white sm:text-2xl">{tab}</h2>
        </div>
        <div className="relative -mt-5 min-h-[320px] rounded-t-3xl rounded-b-4xl bg-white p-3 shadow-card ring-1 ring-navy/5 sm:p-5">
          {children}
        </div>
      </div>
    </section>
  );
}