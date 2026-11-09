"use client";

import { useEffect } from "react";

/**
 * Mendaftarkan service worker (/sw.js). Hanya di produksi: saat `next dev`, service worker
 * membuat berkas lama tersaji dan membingungkan. Gagal mendaftar tidak mengganggu aplikasi.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* tanpa service worker, aplikasi tetap jalan seperti biasa */
      });
    };
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);
  return null;
}