import { Capacitor } from '@capacitor/core';

const configuredPublicWebOrigin = import.meta.env.VITE_PUBLIC_SITE_URL?.trim();

/** Canonical web origin used for links shared outside the installed app. */
export const PUBLIC_WEB_ORIGIN = (configuredPublicWebOrigin || 'https://www.pitchnest.app').replace(/\/$/, '');

/** True only inside the installed Capacitor shell, never for the PWA. */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function isAndroidApp(): boolean {
  return Capacitor.getPlatform() === 'android';
}

/** Routes intentionally included in the focused mobile product. */
const NATIVE_PATHS = [
  '/dashboard',
  '/setup',
  '/room',
  '/report',
  '/replay',
  '/archive',
  '/settings',
  '/onboarding',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify',
  '/privacy',
  '/terms',
  '/refunds',
  '/support',
  '/delete-account',
  '/share/',
] as const;

export function isNativeRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return NATIVE_PATHS.some((path) =>
    path.endsWith('/') ? pathname.startsWith(path) : pathname === path || pathname.startsWith(`${path}/`),
  );
}
