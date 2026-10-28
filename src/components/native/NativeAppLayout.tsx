import React from 'react';
import { Archive, Gauge, LogOut, Mic2, Settings } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogoMark } from '../Logo';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const TABS = [
  { label: 'Dashboard', path: '/dashboard', icon: Gauge },
  { label: 'New pitch', path: '/setup', icon: Mic2 },
  { label: 'Pitches', path: '/archive', icon: Archive },
  { label: 'Settings', path: '/settings', icon: Settings },
] as const;

const TITLES: Array<[RegExp, string]> = [
  [/^\/dashboard/, 'Dashboard'],
  [/^\/setup/, 'New pitch'],
  [/^\/archive/, 'My pitches'],
  [/^\/replay/, 'Pitch replay'],
  [/^\/report/, 'Pitch report'],
];

function routeTitle(pathname: string): string {
  return TITLES.find(([pattern]) => pattern.test(pathname))?.[1] ?? 'PitchNest';
}

function isActive(pathname: string, path: string): boolean {
  if (path === '/archive') return /^\/(archive|replay|report)/.test(pathname);
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** Focused Android shell for the private founder workflow. */
export default function NativeAppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const signOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-[100dvh] bg-bg-main text-slate-900 dark:bg-[#09090B] dark:text-zinc-100">
      <header className="native-top-safe sticky top-0 z-30 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/92">
        <div className="flex h-15 items-center gap-3 px-4">
          <LogoMark size="xs" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[17px] font-semibold">{routeTitle(location.pathname)}</p>
            <p className="truncate text-[11px] text-slate-400 dark:text-zinc-500">{user?.name ?? 'Founder'}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 active:bg-slate-100 dark:text-zinc-500 dark:active:bg-zinc-900"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="min-w-0 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6">
        <React.Suspense
          fallback={
            <div className="flex min-h-[55vh] items-center justify-center" role="status" aria-label="Loading">
              <span className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600 dark:border-zinc-800 dark:border-t-indigo-400" />
            </div>
          }
        >
          <Outlet />
        </React.Suspense>
      </main>

      <nav className="native-bottom-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200/80 bg-white/95 px-2 pt-1.5 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/95" aria-label="App navigation">
        {TABS.map((tab) => {
          const active = isActive(location.pathname, tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              aria-current={active ? 'page' : undefined}
              onClick={() => void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined)}
              className={cn(
                'relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-semibold active:bg-slate-100 dark:active:bg-zinc-900',
                active ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-400 dark:text-zinc-500',
              )}
            >
              {active ? <span className="absolute top-0 h-1 w-8 rounded-full bg-accent-strong" /> : null}
              <tab.icon size={21} strokeWidth={active ? 2.35 : 2} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
