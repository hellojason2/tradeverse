import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function GlassCard({ children, className, padding = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl',
        padding && 'p-5',
        className
      )}
    >
      {children}
    </div>
  );
}
