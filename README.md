# UdaraKu

Web kualitas udara untuk Indonesia yang mengubah data polusi menjadi **risiko kesehatan pernapasan yang personal**. Mendukung SDGs 3: Kehidupan Sehat dan Sejahtera.

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 3 · Framer Motion · Recharts · Leaflet.

> **Penting:** UdaraKu adalah alat edukasi, bukan alat diagnosis atau saran medis. Koefisien kerentanan dan masker di kalkulator adalah perkiraan (ditandai "B" di `src/lib/risk-config.ts`) dan perlu ditinjau ahli kesehatan masyarakat sebelum dipakai luas.

---

## Daftar isi

1. [Fitur](#fitur)
2. [Mulai cepat](#mulai-cepat)
3. [Variabel lingkungan](#variabel-lingkungan)
4. [Perintah](#perintah)
5. [Struktur proyek](#struktur-proyek)
6. [Sumber data](#sumber-data)
7. [PWA dan mode offline](#pwa-dan-mode-offline)
8. [Peringatan dan notifikasi](#peringatan-dan-notifikasi)
9. [Privasi dan data di perangkat](#privasi-dan-data-di-perangkat)
10. [Aksesibilitas, SEO, dan performa](#aksesibilitas-seo-dan-performa)
11. [Pengujian](#pengujian)
12. [Deploy ke Vercel](#deploy-ke-vercel)
13. [Batasan yang diketahui](#batasan-yang-diketahui)
14. [Pemecahan masalah](#pemecahan-masalah)

---

## Fitur

| Halaman | Rute | Isi |
| --- | --- | --- |
| Beranda | `/` | Hero, ringkasan fitur |
| Cek Udara | `/cek-udara` | PM2.5, PM10, NO₂, O₃, SO₂, CO untuk lokasimu atau kota pilihan; indeks US AQI atau ISPU |
| Kalkulator Risiko | `/kalkulator-risiko` | Risiko personal dari PM2.5 saat ini, usia, kondisi, aktivitas, durasi, masker |
| Prakiraan | `/prakiraan` | Grafik PM2.5 72 jam dan "jam terbaik" untuk beraktivitas |
| Peta | `/peta` | Peta OpenStreetMap dengan penanda warna; titik panas NASA FIRMS (opsional) |
| Edukasi | `/edukasi` | Artikel singkat, teks berjalan, video |
| Tentang & Metodologi | `/tentang` | Sumber data, rumus, batasan, kebijakan privasi (UU PDP No. 27/2022), tombol hapus data |

Fitur lintas halaman:

- **Banner peringatan** di bagian atas saat PM2.5 lokasi terakhirmu di atas **15 µg/m³** (batas harian WHO 2021). Empat tingkat berwarna: Waspada (>15), Tidak sehat bagi kelompok rentan (>37,5), Tidak sehat (>75), Berbahaya (>150).
- **Tombol "Aktifkan notifikasi"**: izin peramban baru diminta setelah tombol diklik.
- **PWA**: bisa dipasang ke layar utama, dan menampilkan data tersimpan saat offline dengan label *"Data offline, terakhir diperbarui ..."*.

## Mulai cepat

Butuh Node.js 18.18 atau lebih baru dan koneksi internet (font Google diunduh saat build/dev).

```bash
npm install
cp .env.example .env.local   # opsional: semua variabel boleh kosong
npm run dev
```

Buka http://localhost:3000. Untuk produksi lokal:

```bash
npm run build && npm start
```

> Service worker (PWA) **hanya didaftarkan pada build produksi**. Untuk mencoba mode offline, pakai `npm run build && npm start`, bukan `npm run dev`.

## Variabel lingkungan

Semua **opsional**: tanpa satu pun isian, aplikasi tetap berjalan penuh. Lihat `.env.example`.

| Variabel | Dibaca di | Fungsi |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | build | Alamat situs (mis. `https://udaraku.id`) untuk canonical, Open Graph, sitemap. Kosong: di Vercel dipakai domain produksi otomatis, lalu alamat deployment, lalu `http://localhost:3000` |
| `NEXT_PUBLIC_OWNER_NAME` | build | Nama pengelola di bagian privasi halaman Tentang |
| `NEXT_PUBLIC_CONTACT_EMAIL` | build | Surel kontak di bagian privasi. **Isi sebelum rilis publik.** Kosong: halaman menulis "Kontak pengelola belum diatur" |
| `FIRMS_MAP_KEY` | server | Kunci NASA FIRMS (gratis) untuk titik panas. Tidak pernah dikirim ke peramban. Kosong: tombol "Titik panas" hilang dan `/api/firms` membalas 404 |
| `NEXT_PUBLIC_EDU_YOUTUBE_ID` | build | ID video YouTube (11 karakter) untuk halaman Edukasi. Kosong: kartu "Segera hadir" |
| `OPEN_METEO_AIR_URL`, `OPEN_METEO_WEATHER_URL`, `FIRMS_API_URL` | server | **Hanya untuk pengujian**: mengalihkan permintaan ke server tiruan. Jangan diisi di produksi |

Variabel berawalan `NEXT_PUBLIC_` **tertanam ke kode saat build**. Mengubahnya berarti build ulang (di Vercel: Redeploy). Jangan menaruh rahasia di sana.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm start` | Jalankan hasil build |
| `npm run typecheck` | Periksa tipe TypeScript |
| `npm test` | Tes unit (Vitest) |

## Struktur proyek

```
public/
  sw.js              service worker (cache, offline, push/notificationclick)
  offline.html       halaman cadangan saat offline dan halaman belum pernah dibuka
  icons/             ikon PWA 192, 512, maskable 512, apple-touch-icon
  og/udaraku-og.png  gambar Open Graph 1200x630
  images/            paru-paru-3d.webp
src/
  app/               halaman, layout, manifest.ts, robots.ts, sitemap.ts, api/{air,forecast,firms}
  components/
    alert/           AlertBanner, NotificationButton
    about/           AboutContent, ClearDataButton
    pwa/             PwaRegister (daftarkan service worker, hanya produksi)
    shared/          OfflineNote (label "Data offline ...")
    air/ forecast/ map/ risk/ edukasi/ hero/ layout/ sections/ ui/
  hooks/             useAir, usePlaceData, useNotifications, useLocate
  lib/
    alert.ts         tingkat peringatan (ambang PM2.5)
    last-air.ts      snapshot data udara terakhir (localStorage)
    notify.ts        preferensi dan aturan anti-spam notifikasi
    local-data.ts    hapus semua data UdaraKu di perangkat
    risk-config.ts   SEMUA koefisien kalkulator, dengan rujukan
    risk.ts          rumus risiko
    aqi.ts           US AQI dan ISPU
    site.ts, seo.ts  identitas situs dan metadata
```

## Sumber data

- **Kualitas udara dan prakiraan**: [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) (model CAMS), tanpa API key. Cuaca (suhu, kelembapan): Open-Meteo Forecast.
- **Geocoding (cari kota)**: Open-Meteo Geocoding, dipanggil dari peramban.
- **Peta**: OpenStreetMap (ubin) lewat Leaflet.
- **Titik panas**: NASA FIRMS (VIIRS), opsional.
- **Batas WHO**: pedoman kualitas udara WHO 2021, PM2.5 rata-rata 24 jam 15 µg/m³.
- **Indeks**: US AQI (EPA, revisi PM2.5 2024) dan ISPU (Permen LHK No. P.14/MENLHK/SETJEN/KUM.1/7/2020).

Data adalah **perkiraan model**, bukan pengukuran alat di titik kamu berdiri. Indeks dihitung dari kadar jam terakhir, sedangkan angka resmi memakai rata-rata 8/24 jam.

### Rumus kalkulator

```
dosis      = PM2.5 × laju napas × durasi × kerentanan × (1 − efektivitas masker)
dosis acuan = 15 µg/m³ × 0,5 m³/jam × 24 jam = 180 µg    (WHO)
rasio      = dosis / dosis acuan
```

Rasio < 25% Rendah · < 50% Sedang · < 100% Tinggi · ≥ 100% Sangat tinggi. Penjelasan lengkap dan tabel koefisien ada di halaman `/tentang`, dibaca langsung dari `risk-config.ts` sehingga selalu sama dengan perhitungan.

Bila yang tampil adalah **data contoh** (API gagal), risiko sengaja tidak dihitung dan data contoh tidak pernah disimpan atau di-cache.

## PWA dan mode offline

- `src/app/manifest.ts` menghasilkan `/manifest.webmanifest` (standalone, ikon 192/512 dan maskable).
- `public/sw.js` memakai tiga cache berawalan `udaraku-`:
  - **Navigasi**: jaringan dulu (batas 6 detik), lalu cache, lalu `/offline.html`.
  - **`/api/air` dan `/api/forecast`**: jaringan dulu; saat offline, salinan terakhir dikembalikan dengan header `x-udaraku-offline: 1`. Respons data contoh dan respons galat **tidak pernah** di-cache.
  - **Aset statis** (`/_next/static`): cache dulu. Gambar dan ikon: stale-while-revalidate.
- Di sisi halaman, bila cache SW tidak ada, `useAir` memakai snapshot di `localStorage` (hanya PM2.5, lokasi yang sama ±0,011°). Label **"Data offline, terakhir diperbarui ..."** tampil di Cek Udara, Prakiraan, Peta, Kalkulator, banner, dan `offline.html`.
- `sw.js` disajikan dengan `Cache-Control: no-cache` (lihat `next.config.mjs`) agar pembaruan cepat sampai.
- Menaikkan versi cache: ubah nama cache di `sw.js` (`udaraku-static-v1` dan seterusnya).

## Peringatan dan notifikasi

- Banner membaca data udara lokasi terakhir yang kamu pilih (di `localStorage`). Bila data lebih tua dari 60 menit dan perangkat online, banner memperbaruinya lewat `/api/air` (hanya koordinat bulat yang dikirim).
- Banner bisa ditutup. Penutupan berlaku selama sesi dan **muncul lagi bila tingkat naik**.
- **Notifikasi bersifat lokal**: dibuat oleh halaman UdaraKu yang sedang terbuka lewat Notification API dan service worker. `Notification.requestPermission()` **hanya dipanggil di dalam penangan klik** tombol, tidak pernah saat halaman dimuat.
- Aturan anti-spam (`src/lib/notify.ts`): notifikasi baru hanya bila tingkat naik, lokasi berganti, jeda 6 jam lewat, atau udara sempat bersih lalu memburuk lagi.

> **Batasan jujur:** ini bukan Web Push penuh. Belum ada server yang menyimpan langganan dan mengirim notifikasi saat UdaraKu tertutup. `sw.js` sudah memiliki penangan `push` dan `notificationclick`, jadi Web Push sungguhan bisa ditambahkan (kunci VAPID, endpoint simpan langganan, pengirim terjadwal, dan persetujuan privasi tambahan) tanpa mengubah antarmuka. Halaman Tentang menyebut batasan ini.

## Privasi dan data di perangkat

Tanpa akun dan tanpa basis data. Server hanya menerima koordinat (dibulatkan) untuk mengambil data udara.

| Penyimpanan | Kunci | Isi |
| --- | --- | --- |
| localStorage | `udaraku:profil-risiko:v1` | Profil kalkulator (usia, kondisi, dll.) |
| localStorage | `udaraku:udara-terakhir:v1` | Lokasi dan PM2.5 terakhir (tidak pernah data contoh) |
| localStorage | `udaraku:notifikasi:v1` | Pilihan notifikasi dan riwayatnya |
| sessionStorage | `udaraku:banner-ditutup:v1` | Tingkat banner yang ditutup |
| CacheStorage | `udaraku-*` | Halaman dan jawaban API (URL memuat koordinat) |

Tombol **"Hapus semua data saya"** di `/tentang` menghapus semuanya dan melaporkan hasilnya dengan jujur. Cache aset statis (kode JavaScript/CSS, tanpa data pribadi) dapat dibuat ulang otomatis setelah penghapusan.

Halaman Tentang memuat kebijakan privasi singkat yang merujuk UU No. 27 Tahun 2022 (Pelindungan Data Pribadi): data kesehatan termasuk data pribadi spesifik (Pasal 4 ayat 2), hak subjek data (Pasal 5–9), dan persetujuan yang eksplisit (Pasal 20 ayat 2 huruf a). **Teks kebijakan ini ringkasan edukatif, bukan nasihat hukum**; minta peninjauan penasihat hukum sebelum rilis publik.

## Aksesibilitas, SEO, dan performa

- **Keyboard**: tautan "Lewati ke konten utama", cincin fokus dua warna (putih + biru) yang terlihat di latar terang maupun gelap, area tabel yang bisa digeser dapat difokus.
- **Kontras**: teks sekunder memakai `text-navy/75` atau lebih pekat; warna banner diuji ≥ 4,5:1. Hasil axe-core (WCAG 2.0/2.1/2.2 A dan AA + praktik terbaik): 0 pelanggaran di 7 halaman dan banner 4 tingkat pada lebar 360 px.
- **Gerak**: animasi menghormati `prefers-reduced-motion`.
- **Alt text** pada semua gambar; satu `h1` per halaman; `lang="id"`.
- **SEO**: `title` per halaman dengan templat `%s — UdaraKu`, deskripsi, canonical, Open Graph + Twitter Card (gambar 1200×630), JSON-LD `WebApplication` di beranda, `robots.txt` (blokir `/api/`), `sitemap.xml` (7 URL).
- **Gambar**: `next/image` dengan format WebP.
- **Lazy-load**: grafik (Recharts), peta (Leaflet), dan laporan risiko dimuat dinamis (`next/dynamic`), sehingga tidak ikut di skrip awal halaman; video YouTube baru dimuat setelah tombol play ditekan.
- **Header keamanan**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.

## Pengujian

```bash
npm run typecheck
npm test            # 157 tes unit: AQI, risiko, prakiraan, FIRMS, peringatan, snapshot, notifikasi, hapus data, situs
```

Pengujian peramban (Playwright, bukan bagian repo) dijalankan terhadap build produksi dengan server tiruan Open-Meteo/FIRMS. Cakupannya: offline sungguhan, service worker, banner empat tingkat dan batas 15,0/15,1, notifikasi (izin diminta tepat 1× setelah klik), halaman Tentang, SEO, axe-core, overflow di 360/768/1280/1440 px.

## Deploy ke Vercel

### Persiapan

1. Pastikan `npm run typecheck`, `npm test`, dan `npm run build` lolos di komputermu.
2. Dorong proyek ke GitHub, GitLab, atau Bitbucket (`.gitignore` sudah mengecualikan `node_modules`, `.next`, dan `.env*.local`; jangan commit `.env.local`).

### Langkah

1. Masuk ke [vercel.com](https://vercel.com), pilih **Add New → Project**, lalu impor repositori.
2. Vercel mengenali Next.js otomatis. Biarkan **Build Command** (`next build`), **Output** dan **Install Command** bawaan. Pastikan **Node.js Version** 18.x atau lebih baru (disarankan 20.x atau 22.x) di *Settings → General*.
3. Di **Environment Variables**, isi (lihat tabel di atas), untuk lingkungan *Production* (dan *Preview* bila perlu):
   - `NEXT_PUBLIC_SITE_URL` = alamat domainmu, mis. `https://udaraku.id` (tanpa garis miring akhir)
   - `NEXT_PUBLIC_OWNER_NAME` dan `NEXT_PUBLIC_CONTACT_EMAIL`
   - `FIRMS_MAP_KEY` (bila ingin titik panas)
   - `NEXT_PUBLIC_EDU_YOUTUBE_ID` (bila ada video)
   - **Jangan** mengisi `OPEN_METEO_*_URL` dan `FIRMS_API_URL` (hanya untuk pengujian).
4. Klik **Deploy**.
5. Setelah selesai, buka alamat produksi dan jalankan [daftar cek rilis](#daftar-cek-rilis).

### Domain sendiri

*Settings → Domains → Add*, ikuti petunjuk DNS Vercel, lalu **isi `NEXT_PUBLIC_SITE_URL` dengan domain itu dan Redeploy** (nilai `NEXT_PUBLIC_` tertanam saat build). HTTPS otomatis, dan HTTPS **wajib** agar service worker serta notifikasi bisa berjalan di produksi.

### Hal yang perlu diperhatikan

- **Mengubah variabel `NEXT_PUBLIC_*` = Redeploy.** Mengubah `FIRMS_MAP_KEY` cukup Redeploy juga agar rute memuat ulang nilainya.
- **Ketentuan API gratis**: Open-Meteo gratis untuk penggunaan **non-komersial** dan memiliki batas permintaan; paket Vercel *Hobby* juga untuk penggunaan non-komersial. Baca ketentuan terbaru keduanya sebelum dipakai untuk layanan berbayar, atau pakai paket komersial Open-Meteo dan Vercel Pro.
- **Cache**: `/api/air` dan `/api/forecast` di-cache 15 menit di server dan CDN; koordinat dibulatkan 2 desimal agar permintaan berdekatan berbagi cache.
- **Service worker**: `/sw.js` tidak di-cache (header sudah diatur). Bila mengganti isi cache, naikkan nama cache di `sw.js`.
- **Preview deployment** memakai alamat `VERCEL_URL`; canonical dan Open Graph di preview menunjuk alamat preview itu (wajar).
- **Build lokal vs Vercel**: font Google diunduh saat build. Di lingkungan tanpa internet keluar, build gagal pada langkah font.

### Daftar cek rilis

Lihat bagian akhir jawaban tahap ini, atau salin dari bawah.

- [ ] `NEXT_PUBLIC_CONTACT_EMAIL` dan `NEXT_PUBLIC_OWNER_NAME` terisi; halaman `/tentang` menampilkan kontak
- [ ] `NEXT_PUBLIC_SITE_URL` = domain produksi; `view-source` menampilkan canonical dan `og:image` dengan domain itu
- [ ] Teks privasi ditinjau penasihat hukum; `POLICY_UPDATED` di `src/lib/site.ts` diperbarui
- [ ] Koefisien (B) di `src/lib/risk-config.ts` ditinjau ahli kesehatan masyarakat
- [ ] Cek Udara, Prakiraan, Peta memakai data **asli** (bukan label "data contoh") di produksi
- [ ] Lighthouse (Mobile) pada `/`, `/cek-udara`, `/kalkulator-risiko`: kinerja, aksesibilitas, praktik terbaik, SEO, PWA
- [ ] Pasang PWA di Android Chrome; matikan jaringan; buka kembali: label "Data offline, terakhir diperbarui ..." muncul
- [ ] Banner muncul untuk lokasi dengan PM2.5 > 15; notifikasi diminta hanya setelah tombol diklik
- [ ] Pratinjau berbagi tautan (WhatsApp/X) menampilkan gambar dan judul yang benar
- [ ] Tombol "Hapus semua data saya" menghapus data dan banner hilang

## Batasan yang diketahui

- Notifikasi hanya muncul saat UdaraKu terbuka (lihat [Peringatan dan notifikasi](#peringatan-dan-notifikasi)).
- Data udara adalah perkiraan model dengan resolusi puluhan kilometer; kondisi lokal (jalan raya, asap setempat) bisa berbeda.
- Koefisien kalkulator bukan hasil validasi klinis.
- API eksternal (Open-Meteo, NASA FIRMS, OpenStreetMap) diuji dengan server tiruan, bukan layanan langsung, di lingkungan pengembangan ini. Uji dengan layanan asli setelah deploy.
- Tampilan notifikasi di sistem operasi (Android/iOS/desktop) belum teruji otomatis; uji manual di perangkat nyata. Di iOS, notifikasi web hanya bekerja bila situs dipasang ke layar utama.

## Pemecahan masalah

| Gejala | Penyebab / solusi |
| --- | --- |
| Mode offline tidak berfungsi di `npm run dev` | Service worker hanya aktif di produksi. Pakai `npm run build && npm start` |
| Tombol notifikasi tidak ada | Peramban tidak mendukung Notification API, atau izin sudah diblokir (ubah di pengaturan situs) |
| Nilai `NEXT_PUBLIC_*` tidak berubah | Build ulang / Redeploy |
| Tombol "Titik panas" tidak muncul | `FIRMS_MAP_KEY` kosong atau belum Redeploy |
| Build gagal saat mengunduh font | Butuh akses internet ke Google Fonts saat build |
| Halaman menampilkan "data contoh" | Open-Meteo tidak terjangkau; periksa koneksi server |
| Pembaruan situs tidak muncul di perangkat yang sudah memasang PWA | Tutup semua tab UdaraKu lalu buka lagi; naikkan versi cache di `sw.js` bila perlu |