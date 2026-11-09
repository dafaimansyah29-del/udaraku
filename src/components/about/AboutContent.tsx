"use client";

import { useCallback, useEffect, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import Link from "next/link";
import { ALERT_LEVELS } from "@/lib/alert";
import { formatNumber } from "@/lib/format";
import {
  ACTIVITIES,
  ACTIVITY_ORDER,
  AGE_BANDS,
  CONDITIONS,
  CONDITION_ORDER,
  MASKS,
  MASK_ORDER,
  REFERENCE_BREATH_RATE,
  REFERENCE_DOSE,
  REFERENCE_HOURS,
  RISK_LEVELS,
  WHO_PM25_24H,
} from "@/lib/risk-config";
import { CONTACT_EMAIL, OPERATOR_NAME, POLICY_UPDATED } from "@/lib/site";
import NotificationButton from "@/components/alert/NotificationButton";
import ClearDataButton from "./ClearDataButton";

const pct = (v: number) => `${formatNumber(v * 100, 0)}%`;
const num = (v: number) => formatNumber(v, 1);

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-cyan underline underline-offset-2 hover:text-white">
      {children}
    </a>
  );
}

function Section({
  id,
  title,
  hidden,
  children,
}: {
  id: string;
  title: string;
  hidden: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      hidden={hidden}
      className="scroll-mt-28 rounded-3xl bg-white/[0.07] p-5 ring-1 ring-white/10 sm:p-8"
    >
      <h3 className="text-xl font-extrabold text-white sm:text-2xl">
        {title}
      </h3>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-white/85 [&>p]:max-w-4xl [&>ul]:max-w-4xl">{children}</div>
    </section>
  );
}

function Sub({ children }: { children: ReactNode }) {
  return <h4 className="pt-2 font-heading text-base font-extrabold text-cyan">{children}</h4>;
}

/** Tabel sederhana yang bisa digeser di layar sempit. */
function Table({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="overflow-x-auto rounded-2xl bg-ink/40 ring-1 ring-white/15"
    >
      <table className="w-full min-w-[420px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-white/[0.08] text-xs uppercase tracking-wide text-white/80">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/10 align-top">
              {r.map((c, j) =>
                j === 0 ? (
                  <th key={j} scope="row" className="px-4 py-2.5 font-semibold text-white">
                    {c}
                  </th>
                ) : (
                  <td key={j} className="px-4 py-2.5 text-white/85">
                    {c}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TOC = [
  { id: "tentang-kami", label: "Tentang" },
  { id: "sumber-data", label: "Sumber data" },
  { id: "metodologi", label: "Rumus & metodologi" },
  { id: "batasan", label: "Batasan" },
  { id: "privasi", label: "Privasi" },
] as const;

type TabId = (typeof TOC)[number]["id"];

const isTabId = (v: string): v is TabId => TOC.some((t) => t.id === v);

/**
 * Isi halaman Tentang dibagi jadi tab. Hanya satu bagian tampil; semua tetap ada di halaman
 * (disembunyikan) sehingga mesin pencari dan pembaca layar masih bisa membacanya.
 * Alamat seperti /tentang#privasi langsung membuka tab yang sesuai.
 */
export default function AboutContent() {
  const [active, setActive] = useState<TabId>("tentang-kami");

  // Ikuti hash di alamat (saat dibuka dan saat berubah, mis. dari tautan footer)
  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.replace("#", "");
      if (isTabId(h)) setActive(h);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const select = useCallback((id: TabId, focus = false) => {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
    if (focus) document.getElementById(`tab-${id}`)?.focus();
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TOC.findIndex((t) => t.id === active);
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % TOC.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + TOC.length) % TOC.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TOC.length - 1;
    if (next < 0) return;
    e.preventDefault();
    select(TOC[next].id, true);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Tab: pil melebar ke samping di tengah, seperti menu utama */}
      <div
        role="tablist"
        aria-label="Isi halaman"
        onKeyDown={onKeyDown}
        className="mx-auto flex w-fit max-w-full flex-wrap justify-center gap-1 rounded-[28px] border border-white/15 bg-white/[0.07] p-1.5 shadow-[0_10px_40px_-20px_rgba(34,211,238,0.35)] backdrop-blur-sm sm:rounded-full"
      >
        {TOC.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={t.id}
              tabIndex={on ? 0 : -1}
              onClick={() => select(t.id)}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors sm:px-5 ${
                on
                  ? "bg-cyan text-ink shadow-[0_0_24px_-6px_rgba(34,211,238,0.8)]"
                  : "text-white/85 hover:bg-white/15 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 1. Tentang */}
      <Section id="tentang-kami" title="Tentang UdaraKu" hidden={active !== "tentang-kami"}>
        <p>
          UdaraKu mengubah angka polusi udara menjadi hal yang mudah dipahami: seberapa bersih udara di lokasimu,
          dan apa artinya bagi napasmu sesuai usia, kondisi kesehatan, dan rencana aktivitasmu.
        </p>
        <p>
          Proyek ini mendukung <strong>SDGs 3: Kehidupan Sehat dan Sejahtera</strong>, termasuk target 3.9 tentang
          mengurangi penyakit akibat pencemaran udara. UdaraKu adalah alat <strong>edukasi</strong>, bukan layanan
          medis dan bukan pengganti dokter.
        </p>
        <p>
          Selaras dengan tema <strong>&quot;Empowering Global Innovators for an Intelligent Future&quot;</strong>:
          UdaraKu memberdayakan warga lewat saran yang personal, memakai data terbuka dengan penalaran yang
          transparan, dan membantu bersiap lewat prakiraan serta peringatan dini.
        </p>
        <p className="rounded-2xl bg-[#0B1E5B]/70 px-4 py-3 text-sm font-semibold text-white ring-1 ring-cyan/30">
          Edukasi, bukan diagnosis medis.
        </p>
      </Section>

      {/* 2. Sumber data */}
      <Section id="sumber-data" title="Sumber data" hidden={active !== "sumber-data"}>
        <Table
          caption="Sumber data UdaraKu"
          head={["Data", "Sumber", "Catatan"]}
          rows={[
            [
              "Kualitas udara dan prakiraan PM2.5 (72 jam)",
              <Ext key="om" href="https://open-meteo.com/en/docs/air-quality-api">
                Open-Meteo Air Quality API
              </Ext>,
              <>
                Hasil <strong>model komputer</strong> CAMS (
                <Ext href="https://atmosphere.copernicus.eu/">Copernicus Atmosphere Monitoring Service</Ext>), bukan
                alat ukur di jalan depan rumahmu.
              </>,
            ],
            ["Suhu dan kelembapan", "Open-Meteo Forecast API", "Hanya pelengkap tampilan."],
            ["Pencarian nama kota", "Open-Meteo Geocoding API", "Dipanggil langsung dari peramban."],
            [
              "Peta",
              <Ext key="osm" href="https://www.openstreetmap.org/copyright">
                OpenStreetMap contributors
              </Ext>,
              "Ditampilkan dengan Leaflet, dengan peta dasar OpenStreetMap yang diberi warna gelap.",
            ],
            [
              "Titik panas kebakaran (opsional)",
              <Ext key="firms" href="https://firms.modaps.eosdis.nasa.gov/">
                NASA FIRMS
              </Ext>,
              "Satelit VIIRS. Hanya aktif bila pengelola memasang kunci API.",
            ],
            [
              "Batas PM2.5 harian",
              "WHO Global Air Quality Guidelines 2021",
              `${WHO_PM25_24H} µg/m³ untuk rata-rata 24 jam.`,
            ],
            [
              "Indeks ISPU",
              "Permen LHK No. P.14/MENLHK/SETJEN/KUM.1/7/2020",
              "Indeks Standar Pencemar Udara Indonesia.",
            ],
            [
              "Indeks US AQI",
              <Ext key="epa" href="https://www.airnow.gov/aqi/aqi-basics/">
                US EPA AirNow
              </Ext>,
              "Memakai batas PM2.5 hasil revisi EPA 2024.",
            ],
          ]}
        />
        <p className="text-sm text-white/75">
          Layanan API gratis Open-Meteo diperuntukkan bagi penggunaan non-komersial dan data hasil olahan
          mencantumkan sumbernya. Syarat lengkap dan terbaru ada di{" "}
          <Ext href="https://open-meteo.com/en/terms">open-meteo.com/en/terms</Ext>.
        </p>
      </Section>

      {/* 3. Metodologi */}
      <Section id="metodologi" title="Rumus dan metodologi" hidden={active !== "metodologi"}>
        <Sub>Indeks kualitas udara (halaman Cek Udara)</Sub>
        <p>
          Tiap polutan diubah menjadi indeks lewat tabel batas resmi (ISPU atau US AQI) dengan interpolasi linear di
          dalam tiap kategori. Indeks keseluruhan adalah indeks <strong>tertinggi</strong> di antara semua polutan.
        </p>

        <Sub>Kalkulator risiko personal</Sub>
        <p className="rounded-2xl bg-ink/40 p-4 font-mono text-sm leading-relaxed text-white ring-1 ring-white/15">
          Dosis (µg) = PM2.5 (µg/m³) × laju napas (m³/jam) × durasi (jam) × faktor kerentanan × (1 − efektivitas
          masker)
        </p>
        <p>
          Dosis itu dibandingkan dengan <strong>dosis acuan WHO</strong> = {WHO_PM25_24H} µg/m³ ×{" "}
          {num(REFERENCE_BREATH_RATE)} m³/jam × {REFERENCE_HOURS} jam = <strong>{REFERENCE_DOSE} µg</strong>. Itu
          jumlah PM2.5 yang terhirup orang yang diam seharian penuh di udara tepat pada batas harian WHO. Rasio
          dosis ÷ dosis acuan menentukan kategori:
        </p>
        <Table
          caption="Kategori risiko"
          head={["Kategori", "Rasio dosis ÷ acuan"]}
          rows={RISK_LEVELS.map((l, i) => {
            const next = RISK_LEVELS[i + 1];
            return [
              l.label,
              next ? `${pct(l.minRatio)} sampai di bawah ${pct(next.minRatio)}` : `${pct(l.minRatio)} atau lebih`,
            ];
          })}
        />

        <Sub>Angka yang dipakai</Sub>
        <p>
          Semua angka ada di satu berkas kode (<code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-cyan">lib/risk-config.ts</code>)
          lengkap dengan sumbernya, dan tabel di bawah ini dibaca langsung dari berkas itu.
        </p>
        <Table
          caption="Laju napas per aktivitas"
          head={["Aktivitas", "Laju napas (m³/jam)"]}
          rows={ACTIVITY_ORDER.map((a) => [ACTIVITIES[a].label, num(ACTIVITIES[a].breathRate)])}
        />
        <Table
          caption="Faktor kerentanan menurut usia"
          head={["Kelompok usia", "Faktor"]}
          rows={AGE_BANDS.map((b) => [b.label, num(b.factor)])}
        />
        <Table
          caption="Faktor kerentanan menurut kondisi kesehatan"
          head={["Kondisi", "Faktor"]}
          rows={CONDITION_ORDER.map((c) => [CONDITIONS[c].label, num(CONDITIONS[c].factor)])}
        />
        <p className="text-sm">
          Faktor kerentanan total = faktor usia × faktor kondisi <strong>tertinggi</strong> (kondisi tidak dikalikan
          satu sama lain).
        </p>
        <Table
          caption="Efektivitas masker"
          head={["Masker", "Menyaring PM2.5 (perkiraan)"]}
          rows={MASK_ORDER.map((m) => [MASKS[m].label, pct(MASKS[m].effectiveness)])}
        />
        <p className="text-sm text-white/75">
          Laju napas dibulatkan dari data US EPA <em>Exposure Factors Handbook</em> dan Tainio dkk. (2016). Faktor
          kerentanan dan efektivitas masker adalah <strong>perkiraan untuk edukasi</strong> yang dibuat konservatif;
          bukan angka baku dari satu sumber tunggal dan belum ditinjau ahli kesehatan masyarakat.
        </p>

        <Sub>Prakiraan, jam terbaik, dan peringatan</Sub>
        <p>
          Prakiraan memakai PM2.5 per jam dari model. &quot;Jam terbaik&quot; adalah 3 jam dengan PM2.5 terendah dalam 24
          jam ke depan. Banner peringatan muncul saat PM2.5 <strong>lebih dari {WHO_PM25_24H} µg/m³</strong> dan
          warnanya mengikuti tingkat:
        </p>
        <Table
          caption="Tingkat peringatan"
          head={["Tingkat", "PM2.5 lebih dari (µg/m³)"]}
          rows={ALERT_LEVELS.map((l) => [l.label, num(l.above)])}
        />
        <p className="text-sm text-white/75">
          Pembagian tingkat ini adalah keputusan desain UdaraKu yang merujuk target antara WHO 2021, bukan angka
          resmi WHO.
        </p>
      </Section>

      {/* 4. Batasan */}
      <Section id="batasan" title="Batasan yang perlu kamu tahu" hidden={active !== "batasan"}>
        <ul className="list-disc space-y-2 pl-5 marker:text-cyan">
          <li>
            Data udara berasal dari <strong>model</strong>, dengan resolusi kasar. Bisa berbeda dari kondisi di
            lokasimu, terutama saat kebakaran lahan, hujan, atau sumber polusi lokal yang tidak terpantau model.
          </li>
          <li>Kalkulator hanya memakai PM2.5. PM10, ozon, NO2, dan gas lain tidak ikut dihitung.</li>
          <li>
            Batas WHO berlaku untuk rata-rata 24 jam, sedangkan data kami per jam. Kategori dan banner per jam adalah
            peringatan dini, bukan penetapan resmi.
          </li>
          <li>
            Faktor kerentanan dan efektivitas masker adalah perkiraan. Masker hanya efektif bila pas dan rapat di
            wajah.
          </li>
          <li>Udara di dalam ruangan, asap rokok, dan paparan di jam lain tidak dihitung.</li>
          <li>
            Titik panas satelit menunjukkan area bersuhu tinggi, bukan kepastian kebakaran, dan datanya bisa tertunda
            beberapa jam.
          </li>
          <li>
            Saat offline, UdaraKu menampilkan data tersimpan dengan label &quot;Data offline, terakhir diperbarui
            ...&quot;. Data itu bisa sudah lama. Peta dasar tidak tersedia offline.
          </li>
          <li>
            Notifikasi hanya muncul saat UdaraKu sedang terbuka di peramban. Kami belum mengirim notifikasi saat
            aplikasi ditutup.
          </li>
          <li>
            Bila kamu sesak napas, nyeri dada, atau gejala lain, segera cari pertolongan medis. UdaraKu bukan
            diagnosis medis.
          </li>
        </ul>
      </Section>

      {/* 5. Privasi */}
      <Section id="privasi" title="Kebijakan privasi singkat" hidden={active !== "privasi"}>
        <p className="text-sm text-white/75">Terakhir ditinjau: {POLICY_UPDATED}.</p>
        <p>
          Kami berupaya mengikuti prinsip{" "}
          <strong>Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</strong>: memakai data
          seperlunya, jujur tentang caranya, dan memberimu kendali. Tidak ada akun, tidak ada login, tidak ada iklan,
          dan tidak ada pelacak atau analitik.
        </p>

        <Sub>Data apa yang dipakai</Sub>
        <Table
          caption="Data yang diproses dan tempatnya"
          head={["Data", "Dipakai untuk", "Disimpan di mana"]}
          rows={[
            [
              "Lokasi (kota yang kamu cari, atau koordinat bila kamu mengizinkan)",
              "Mengambil data udara",
              "Koordinat dibulatkan (±1 km) dikirim ke server UdaraKu, lalu diteruskan ke Open-Meteo (dan NASA FIRMS bila aktif). Tidak disimpan oleh UdaraKu.",
            ],
            [
              "Profil kalkulator: usia, kondisi kesehatan, aktivitas, durasi, masker",
              "Menghitung risiko",
              "Hanya di perangkatmu (localStorage). Tidak dikirim ke server mana pun.",
            ],
            [
              "Lokasi dan PM2.5 terakhir",
              "Banner peringatan dan data offline",
              "Hanya di perangkatmu.",
            ],
            ["Pilihan notifikasi", "Mengingat pilihanmu", "Hanya di perangkatmu."],
            [
              "Cache offline",
              "Membuka aplikasi tanpa internet",
              "Hanya di perangkatmu. Alamat permintaannya memuat koordinat.",
            ],
          ]}
        />
        <p>
          Kondisi kesehatan termasuk &quot;data dan informasi kesehatan&quot;, yaitu data pribadi yang bersifat spesifik
          menurut Pasal 4 ayat (2) UU PDP. Karena itu data tersebut sengaja <strong>hanya tinggal di perangkatmu</strong>
          dan tidak pernah dikirim ke server.
        </p>

        <Sub>Pihak ketiga yang bisa melihat alamat IP-mu</Sub>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-cyan">
          <li>Open-Meteo: saat kamu mencari nama kota (teks pencarian dan IP, langsung dari peramban).</li>
          <li>OpenStreetMap (tile.openstreetmap.org): saat kamu membuka peta (IP dan area yang dilihat).</li>
          <li>YouTube (youtube-nocookie.com): hanya setelah kamu menekan tombol play video.</li>
          <li>
            Penyedia hosting situs ini dapat mencatat alamat IP dan alamat permintaan (termasuk koordinat yang
            dibulatkan) di log servernya.
          </li>
        </ul>

        <Sub>Dasar pemrosesan: persetujuanmu</Sub>
        <p>
          Sesuai Pasal 20 ayat (2) huruf a UU PDP, kami memproses data atas persetujuan yang sah secara eksplisit:
          lokasi hanya saat kamu menekan &quot;Gunakan Lokasiku&quot; lalu mengizinkan peramban, atau saat kamu mengetik
          nama kota; notifikasi hanya setelah kamu menekan tombol &quot;Aktifkan notifikasi&quot;. Data profil tersimpan
          otomatis di perangkat setelah kamu mengubah formulir.
        </p>

        <Sub>Hakmu</Sub>
        <p>
          UU PDP memberimu, antara lain, hak mendapat informasi (Pasal 5), memperbaiki data (Pasal 6), mengakses
          data (Pasal 7), mengakhiri pemrosesan dan menghapus data (Pasal 8), dan menarik persetujuan (Pasal 9).
          Di UdaraKu:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-cyan">
          <li>Informasi: halaman ini.</li>
          <li>Akses dan perbaikan: datamu ada di perangkatmu; ubah langsung di formulir kalkulator.</li>
          <li>Hapus: tombol di bawah, atau &quot;Hapus data saya&quot; di halaman Kalkulator Risiko.</li>
          <li>Tarik persetujuan: matikan izin lokasi atau notifikasi di pengaturan situs peramban, atau tombol di bawah.</li>
        </ul>
        <p>
          Kami tidak menyimpan data pribadimu di server, jadi tidak ada salinan di server yang perlu dihapus. Data
          di perangkat tersimpan sampai kamu menghapusnya.
        </p>
        <p className="text-sm text-white/75">
          Pengguna di bawah 18 tahun sebaiknya didampingi orang tua atau wali saat mengisi data kesehatan. Ringkasan ini
          ditulis dengan bahasa sederhana dan bukan pengganti teks resmi undang-undang.
        </p>

        <Sub>Kontrol datamu</Sub>
        <div className="flex flex-col gap-5 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/15 sm:p-5">
          <ClearDataButton />
          <div>
            <p className="mb-2 text-sm font-semibold text-white">Notifikasi peringatan udara</p>
            <NotificationButton tone="page" />
          </div>
        </div>

        <Sub>Kontak pengelola</Sub>
        {CONTACT_EMAIL ? (
          <p>
            {OPERATOR_NAME ? <>{OPERATOR_NAME}: </> : null}
            <a className="font-semibold text-cyan underline underline-offset-2 hover:text-white" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            . Hubungi kami untuk pertanyaan atau permintaan terkait data pribadimu.
          </p>
        ) : (
          <p>Kontak pengelola belum diatur pada situs ini.</p>
        )}
      </Section>

      <p className="px-1 text-sm text-white/75">
        Mau mencoba? Buka <Link href="/cek-udara" className="font-semibold text-cyan underline underline-offset-2 hover:text-white">Cek Udara</Link> atau{" "}
        <Link href="/kalkulator-risiko" className="font-semibold text-cyan underline underline-offset-2 hover:text-white">Kalkulator Risiko</Link>.
      </p>
    </div>
  );
}