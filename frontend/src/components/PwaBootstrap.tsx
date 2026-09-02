'use client';

/**
 * PWA bootstrap: registers the service worker, captures the iOS/Android
 * install prompt (shows a banner), and with user permission subscribes the
 * device to web push so incident/SOS/check-in alerts arrive even when the
 * app is closed.
 */
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    deferredPrompt?: any;
  }
}

async function subscribeToPush(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return true;

    const { data } = await api.get('/push/vapid-public-key');
    if (!data?.publicKey) return false;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey) as BufferSource,
    });

    await api.post('/push/subscribe', {
      endpoint: sub.endpoint,
      p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!))),
      auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!))),
    });
    return true;
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PwaBootstrap() {
  const { user } = useAuth();
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {
        if (sessionStorage.getItem('bastion-push-prompted')) return;
        // Ask once per session when the user is logged in
        if (user && 'PushManager' in window && Notification.permission === 'default') {
          sessionStorage.setItem('bastion-push-prompted', '1');
          Notification.requestPermission().then((perm) => {
            if (perm === 'granted') subscribeToPush();
          });
        }
      })
      .catch(() => {
        // SW registration failed (e.g. private browsing) — app still works
      });
  }, [user]);

  // Capture the install prompt to show an install banner
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
      window.deferredPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!installEvt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-border bg-popover p-4 shadow-2xl sm:left-auto">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Install BastionOS</p>
        <p className="text-xs text-muted-foreground">
          Get the command center on your home screen — works offline, receives alerts.
        </p>
      </div>
      <button
        onClick={async () => {
          await installEvt.prompt();
          setInstallEvt(null);
        }}
        className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Install
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground"
      >
        ✕
      </button>
    </div>
  );
}
