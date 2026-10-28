import React, { useEffect, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { SystemBars, SystemBarsStyle, type PluginListenerHandle } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { WifiOff } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isNativeApp, isNativeRoute } from '../../lib/native';

const ROOT_ROUTES = new Set(['/dashboard', '/login']);

function nativePathFromUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (!['pitchnest.app', 'www.pitchnest.app', 'localhost'].includes(url.hostname)) return null;
    const path = `${url.pathname}${url.search}${url.hash}`;
    return isNativeRoute(url.pathname) ? path : '/dashboard';
  } catch {
    return null;
  }
}

/** Owns behavior that exists only in the installed mobile shell. */
export function NativeRuntime({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    if (!isNativeApp()) return;

    document.documentElement.classList.add('native-app');
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    const syncSystemBars = () => {
      const dark = document.documentElement.classList.contains('dark');
      void SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => undefined);
    };
    syncSystemBars();
    const themeObserver = new MutationObserver(syncSystemBars);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    let disposed = false;
    const handles: PluginListenerHandle[] = [];
    const addListeners = async () => {
      const registered = [
        await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          if (ROOT_ROUTES.has(window.location.pathname) || !canGoBack) {
            void CapacitorApp.minimizeApp();
          } else {
            window.history.back();
          }
        }),
        await CapacitorApp.addListener('appUrlOpen', ({ url }) => {
          const path = nativePathFromUrl(url);
          if (path) navigate(path);
        }),
        await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
          window.dispatchEvent(new CustomEvent('pitchnest:native-app-state', { detail: { isActive } }));
          if (!isActive) {
            document.querySelectorAll('audio, video').forEach((media) => {
              if (media instanceof HTMLMediaElement) media.pause();
            });
          }
        }),
      ];

      if (disposed) {
        registered.forEach((handle) => void handle.remove());
        return;
      }
      handles.push(...registered);

      const launch = await CapacitorApp.getLaunchUrl();
      if (!disposed && launch?.url) {
        const path = nativePathFromUrl(launch.url);
        if (path) navigate(path, { replace: true });
      }
    };
    void addListeners().catch((error) => {
      console.error('Could not initialize native app listeners:', error);
    });

    requestAnimationFrame(() => {
      void SplashScreen.hide().catch(() => undefined);
    });

    return () => {
      disposed = true;
      document.documentElement.classList.remove('native-app');
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      themeObserver.disconnect();
      handles.forEach((handle) => void handle.remove());
    };
  }, [navigate]);

  if (!isNativeApp()) return <>{children}</>;

  if (!online) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-bg-main px-8 text-center dark:bg-[#09090B]">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-200/70 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
          <WifiOff size={30} strokeWidth={1.8} />
        </div>
        <h1 className="mt-6 text-2xl text-slate-950 dark:text-white">You’re offline</h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-zinc-400">
          PitchNest needs an internet connection for your AI panel and saved pitches. We’ll reconnect automatically.
        </p>
        <button type="button" onClick={() => setOnline(navigator.onLine)} className="btn-primary mt-7 min-h-12 px-8">
          Try again
        </button>
      </main>
    );
  }

  // Keep the current pathname in the dependency graph so the Android back
  // behavior and screen readers observe route changes in the native shell.
  return <div data-native-path={location.pathname}>{children}</div>;
}
