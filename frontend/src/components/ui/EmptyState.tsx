import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, className }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center text-muted-foreground ${className ?? ''}`}>
      <Icon className="h-12 w-12 mb-3 opacity-20" />
      <p>{title}</p>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      {label}
    </div>
  );
}
