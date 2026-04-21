import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  subtext?: string;
  trend?: { value: number; label?: string };
  className?: string;
}

export function StatCard({ label, value, subtext, trend, className }: StatCardProps) {
  const isPositive = trend && trend.value >= 0;
  const isNegative = trend && trend.value < 0;

  return (
    <div className={`rounded-lg border border-white/5 bg-bg-2 p-5 ${className ?? ''}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-ink-2">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums text-ink-0">{value}</span>
        {trend && (
          <span
            className={`text-xs font-medium tabular-nums ${
              isPositive ? 'text-accent-green' : isNegative ? 'text-accent-red' : 'text-ink-2'
            }`}
          >
            {isPositive ? '+' : ''}{trend.value.toFixed(2)}%
            {trend.label && <span className="ml-1 text-ink-3">{trend.label}</span>}
          </span>
        )}
      </div>
      {subtext && <p className="mt-1 text-xs text-ink-2">{subtext}</p>}
    </div>
  );
}
