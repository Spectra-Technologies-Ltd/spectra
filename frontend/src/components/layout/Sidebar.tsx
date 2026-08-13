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
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useSidebar } from './SidebarContext';

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
      { label: 'Incidents', href: '/incidents', icon: AlertTriangle, badge: '5' },
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

  return (
    <>
      {mobileOpen && (
        <div
          onClick={closeMobile}
          aria-hidden="true"
          className="fixed inset-0 z-40 animate-in fade-in bg-slate-950/55 backdrop-blur-[2px] duration-200 lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen flex-col bg-[#07152b] text-slate-200 shadow-2xl shadow-slate-950/20 transition-transform duration-300 ease-in-out',
          'lg:static lg:z-auto lg:translate-x-0 lg:transition-[width] lg:duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-[260px] lg:w-[78px]' : 'w-[260px]',
        )}
      >
        <div className="flex h-18 shrink-0 items-center justify-between border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-400/40 bg-blue-500/15 text-blue-300">
              <Shield className="h-5 w-5" />
            </div>
            <div className={cn('min-w-0', collapsed && 'lg:hidden')}>
              <p className="whitespace-nowrap text-base font-black leading-tight tracking-[0.16em] text-white">
                SPECTRA
              </p>
              <p className="truncate text-[10px] font-medium tracking-[0.14em] text-slate-400">
                Security Platform
              </p>
            </div>
          </div>
          <button
            onClick={closeMobile}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {navSections.map((section) => (
            <div key={section.label}>
              <p
                className={cn(
                  'mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500',
                  collapsed && 'lg:px-0 lg:text-center',
                )}
              >
                {collapsed ? '...' : section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150',
                        isActive
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-950/30'
                          : 'text-slate-300 hover:bg-white/8 hover:text-white',
                      )}
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      <span className={cn('truncate', collapsed && 'lg:hidden')}>
                        {item.label}
                      </span>
                      {'badge' in item && item.badge && (
                        <span
                          className={cn(
                            'ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white',
                            collapsed && 'lg:hidden',
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t border-white/10 p-3">
          {user && (
            <div className="flex items-center gap-2.5 px-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </div>
              <div className={cn('overflow-hidden', collapsed && 'lg:hidden')}>
                <p className="truncate text-xs font-semibold text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-[10px] uppercase tracking-wider text-slate-500">
                  {user.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={cn(collapsed && 'lg:hidden')}>Sign Out</span>
          </button>

          <button
            onClick={toggleCollapsed}
            className="hidden w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 transition-all hover:bg-white/8 hover:text-white lg:flex"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <span className={cn(collapsed && 'lg:hidden')}>Collapse</span>
          </button>
        </div>
      </aside>
    </>
  );
}
