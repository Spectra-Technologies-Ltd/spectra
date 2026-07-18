'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, Sun, Moon, Users, Building2, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  label: string;
  subtitle: string;
  type: 'guard' | 'client' | 'site' | 'incident';
  url: string;
}

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const [darkMode, setDarkMode] = React.useState(true);
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

  // Close notif on click outside
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

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [guards, clients, sites] = await Promise.all([
          api.get('/guards', { params: { search: query, limit: 3 } }).catch(() => ({ data: { data: [] } })),
          api.get('/clients', { params: { search: query, limit: 3 } }).catch(() => ({ data: { data: [] } })),
          api.get('/sites', { params: { search: query, limit: 3 } }).catch(() => ({ data: { data: [] } })),
        ]);

        const items: SearchResult[] = [
          ...guards.data.data.map((g: any) => ({
            id: g.id, label: g.fullName, subtitle: `Guard · ${g.status}`,
            type: 'guard' as const, url: `/guards/${g.id}`,
          })),
          ...clients.data.data.map((c: any) => ({
            id: c.id, label: c.companyName, subtitle: `Client · ${c.estateName}`,
            type: 'client' as const, url: `/clients`,
          })),
          ...sites.data.data.map((s: any) => ({
            id: s.id, label: s.name, subtitle: `Site · ${s.address?.substring(0, 40)}`,
            type: 'site' as const, url: `/sites`,
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

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcuts
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
      case 'guard': return <Users className="h-4 w-4" />;
      case 'client': return <Building2 className="h-4 w-4" />;
      case 'site': return <MapPin className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guard': return 'text-blue-400';
      case 'client': return 'text-emerald-400';
      case 'site': return 'text-amber-400';
      default: return 'text-rose-400';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl px-6">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md" ref={containerRef}>
        <div className="relative flex items-center w-full gap-2 rounded-lg bg-secondary/50 border border-border px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/30 transition-all">
          {loading ? (
            <Loader2 className="h-4 w-4 text-muted-foreground shrink-0 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder="Search guards, sites, incidents..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { if (results.length > 0) setOpen(true); }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>

          {/* Results dropdown */}
          {open && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 rounded-lg border border-border bg-card shadow-xl z-50 py-1 max-h-[320px] overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => { router.push(r.url); setOpen(false); setQuery(''); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                    i === selectedIndex ? 'bg-secondary' : 'hover:bg-secondary/50'
                  )}
                >
                  <span className={cn('shrink-0', getTypeColor(r.type))}>{getIcon(r.type)}</span>
                  <div className="text-left min-w-0">
                    <p className="text-foreground truncate">{r.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                  </div>
                  <span className="ml-auto text-[10px] uppercase text-muted-foreground shrink-0">
                    {r.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          >
            <Bell className="h-4 w-4" />
            {notifData?.count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                {notifData.count > 9 ? '9+' : notifData.count}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-card shadow-xl z-50 py-1 max-h-[360px] overflow-y-auto">
              <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">Notifications</p>
                {notifData?.count > 0 && (
                  <span className="text-[10px] text-muted-foreground">{notifData.count} unread</span>
                )}
              </div>
              {recentNotifs?.length > 0 ? (
                recentNotifs.slice(0, 10).map((n: any) => (
                  <button
                    key={n.id}
                    onClick={() => { router.push('/notifications'); setNotifOpen(false); }}
                    className={cn(
                      'w-full text-left px-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors',
                      n.status === 'UNREAD' && 'bg-primary/5'
                    )}
                  >
                    <p className={cn('text-sm leading-snug', n.status === 'UNREAD' ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
                  onClick={() => { router.push('/notifications'); setNotifOpen(false); }}
                  className="w-full px-3 py-2 text-xs text-primary hover:bg-secondary/50 transition-colors font-medium"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="ml-2 flex items-center gap-2 border-l border-border pl-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {user.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
