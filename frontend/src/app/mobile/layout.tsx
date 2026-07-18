'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Home, Map, AlertTriangle, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden md:hidden">
      {/* Mobile Header */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm tracking-wide">SPECTRA OPS</span>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center"
          >
            <User className="h-4 w-4 text-foreground" />
          </button>
          {showMenu && (
            <div ref={menuRef} className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-card shadow-xl z-50 py-1">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{user?.role}</p>
              </div>
              <button
                onClick={() => { logout(); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-background/50 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-card px-6 flex items-center justify-between z-50">
        <Link href="/mobile" className={cn("flex flex-col items-center gap-1", pathname === '/mobile' ? "text-primary" : "text-muted-foreground")}>
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link href="/mobile/patrol" className={cn("flex flex-col items-center gap-1", pathname === '/mobile/patrol' ? "text-primary" : "text-muted-foreground")}>
          <Map className="h-5 w-5" />
          <span className="text-[10px] font-medium">Patrol</span>
        </Link>
        <div className="relative -top-5">
          <button className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_4px_20px_rgba(139,92,246,0.4)]">
            <Shield className="h-6 w-6" />
          </button>
        </div>
        <Link href="/mobile/incidents" className={cn("flex flex-col items-center gap-1", pathname === '/mobile/incidents' ? "text-primary" : "text-muted-foreground")}>
          <AlertTriangle className="h-5 w-5" />
          <span className="text-[10px] font-medium">Report</span>
        </Link>
        <Link href="/mobile/profile" className={cn("flex flex-col items-center gap-1", pathname === '/mobile/profile' ? "text-primary" : "text-muted-foreground")}>
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
