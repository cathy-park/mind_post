import { useCallback, useEffect, useState } from 'react';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

interface UsePushReturn {
  permission: PushPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: (reminderTime: string) => Promise<boolean>;
  unsubscribe: () => Promise<void>;
  updateReminderTime: (reminderTime: string) => Promise<void>;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

const SW_PATH = import.meta.env.BASE_URL + 'sw.js';

export function usePush(): UsePushReturn {
  const [permission, setPermission] = useState<PushPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as PushPermission);
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        setIsSubscribed(!!sub);
      });
    }).catch(() => {});
  }, []);

  const subscribe = useCallback(async (reminderTime: string): Promise<boolean> => {
    if (!VAPID_PUBLIC_KEY) {
      console.warn('VITE_VAPID_PUBLIC_KEY is not set');
      return false;
    }
    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== 'granted') return false;

      const reg = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...subJson, reminderTime }),
      });
      if (!res.ok) throw new Error('서버 등록 실패');

      localStorage.setItem('push-endpoint', subJson.endpoint);
      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.warn('Push subscribe failed', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
        localStorage.removeItem('push-endpoint');
      }
      setIsSubscribed(false);
    } catch (err) {
      console.warn('Push unsubscribe failed', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateReminderTime = useCallback(async (reminderTime: string) => {
    const endpoint = localStorage.getItem('push-endpoint');
    if (!endpoint) return;
    try {
      await fetch('/api/push/subscribe', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, reminderTime }),
      });
    } catch (err) {
      console.warn('Push update time failed', err);
    }
  }, []);

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe, updateReminderTime };
}
