import { API_BASE_URL } from "./api/config";
import { ADMIN_BACKEND_ACCESS_TOKEN_KEY } from "./api/adminApi";

export const VAPID_PUBLIC_KEY =
  "BI1TpVyBR7Zw7Ikf3zrOYGVHi-qhCgxcLDRoYk1oi3LpejIdKqUj66zySYNRZg6naNAtVWdkR78GOmbPYw09rio";

const DEVICE_ID_KEY = "admin_webpush_device_id";

export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export async function registerWebPush(token: string): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (!token) return;
  if (Notification.permission === "denied") return;

  try {
    if (Notification.permission === "default") {
      const result = await Notification.requestPermission();
      if (result !== "granted") return;
    }

    let registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration) {
      registration = await navigator.serviceWorker.register("/sw.js");
    }

    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    let subscription: PushSubscription | null = null;

    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    } catch (err: unknown) {
      if (
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "InvalidStateError")
      ) {
        return;
      }
      throw err;
    }

    if (!subscription) return;

    const deviceId = getOrCreateDeviceId();

    await fetch(`${API_BASE_URL}/notifications/devices`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        token: JSON.stringify(subscription),
        platform: "WEB",
        provider: "WEB",
        deviceId,
      }),
    });
  } catch {
    // never throw — resolve silently
  }
}
