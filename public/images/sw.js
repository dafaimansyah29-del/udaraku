/* UdaraKu service worker.
 *
 * Tujuan: aplikasi tetap bisa dibuka saat offline dan menampilkan data udara terakhir.
 *  - Halaman (navigasi)       : jaringan dulu, cadangan cache, lalu /offline.html.
 *  - /_next/static, gambar    : cache dulu (berkas ber-hash tidak berubah).
 *  - /api/air, /api/forecast  : jaringan dulu; bila jaringan putus, jawab dari cache dengan
 *                               header "x-udaraku-offline: 1" supaya halaman menampilkan
 *                               "Data offline, terakhir diperbarui ...". Tanpa salinan: 503 dengan
 *                               header "x-udaraku-offline: miss".
 *  - Data contoh (Cache-Control: no-store) dan galat TIDAK disimpan.
 *  - /api/firms, tile peta OpenStreetMap, dan semua permintaan lintas-situs tidak disentuh.
 *
 * Naikkan VERSION saat strategi berubah supaya cache lama dibersihkan.
 * Semua cache berawalan "udaraku-" dan bisa dihapus dari halaman Tentang (Hapus semua data).
 */
const VERSION = "v1";
const STATIC_CACHE = `udaraku-static-${VERSION}`;
const PAGES_CACHE = `udaraku-pages-${VERSION}`;
const API_CACHE = `udaraku-api-${VERSION}`;
const CURRENT = [STATIC_CACHE, PAGES_CACHE, API_CACHE];

const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];
const API_PATHS = ["/api/air", "/api/forecast"];
const NETWORK_TIMEOUT_MS = 6000;
const MAX_API_ENTRIES = 30;
const MAX_PAGE_ENTRIES = 20;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((n) => n.startsWith("udaraku-") && !CURRENT.includes(n)).map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

/** fetch() yang menyerah setelah `ms` (jaringan "setengah mati" dianggap putus). */
function fetchWithTimeout(request, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(request, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

/** Buang entri tertua bila cache melebihi batas. */
async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

function offlineCopy(response) {
  const headers = new Headers(response.headers);
  headers.set("x-udaraku-offline", "1");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function handleNavigation(request) {
  try {
    const response = await fetchWithTimeout(request, NETWORK_TIMEOUT_MS);
    if (response.ok && response.type === "basic") {
      const copy = response.clone();
      caches.open(PAGES_CACHE).then((c) => c.put(request, copy)).then(() => trim(PAGES_CACHE, MAX_PAGE_ENTRIES));
    }
    return response;
  } catch {
    const cached = await caches.match(request, { cacheName: PAGES_CACHE });
    if (cached) return cached;
    const fallback = await caches.match(OFFLINE_URL, { cacheName: STATIC_CACHE });
    return fallback || new Response("Offline", { status: 503, headers: { "content-type": "text/plain" } });
  }
}

async function handleApi(request) {
  try {
    const response = await fetchWithTimeout(request, NETWORK_TIMEOUT_MS);
    const noStore = (response.headers.get("cache-control") || "").includes("no-store");
    if (response.ok && !noStore) {
      const copy = response.clone();
      caches.open(API_CACHE).then((c) => c.put(request, copy)).then(() => trim(API_CACHE, MAX_API_ENTRIES));
    }
    return response;
  } catch {
    const cached = await caches.match(request, { cacheName: API_CACHE });
    if (cached) return offlineCopy(cached);
    // Tidak ada salinan: tandai "miss" supaya halaman bisa memakai data tersimpan di perangkat.
    return new Response(JSON.stringify({ error: "Offline" }), {
      status: 503,
      headers: { "content-type": "application/json", "cache-control": "no-store", "x-udaraku-offline": "miss" },
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { cacheName: STATIC_CACHE });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    const copy = response.clone();
    caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok && response.type === "basic") cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
  } else if (API_PATHS.includes(url.pathname)) {
    event.respondWith(handleApi(request));
  } else if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
  } else if (
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

/* ---------- Notifikasi (Web Push dasar) ---------- */

/** Pesan dari server push (bila kelak dipasang): {title, body, tag, url}. */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(String(data.title || "UdaraKu"), {
      body: String(data.body || ""),
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: String(data.tag || "udaraku-udara"),
      lang: "id",
      data: { url: typeof data.url === "string" ? data.url : "/cek-udara" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Hanya jalur di situs ini yang boleh dibuka.
  const raw = (event.notification.data && event.notification.data.url) || "/cek-udara";
  const target = new URL(raw, self.location.origin);
  const path = target.origin === self.location.origin ? target.pathname + target.search : "/cek-udara";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (new URL(client.url).origin === self.location.origin && "focus" in client) {
          if ("navigate" in client) client.navigate(path).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(path);
    }),
  );
});