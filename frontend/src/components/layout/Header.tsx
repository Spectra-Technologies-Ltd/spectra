'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  Sun,
  Moon,
  Users,
  Building2,
  MapPin,
  AlertTriangle,
  Loader2,
  Menu,
  CircleHelp,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useSidebar } from './SidebarContext';

interface SearchResult {
  id: string;
  label: string;
  subtitle: string;
  type: 'guard' | 'client' | 'site' | 'incident';
  url: string;
}

interface GuardSearchItem {
  id: string;
  fullName: string;
  status?: string;
}

interface ClientSearchItem {
  id: string;
  companyName: string;
  estateName?: string;
}

interface SiteSearchItem {
  id: string;
  name: string;
  address?: string;
}

interface ApiList<T> {
  data: T[];
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function Header() {
  const { user } = useAuth();
  const { openMobile } = useSidebar();
  const router = useRouter();
  const [darkMode, setDarkMode] = React.useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setDarkMode(false);
    } else {
      html.classList.add('dark');
      setDarkMode(true);
    }
  };

  useEffect(() => {
    if (query.length < 2) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [guards, clients, sites] = await Promise.all([
          api.get<ApiList<GuardSearchItem>>('/guards', { params: { search: query, limit: 3 } }).catch(() => ({ data: { data: [] } })),
          api.get<ApiList<ClientSearchItem>>('/clients', { params: { search: query, limit: 3 } }).catch(() => ({ data: { data: [] } })),
          api.get<ApiList<SiteSearchItem>>('/sites', { params: { search: query, limit: 3 } }).catch(() => ({ data: { data: [] } })),
        ]);

        const items: SearchResult[] = [
          ...guards.data.data.map((g) => ({
            id: g.id,
            label: g.fullName,
            subtitle: `Guard - ${g.status ?? 'Active'}`,
            type: 'guard' as const,
            url: `/guards/${g.id}`,
          })),
          ...clients.data.data.map((c) => ({
            id: c.id,
            label: c.companyName,
            subtitle: `Client - ${c.estateName ?? 'Portfolio'}`,
            type: 'client' as const,
            url: '/clients',
          })),
          ...sites.data.data.map((s) => ({
            id: s.id,
            label: s.name,
            subtitle: `Site - ${s.address?.substring(0, 40) ?? 'Assigned location'}`,
            type: 'site' as const,
            url: '/sites',
          })),
        ];

        setResults(items.slice(0, 8));
        setSelectedIndex(0);
        setOpen(items.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      router.push(results[selectedIndex].url);
      setOpen(false);
      setQuery('');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'guard':
        return <Users className="h-4 w-4" />;
      case 'client':
        return <Building2 className="h-4 w-4" />;
      case 'site':
        return <MapPin className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guard':
        return 'text-blue-500';
      case 'client':
        return 'text-emerald-500';
      case 'site':
        return 'text-amber-500';
      default:
        return 'text-red-500';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-white/85 px-3 shadow-sm shadow-slate-900/5 backdrop-blur-xl sm:px-5 lg:px-6">
      <button
        onClick={openMobile}
        aria-label="Open menu"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-3" ref={containerRef}>
        <div className="hidden min-w-0 sm:block">
          <h1 className="truncate text-lg font-black tracking-tight text-slate-950 md:text-xl">Dashboard</h1>
          <p className="truncate text-[11px] font-medium text-slate-500">Overview / Dashboard</p>
        </div>

        <div className="relative ml-auto flex w-full max-w-[250px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-all focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10 sm:max-w-xs md:max-w-md">
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder="Search Spectra..."
            value={query}
            onChange={(e) => {
              const nextQuery = e.target.value;
              setQuery(nextQuery);
              if (nextQuery.length < 2) {
                setResults([]);
                setOpen(false);
              } else {
                setOpen(true);
              }
            }}
            onFocus={() => {
              if (results.length > 0) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:inline-flex">
            Ctrl K
          </kbd>

          {open && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[320px] overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-xl shadow-slate-900/10">
              {results.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => {
                    router.push(r.url);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors',
                    i === selectedIndex ? 'bg-slate-100' : 'hover:bg-slate-50',
                  )}
                >
                  <span className={cn('shrink-0', getTypeColor(r.type))}>{getIcon(r.type)}</span>
                  <div className="min-w-0 text-left">
                    <p className="truncate text-slate-950">{r.label}</p>
                    <p className="truncate text-xs text-slate-500">{r.subtitle}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-[10px] uppercase text-slate-400">
                    {r.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 sm:flex"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          aria-label="Help"
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 sm:flex"
        >
          <CircleHelp className="h-4 w-4" />
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
          >
            <Bell className="h-4 w-4" />
            {notifData?.count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {notifData.count > 9 ? '9+' : notifData.count}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="fixed left-3 right-3 top-16 z-50 mt-0 max-h-[360px] w-auto overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-xl shadow-slate-900/10 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <p className="text-xs font-semibold text-slate-950">Notifications</p>
                {notifData?.count > 0 && (
                  <span className="text-[10px] text-slate-500">{notifData.count} unread</span>
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
                      'w-full border-b border-border/70 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-slate-50',
                      n.status === 'UNREAD' && 'bg-blue-50',
                    )}
                  >
                    <p className={cn('text-sm leading-snug', n.status === 'UNREAD' ? 'font-semibold text-slate-950' : 'text-slate-600')}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{n.message}</p>
                    <p className="mt-1 text-[10px] text-slate-400">
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
                <div className="px-3 py-6 text-center text-sm text-slate-500">
                  No notifications yet
                </div>
              )}
              <div className="border-t border-border">
                <button
                  onClick={() => {
                    router.push('/notifications');
                    setNotifOpen(false);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-blue-600 transition-colors hover:bg-slate-50"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="ml-1 flex items-center gap-2 border-l border-border pl-2 sm:ml-2 sm:pl-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-200 text-xs font-bold text-slate-700 shadow-sm">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-slate-950">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                {user.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
