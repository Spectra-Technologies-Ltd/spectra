'use client';

import React from 'react';
import { Bell, Search, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

export default function Header() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = React.useState(true);

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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl px-6">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="flex items-center w-full gap-2 rounded-lg bg-secondary/50 border border-border px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/30 transition-all">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search guards, sites, incidents..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
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

        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
            3
          </span>
        </button>

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
