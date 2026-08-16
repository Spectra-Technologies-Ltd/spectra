'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { SidebarProvider } from './SidebarContext';
import { useAuth } from '@/providers/AuthProvider';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading secure interface...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // AuthProvider redirects to /login; render nothing to avoid a flash of
    // protected content before the redirect lands.
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <Sidebar />
        {/* min-w-0 keeps children (tables, charts) from forcing the column to overflow */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {/* key=pathname re-mounts the content on each route change so the
                page-enter transition plays while the chrome stays static */}
            <div key={pathname} className="page-enter mx-auto w-full max-w-[1440px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
