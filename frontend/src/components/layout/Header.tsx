'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, Search, Menu, PanelLeftClose, PanelLeft, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useSidebar } from './SidebarContext';
import { CommandPalette } from '@/components/dashboard/command-palette';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
}

const DETAIL_META: { pattern: RegExp; title: string; crumb: string }[] = [
  { pattern: /^\/guards\/add$/, title: 'Add Guard', crumb: 'Operations / Guards / Add' },
  { pattern: /^\/guards\/[^/]+$/, title: 'Guard Profile', crumb: 'Operations / Guards / Profile' },
  { pattern: /^\/clients\/add$/, title: 'Add Client', crumb: 'Management / Clients / Add' },
  { pattern: /^\/clients\/[^/]+$/, title: 'Client Profile', crumb: 'Management / Clients / Profile' },
  { pattern: /^\/sites\/add$/, title: 'Add Site', crumb: 'Management / Sites / Add' },
  { pattern: /^\/sites\/[^/]+$/, title: 'Site Profile', crumb: 'Management / Sites / Profile' },
  { pattern: /^\/incidents\/add$/, title: 'Report Incident', crumb: 'Security / Incidents / Add' },
  { pattern: /^\/incidents\/[^/]+$/, title: 'Incident Detail', crumb: 'Security / Incidents / Detail' },
];

const ROUTE_META: { prefix: string; title: string; crumb: string }[] = [
  { prefix: '/attendance', title: 'Attendance', crumb: 'Operations / Attendance' },
  { prefix: '/patrols', title: 'Patrols', crumb: 'Operations / Patrols' },
  { prefix: '/guards', title: 'Personnel', crumb: 'Operations / Personnel' },
  { prefix: '/clients', title: 'Clients', crumb: 'Management / Clients' },
  { prefix: '/sites', title: 'Sites', crumb: 'Management / Sites' },
  { prefix: '/incidents', title: 'Incidents', crumb: 'Security / Incidents' },
  { prefix: '/reports', title: 'Reports', crumb: 'Security / Reports' },
  { prefix: '/analytics', title: 'Analytics', crumb: 'Insights / Analytics' },
  { prefix: '/notifications', title: 'Notifications', crumb: 'System / Notifications' },
  { prefix: '/account', title: 'Account', crumb: 'System / Account' },
  { prefix: '/security', title: 'Security Center', crumb: 'System / Security Center' },
  { prefix: '/changelog', title: "What's New", crumb: 'System / Changelog' },
  { prefix: '/map', title: 'Live Map', crumb: 'Command / Live Map' },
  { prefix: '/mobile', title: 'Mobile', crumb: 'Field / Mobile' },
];

function getPageMeta(pathname: string) {
  if (pathname === '/') return { title: 'Ops Overview', crumb: 'Command / Ops Overview' };
  for (const detail of DETAIL_META) {
    if (detail.pattern.test(pathname)) return { title: detail.title, crumb: detail.crumb };
  }
  for (const route of ROUTE_META) {
    if (pathname.startsWith(route.prefix)) return { title: route.title, crumb: route.crumb };
  }
  return { title: 'Ops Overview', crumb: 'Command / Ops Overview' };
}

export default function Header() {
  const { user } = useAuth();
  const { openMobile, collapsed, toggleCollapsed } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const { title, crumb } = getPageMeta(pathname || '');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<string>('');
  const [darkMode, setDarkMode] = React.useState(() =>
    typeof window !== 'undefined' && document.documentElement.classList.contains('dark'),
  );

  // Live UTC clock
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'UTC',
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const { data: notifData } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const { data: recentNotifs } = useQuery({
    queryKey: ['recent-notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    },
    refetchInterval: 30000,
    enabled: notifOpen,
  });

  const toggleTheme = () => {
    const html = document.documentElement;
    const nextDark = !html.classList.contains('dark');
    html.classList.toggle('dark', nextDark);
    setDarkMode(nextDark);
    try {
      localStorage.setItem('bastion-theme', nextDark ? 'dark' : 'light');
    } catch {
      // storage unavailable — the in-memory toggle still applies
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:px-5 lg:px-6">
        {/* Desktop: toggle sidebar collapse */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          className="icon-btn hidden h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground lg:flex"
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        {/* Mobile: open drawer */}
        <button
          onClick={openMobile}
          aria-label="Open menu"
          className="icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">{title}</h1>
          <p className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {crumb}
          </p>
        </div>

        <div className="ml-auto hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 md:flex">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          <span className="font-mono text-xs text-muted-foreground">All systems operational</span>
        </div>

        <div className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 lg:flex">
          <span className="font-mono text-xs tabular-nums text-foreground">{now}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">UTC</span>
        </div>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="icon-btn flex size-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
        >
          {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="hidden items-center gap-2 rounded-md border border-border bg-card py-2 pl-3 pr-2 text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground md:flex md:w-44 lg:w-56"
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="key">⌘K</kbd>
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Notifications"
            className="relative flex size-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          >
            <Bell className="size-4" />
            {notifData?.count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                {notifData.count > 9 ? '9+' : notifData.count}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="fixed left-3 right-3 top-16 z-50 mt-0 max-h-[360px] w-auto overflow-y-auto rounded-lg border border-border bg-popover py-1 shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <p className="text-xs font-semibold text-foreground">Notifications</p>
                {notifData?.count > 0 && (
                  <span className="text-[10px] text-muted-foreground">{notifData.count} unread</span>
                )}
              </div>
              {recentNotifs?.length > 0 ? (
                recentNotifs.slice(0, 10).map((n: NotificationItem) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      router.push('/notifications');
                      setNotifOpen(false);
                    }}
                    className={cn(
                      'w-full border-b border-border/70 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-accent/50',
                      n.status === 'UNREAD' && 'bg-primary/5',
                    )}
                  >
                    <p className={cn('text-sm leading-snug', n.status === 'UNREAD' ? 'font-semibold text-foreground' : 'text-foreground')}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </button>
                ))
              ) : (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              )}
              <div className="border-t border-border">
                <button
                  onClick={() => {
                    router.push('/notifications');
                    setNotifOpen(false);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent/50 hover:text-primary"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="ml-1 hidden items-center gap-2 border-l border-border pl-3 sm:flex">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-semibold text-primary">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {user.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
