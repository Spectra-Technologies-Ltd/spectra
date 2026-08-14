'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  Users,
  Building2,
  MapPin,
  ClipboardCheck,
  AlertTriangle,
  Route,
  BarChart3,
  FileText,
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
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/', icon: LayoutDashboard }],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Attendance', href: '/attendance', icon: ClipboardCheck },
      { label: 'Patrols', href: '/patrols', icon: Route },
      { label: 'Guards', href: '/guards', icon: Users },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Clients', href: '/clients', icon: Building2 },
      { label: 'Sites', href: '/sites', icon: MapPin },
    ],
  },
  {
    label: 'Security',
    items: [
      { label: 'Incidents', href: '/incidents', icon: AlertTriangle },
      { label: 'Reports', href: '/reports', icon: FileText },
    ],
  },
  {
    label: 'Insights',
    items: [{ label: 'Analytics', href: '/analytics', icon: BarChart3 }],
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

  return (
    <>
      {mobileOpen && (
        <div
          onClick={closeMobile}
          aria-hidden="true"
          className="fixed inset-0 z-40 animate-fade-in bg-zinc-950/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen supports-[height:100dvh]:h-dvh flex-col bg-gradient-to-b from-[#101014] via-[#0a0a0c] to-[#060607] text-zinc-200 shadow-2xl shadow-zinc-950/40 transition-transform duration-300 ease-in-out',
          'lg:relative lg:z-auto lg:tranzinc-x-0 lg:transition-[width] lg:duration-300 lg:ease-in-out lg:border-r lg:border-white/[0.07]',
          mobileOpen ? 'tranzinc-x-0' : '-tranzinc-x-full',
          collapsed ? 'w-[260px] lg:w-[76px]' : 'w-[260px]',
        )}
      >
        {/* Brand */}
        <div className="flex h-[68px] shrink-0 items-center gap-3 border-b border-white/[0.07] px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-black shadow-lg shadow-black/40 ring-1 ring-white/20">
            <Shield className="h-5 w-5" />
          </div>
          <div className={cn('min-w-0 overflow-hidden whitespace-nowrap', collapsed && 'lg:hidden')}>
            <p className="text-[15px] font-black leading-tight tracking-[0.18em] text-white">
              BASTION
            </p>
            <p className="truncate text-[10px] font-medium tracking-[0.14em] text-zinc-400">
              Security Platform
            </p>
          </div>

          <button
            onClick={closeMobile}
            aria-label="Close menu"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Floating expand/collapse toggle (desktop) */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3.5 top-1/2 z-20 hidden h-7 w-7 -tranzinc-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#18181b] text-zinc-300 shadow-lg shadow-black/40 transition-all hover:scale-110 hover:border-cyan-400/50 hover:text-cyan-300 hover:shadow-cyan-950/40 lg:flex"
        >
          {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <p
                className={cn(
                  'mb-2 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500',
                  collapsed && 'lg:justify-center lg:px-0',
                )}
              >
                <span
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2',
                    collapsed && 'lg:hidden',
                  )}
                >
                  {section.label}
                  <span className="h-px flex-1 bg-white/[0.06]" />
                </span>
                <span
                  className={cn('hidden h-px w-8 shrink-0 bg-white/10', collapsed && 'lg:block')}
                />
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
                  const badge: string | null =
                    item.href === '/incidents' && openIncidents && openIncidents > 0
                      ? String(openIncidents)
                      : null;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-lg py-2.5 pl-3 pr-3 text-[13px] font-semibold transition-all duration-150',
                        collapsed && 'lg:justify-center lg:px-0',
                        isActive
                          ? 'bg-white text-black shadow-lg shadow-black/30'
                          : 'text-zinc-400 hover:bg-white/[0.07] hover:text-white',
                      )}
                    >
                      {/* Active accent bar */}
                      <span
                        className={cn(
                          'absolute left-0 top-1/2 h-5 w-[3px] -tranzinc-y-1/2 rounded-r-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)] transition-opacity duration-150',
                          isActive ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <item.icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0 transition-colors',
                          isActive ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-100',
                        )}
                      />
                      <span
                        className={cn(
                          'min-w-0 flex-1 overflow-hidden whitespace-nowrap text-left transition-[max-width,opacity] duration-200',
                          collapsed && 'lg:max-w-0 lg:opacity-0',
                        )}
                      >
                        {item.label}
                      </span>
                      {badge && (
                        <span
                          className={cn(
                            'ml-auto shrink-0 rounded-full bg-rose-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white ring-1 ring-white/20',
                            collapsed && 'lg:hidden',
                          )}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="space-y-1 border-t border-white/[0.07] p-3">
          {user && (
            <div className="flex items-center gap-3 rounded-lg px-2 py-2">
              <div className="relative shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-black shadow-md shadow-black/40">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0a0a0c]" />
              </div>
              <div className={cn('min-w-0 overflow-hidden whitespace-nowrap', collapsed && 'lg:hidden')}>
                <p className="truncate text-xs font-semibold text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  {user.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            title={collapsed ? 'Sign Out' : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-zinc-400 transition-all hover:bg-rose-500/10 hover:text-rose-300',
              collapsed && 'lg:justify-center lg:px-0',
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span
              className={cn(
                'min-w-0 flex-1 overflow-hidden whitespace-nowrap text-left transition-[max-width,opacity] duration-200',
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
