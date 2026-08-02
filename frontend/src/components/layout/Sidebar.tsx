'use client';

import React from 'react';
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
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  UserCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useSidebar } from './SidebarContext';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Guards', href: '/guards', icon: Users },
  { label: 'Clients', href: '/clients', icon: Building2 },
  { label: 'Sites', href: '/sites', icon: MapPin },
  { label: 'Attendance', href: '/attendance', icon: ClipboardCheck },
  { label: 'Incidents', href: '/incidents', icon: AlertTriangle },
  { label: 'Patrols', href: '/patrols', icon: Route },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Reports', href: '/reports', icon: FileText },
  { label: 'Account', href: '/account', icon: UserCircle },
];

export default function Sidebar() {
  const { collapsed, toggleCollapsed, mobileOpen, closeMobile } = useSidebar();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleNavClick = () => {
    // Close mobile sidebar when navigating
    if (mobileOpen) closeMobile();
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-4.5 w-4.5" />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold tracking-wide text-foreground whitespace-nowrap">
              SPECTRA OPS
            </span>
          )}
        </div>
        {/* Close button — visible on mobile only */}
        <button
          onClick={closeMobile}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User & Collapse */}
      <div className="border-t border-border p-2 space-y-1">
        {user && !collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-xs font-semibold text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                {user.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all',
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* Collapse toggle — hidden on mobile */}
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex w-full items-center justify-center rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile sidebar (overlay) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-screen h-dvh w-[240px] flex-col border-r border-border bg-card transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar (always visible) */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-20 hidden h-screen h-dvh flex-col border-r border-border bg-card transition-all duration-300 md:flex',
          collapsed ? 'w-[68px]' : 'w-[240px]'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
