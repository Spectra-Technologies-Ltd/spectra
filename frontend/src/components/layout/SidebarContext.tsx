'use client';

import React, { createContext, useContext, useState, useSyncExternalStore } from 'react';

interface SidebarContextValue {
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = 'spectra:sidebar-collapsed';

// External store so the collapse preference can be read without an effect
// (SSR-safe: the server snapshot is always false).
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function readCollapsed() {
  return window.localStorage.getItem(STORAGE_KEY) === '1';
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, forceRender] = useState(0);

  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);

  const toggleCollapsed = () => {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? '0' : '1');
    // Re-read the store on the next render (storage events only fire in other tabs)
    forceRender((v) => v + 1);
  };

  return (
    <SidebarContext.Provider
      value={{
        mobileOpen,
        openMobile: () => setMobileOpen(true),
        closeMobile: () => setMobileOpen(false),
        collapsed,
        toggleCollapsed,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return ctx;
}
