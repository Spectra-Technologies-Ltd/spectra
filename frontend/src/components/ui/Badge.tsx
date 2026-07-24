import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  colorClassName: string;
}

/**
 * Renders a pill-shaped status badge. Pages own the domain -> color mapping
 * (e.g. getStatusColor) and pass the resulting class string in here, so this
 * component only owns the shared shape/typography.
 */
export function Badge({ colorClassName, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider whitespace-nowrap',
        colorClassName,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
