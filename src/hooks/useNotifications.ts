"use client";

import { useCallback, useEffect, useState } from "react";

type NotificationState = {
  supported: boolean;
  permission: NotificationPermission | null;
  enabled: boolean;
  message: string;
  enable: () => Promise<void>;
  disable: () => void;
};

/**
 * Hook untuk mengelola Notification API browser.
 * Cek dukungan, izin, dan status notifikasi push.
 */
export function useNotifications(): NotificationState {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const isSupported = typeof window !== "undefined" && "Notification" in window;
    setSupported(isSupported);

    if (isSupported) {
      setPermission(Notification.permission);
      const stored = localStorage.getItem("notifications-enabled") === "true";
      setEnabled(stored && Notification.permission === "granted");
    }
  }, []);

  const enable = useCallback(async () => {
    if (!supported) return;

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === "granted") {
        setEnabled(true);
        localStorage.setItem("notifications-enabled", "true");
        setMessage("Notifikasi diaktifkan.");
      } else if (perm === "denied") {
        setMessage("Notifikasi ditolak. Ubah di pengaturan peramban jika ingin mengaktifkannya.");
      }
    } catch (err) {
      setMessage("Gagal mengaktifkan notifikasi.");
      console.error("Notification request error:", err);
    }
  }, [supported]);

  const disable = useCallback(() => {
    setEnabled(false);
    localStorage.setItem("notifications-enabled", "false");
    setMessage("Notifikasi dimatikan.");
  }, []);

  return { supported, permission, enabled, message, enable, disable };
}

/**
 * Tampilkan notifikasi lokal di browser.
 * Hanya berhasil jika izin sudah diberikan.
 */
export async function showLocalNotification({
  title,
  body,
  tag,
}: {
  title: string;
  body: string;
  tag?: string;
}): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission !== "granted") {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification(title, {
      body,
      tag,
      badge: "/icons/badge-192.png",
      icon: "/icons/icon-192.png",
    });
    return true;
  } catch (err) {
    console.error("Show notification error:", err);
    return false;
  }
}
