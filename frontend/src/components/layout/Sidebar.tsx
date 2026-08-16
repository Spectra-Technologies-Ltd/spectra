'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  LayoutDashboard,
  Map,
  Users,
  AlertTriangle,
  ClipboardCheck,
  Route,
  MapPin,
  Building2,
  BarChart3,
  FileText,
  Bell,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useSidebar } from './SidebarContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const navSections = [
  {
    label: 'Command',
    items: [
      { label: 'Ops Overview', href: '/', icon: LayoutDashboard },
      { label: 'Live Map', href: '/map', icon: Map },
      { label: 'Personnel', href: '/guards', icon: Users },
      { label: 'Incidents', href: '/incidents', icon: AlertTriangle },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Attendance', href: '/attendance', icon: ClipboardCheck },
      { label: 'Patrols', href: '/patrols', icon: Route },
      { label: 'Sites', href: '/sites', icon: MapPin },
      { label: 'Clients', href: '/clients', icon: Building2 },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
      { label: 'Reports', href: '/reports', icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Settings', href: '/account', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const { collapsed, toggleCollapsed, mobileOpen, closeMobile } = useSidebar();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Live count of open incidents for the sidebar badge
  const { data: openIncidents } = useQuery({
    queryKey: ['sidebar-open-incidents'],
    queryFn: async () => {
      const res = await api.get('/incidents', { params: { status: 'OPEN', limit: 1 } });
      return res.data?.meta?.total ?? 0;
    },
    staleTime: 60000,
    refetchInterval: 120000,
  });

  useEffect(() => {
    closeMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Keyboard shortcut: Ctrl/Cmd + B toggles the sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement | null;
        const typing =
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable);
        if (typing) return;
        e.preventDefault();
        toggleCollapsed();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggleCollapsed]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href);

  return (
    <>
      {mobileOpen && (
        <div
          onClick={closeMobile}
          aria-hidden="true"
          className="fixed inset-0 z-40 animate-fade-in bg-black/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen supports-[height:100dvh]:h-dvh flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl shadow-black/40 transition-transform duration-300 ease-in-out',
          'lg:relative lg:z-auto lg:translate-x-0 lg:transition-[width] lg:duration-300 lg:ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-[260px] lg:w-[76px]' : 'w-[260px]',
        )}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <div className={cn('min-w-0 overflow-hidden whitespace-nowrap leading-tight', collapsed && 'lg:hidden')}>
            <div className="font-mono text-sm font-semibold tracking-wide">
              BASTION<span className="text-primary">OS</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Spectra Technology
            </div>
          </div>

          <button
            onClick={closeMobile}
            aria-label="Close menu"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Floating expand/collapse toggle (desktop) */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3.5 top-1/2 z-20 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-lg shadow-black/40 transition-all hover:scale-110 hover:border-primary/50 hover:text-primary lg:flex"
        >
          {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <p
                className={cn(
                  'mb-2 flex items-center gap-2 px-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground',
                  collapsed && 'lg:justify-center lg:px-0',
                )}
              >
                <span className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
                  {section.label}
                </span>
                <span className={cn('h-px w-8 bg-sidebar-border', collapsed ? 'lg:hidden' : 'flex-1')} />
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const badge: string | null =
                    item.href === '/incidents' && openIncidents && openIncidents > 0
                      ? String(openIncidents)
                      : null;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
                        collapsed && 'lg:justify-center lg:px-0',
                        active
                          ? 'bg-sidebar-accent text-sidebar-foreground'
                          : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0 transition-colors',
                          active ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground',
                        )}
                      />
                      <span
                        className={cn(
                          'min-w-0 flex-1 overflow-hidden whitespace-nowrap text-left',
                          collapsed && 'lg:max-w-0 lg:opacity-0',
                        )}
                      >
                        {item.label}
                      </span>
                      {badge && (
                        <span
                          className={cn(
                            'ml-auto shrink-0 rounded-full bg-destructive/90 px-1.5 py-0.5 text-[10px] font-bold text-white ring-1 ring-white/20',
                            collapsed && 'lg:hidden',
                          )}
                        >
                          {badge}
                        </span>
                      )}
                      {active && (
                        <span
                          className={cn(
                            'h-4 w-1 shrink-0 rounded-full bg-primary',
                            collapsed && 'lg:hidden',
                          )}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="space-y-1 border-t border-sidebar-border p-3">
          {user && (
            <Link
              href="/account"
              title={collapsed ? 'My Profile' : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-md bg-sidebar-accent/50 px-2 py-2 transition-colors hover:bg-sidebar-accent',
                collapsed && 'lg:justify-center lg:px-0',
              )}
            >
              <div className="relative shrink-0">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 font-mono text-xs font-semibold text-primary transition-transform group-hover:scale-105">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-success ring-2 ring-sidebar" />
              </div>
              <div className={cn('min-w-0 overflow-hidden whitespace-nowrap', collapsed && 'lg:hidden')}>
                <p className="truncate text-xs font-medium text-sidebar-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                  {user.role?.replace('_', ' ')}
                </p>
              </div>
            </Link>
          )}

          <button
            onClick={logout}
            title={collapsed ? 'Sign Out' : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive',
              collapsed && 'lg:justify-center lg:px-0',
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span
              className={cn(
                'min-w-0 flex-1 overflow-hidden whitespace-nowrap text-left',
                collapsed && 'lg:max-w-0 lg:opacity-0',
              )}
            >
              Sign Out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
