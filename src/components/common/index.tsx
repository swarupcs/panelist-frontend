import { cn } from '@/lib/cn'
import {  AlertCircle, TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react'

// ── Loading Spinner ────────────────────────────────────────────────────────

export function Spinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'size-4', md: 'size-6', lg: 'size-8' }
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-border border-t-primary',
        sizeMap[size],
        className,
      )}
    />
  )
}

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Spinner size="lg" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      {Icon && (
        <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
          <Icon className="size-7 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Error State ────────────────────────────────────────────────────────────

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-7 text-destructive" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-primary hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  )
}

// ── Page Header ────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2 mt-3 sm:mt-0">{action}</div>}
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────────────────────

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  className,
  iconClassName,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
  iconClassName?: string
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground'

  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10', iconClassName)}>
            <Icon className="size-5 text-primary" />
          </div>
        )}
      </div>
      {trendValue && (
        <div className={cn('mt-3 flex items-center gap-1 text-xs font-medium', trendColor)}>
          <TrendIcon className="size-3.5" />
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  )
}

// ── Section Header ─────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Score Ring ─────────────────────────────────────────────────────────────

export function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 85 ? '#4ade80' : score >= 70 ? '#38bdf8' : score >= 50 ? '#facc15' : '#f87171'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text
        x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size * 0.2} fontWeight="bold"
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
      >
        {Math.round(score)}
      </text>
    </svg>
  )
}

// React import needed for JSX
import React from 'react'
