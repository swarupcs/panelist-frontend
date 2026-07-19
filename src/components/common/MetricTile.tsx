// src/components/common/MetricTile.tsx
//
// One headline number.
//
// Shared because the dashboard and the analytics page report the same four
// figures — interviews, average score, completion rate, rank — and were
// styling them differently, so the same number looked like two different
// things depending on which page you were on.
//
// The label sits above the value. These are read as a row, and scanning four
// bare numbers and then hunting back for what each one meant is slower than
// reading the question first.

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export function MetricTile({
  label,
  value,
  subtitle,
  icon: Icon,
  valueClassName,
  accent = false,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  /** Colour for the number itself, e.g. a score that reads red or green. */
  valueClassName?: string;
  /** Emphasis, for the one figure on the page that outranks the others. */
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 shadow-sm transition-colors sm:p-5',
        accent
          ? 'border-primary/25 bg-gradient-to-br from-primary/10 to-card'
          : 'border-border/60 bg-card/60',
      )}
    >
      <div className='flex items-start justify-between gap-3'>
        <p className='min-w-0 truncate text-xs font-medium uppercase tracking-wider text-muted-foreground'>
          {label}
        </p>
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            accent
              ? 'bg-primary/15 text-primary'
              : 'bg-secondary/60 text-muted-foreground',
          )}
        >
          <Icon className='size-4' />
        </span>
      </div>

      <p
        className={cn(
          'mt-2 text-2xl font-semibold tabular-nums sm:text-3xl',
          valueClassName ?? 'text-foreground',
        )}
      >
        {value}
      </p>

      {subtitle && (
        <p
          className={cn(
            'mt-0.5 text-xs',
            accent ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default MetricTile;
