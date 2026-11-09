"use client";

import { useCallback, useEffect, useState } from "react";
import { NOTIF_CHANGED_EVENT, loadPrefs, savePrefs } from "@/lib/notify";

const CHANGED_EVENT = NOTIF_CHANGED_EVENT;

/** Tampilkan notifikasi lewat service worker (jalan di Android), atau langsung bila SW belum ada. */
export async function showLocalNotification(opts: { title: string; body: string; tag: string; url?: string }) {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
    const options: NotificationOptions = {
      body: opts.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: opts.tag,
      lang: "id",
      data: { url: opts.url ?? "/cek-udara" },
    };
    const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) await reg.showNotification(opts.title, options);
    else new Notification(opts.title, options);
    return true;
  } catch {
    return false;
  }
}

export type NotifState = {
  /** Peramban mendukung Notification API. */
  supported: boolean;
  permission: NotificationPermission;
  /** Izin diberikan DAN pengguna menyalakannya. */
  enabled: boolean;
  message: string | null;
  /** Meminta izin (bila belum) lalu menyalakan. HARUS dipanggil dari klik pengguna. */
  enable: () => Promise<void>;
  disable: () => void;
};

/**
 * Status notifikasi. Tidak pernah meminta izin sendiri: `enable()` hanya dipanggil
 * dari handler klik tombol "Aktifkan notifikasi".
 */
export function useNotifications(): NotifState {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sync = useCallback(() => {
    const ok = typeof window !== "undefined" && "Notification" in window;
    setSupported(ok);
    if (!ok) return;
    setPermission(Notification.permission);
    setEnabled(Notification.permission === "granted" && loadPrefs().enabled);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(CHANGED_EVENT, sync);
    return () => window.removeEventListener(CHANGED_EVENT, sync);
  }, [sync]);

  const enable = useCallback(async () => {
    setMessage(null);
    if (typeof Notification === "undefined") return;
    let result: NotificationPermission = Notification.permission;
    if (result === "default") {
      try {
        result = await Notification.requestPermission();
      } catch {
        result = "default";
      }
    }
    if (result === "granted") {
      savePrefs({ ...loadPrefs(), enabled: true });
      await showLocalNotification({
        title: "Notifikasi UdaraKu aktif",
        body: "Kamu akan diberi tahu saat PM2.5 melewati batas harian WHO (15 µg/m³) selama UdaraKu terbuka.",
        tag: "udaraku-aktif",
      });
    } else if (result === "denied") {
      setMessage("Izin notifikasi ditolak. Kamu bisa mengubahnya lewat pengaturan situs di peramban.");
    } else {
      setMessage("Izin notifikasi belum diberikan.");
    }
    window.dispatchEvent(new Event(CHANGED_EVENT));
  }, []);

  const disable = useCallback(() => {
    savePrefs({ ...loadPrefs(), enabled: false });
    setMessage(null);
    window.dispatchEvent(new Event(CHANGED_EVENT));
  }, []);

  return { supported, permission, enabled, message, enable, disable };
}