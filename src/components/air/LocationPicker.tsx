"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { SEARCH } from "@/lib/constants";
import { searchCities } from "@/lib/geocode";
import type { Place } from "@/lib/air-types";
import PillButton from "@/components/ui/PillButton";
import { IconLocate, IconPin, IconSearch } from "@/components/ui/Icons";

type Props = {
  onSelect: (place: Place) => void;
  onLocate: () => void;
  locating: boolean;
  /** Pesan bila deteksi lokasi gagal. */
  geoError: string | null;
};

type SearchState = "idle" | "loading" | "done" | "error";

export default function LocationPicker({ onSelect, onLocate, locating, geoError }: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const skipNextSearch = useRef(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [state, setState] = useState<SearchState>("idle");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const trimmed = query.trim();
  const showList = open && trimmed.length >= SEARCH.MIN_QUERY_LENGTH;

  // Cari kota setelah pengguna berhenti mengetik
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    if (trimmed.length < SEARCH.MIN_QUERY_LENGTH) {
      setState("idle");
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setState("loading");
    const timer = setTimeout(async () => {
      try {
        const found = await searchCities(trimmed, controller.signal);
        setResults(found);
        setActive(-1);
        setState("done");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState("error");
      }
    }, SEARCH.DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  // Tutup daftar saat klik di luar
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const choose = (place: Place) => {
    skipNextSearch.current = true;
    setQuery(place.name);
    setOpen(false);
    setActive(-1);
    onSelect(place);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showList || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state !== "done" || results.length === 0) return;
    choose(results[active >= 0 ? active : 0]);
  };

  return (
    <div ref={rootRef} className="relative z-30 mx-auto w-full max-w-3xl">
      <div className="flex flex-col gap-3 rounded-[28px] border border-white/20 bg-white/10 p-3 shadow-glass backdrop-blur-xl sm:flex-row sm:items-center sm:p-3.5">
        <form onSubmit={onSubmit} className="relative flex-1" role="search">
          <label htmlFor="cari-kota" className="sr-only">
            Cari kota
          </label>
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy/50" />
          <input
            id="cari-kota"
            type="text"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Cari kota, misalnya Bandung"
            className="h-12 w-full rounded-full bg-white pl-12 pr-4 text-base text-navy shadow-inner placeholder:text-navy/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
          />

          {showList && (
            <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl bg-white text-left shadow-card-lg ring-1 ring-navy/10">
              {state === "loading" && (
                <p role="status" className="px-4 py-3 text-sm text-navy/60">
                  Mencari kota…
                </p>
              )}
              {state === "error" && (
                <p role="alert" className="px-4 py-3 text-sm text-navy/80">
                  Pencarian sedang bermasalah. Periksa koneksimu, lalu coba ketik lagi.
                </p>
              )}
              {state === "done" && results.length === 0 && (
                <p role="status" className="px-4 py-3 text-sm text-navy/80">
                  Kota “{trimmed}” tidak ditemukan. Coba tulis nama lain.
                </p>
              )}
              {state === "done" && results.length > 0 && (
                <ul id={listId} role="listbox" aria-label="Hasil pencarian kota">
                  {results.map((place, i) => (
                    <li
                      key={`${place.lat},${place.lon}`}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={i === active}
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => choose(place)}
                      onMouseEnter={() => setActive(i)}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-3 ${
                        i === active ? "bg-abu" : ""
                      }`}
                    >
                      <IconPin className="h-5 w-5 shrink-0 text-biru" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-navy">{place.name}</span>
                        {place.subtitle && (
                          <span className="block truncate text-xs text-navy/60">{place.subtitle}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </form>

        <PillButton onClick={onLocate} disabled={locating} showArrow={false} className="shrink-0 !py-3.5">
          <IconLocate className={`h-4 w-4 ${locating ? "animate-spin motion-reduce:animate-none" : ""}`} />
          {locating ? "MENCARI LOKASI…" : "GUNAKAN LOKASIKU"}
        </PillButton>
      </div>

      {geoError && (
        <p
          role="alert"
          className="mt-3 rounded-2xl bg-white/10 px-4 py-3 text-center text-sm text-white ring-1 ring-white/20 backdrop-blur-md"
        >
          {geoError}
        </p>
      )}
    </div>
  );
}
