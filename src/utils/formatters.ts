import { format, formatDistanceToNow, parseISO } from 'date-fns'

// ── Date Formatting ────────────────────────────────────────────────────────

export function formatDate(date: string | Date, fmt = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt)
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy HH:mm')
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

// ── Number Formatting ──────────────────────────────────────────────────────

export function formatScore(score: number | undefined | null): string {
  if (score === undefined || score === null) return '—'
  return `${Math.round(score)}/100`
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatDuration(seconds: number): string {
  if (seconds < 0) return '∞'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ── Score Color ────────────────────────────────────────────────────────────

export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-400'
  if (score >= 70) return 'text-blue-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

export function getScoreBg(score: number): string {
  if (score >= 85) return 'bg-green-400/10 text-green-400 border-green-400/20'
  if (score >= 70) return 'bg-blue-400/10 text-blue-400 border-blue-400/20'
  if (score >= 50) return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
  return 'bg-red-400/10 text-red-400 border-red-400/20'
}

// ── Difficulty Colors ──────────────────────────────────────────────────────

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'text-green-400'
    case 'medium': return 'text-yellow-400'
    case 'hard': return 'text-red-400'
    default: return 'text-muted-foreground'
  }
}

export function getDifficultyBadge(difficulty: string): string {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'bg-green-400/10 text-green-400 border-green-400/20'
    case 'medium': return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
    case 'hard': return 'bg-red-400/10 text-red-400 border-red-400/20'
    default: return 'bg-muted text-muted-foreground'
  }
}

// ── Text Helpers ───────────────────────────────────────────────────────────

export function truncate(str: string, length = 100): string {
  if (str.length <= length) return str
  return `${str.slice(0, length)}...`
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function toTitleCase(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function formatInterviewType(type: string): string {
  const map: Record<string, string> = {
    dsa: 'DSA',
    system_design: 'System Design',
    behavioral: 'Behavioral',
    mixed: 'Mixed',
  }
  return map[type] ?? toTitleCase(type)
}

export function formatCategory(category: string): string {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

// ── Level Labels ───────────────────────────────────────────────────────────

export function getSkillLevelLabel(level: string): string {
  const map: Record<string, string> = {
    BEGINNER: 'Beginner',
    INTERMEDIATE: 'Intermediate',
    ADVANCED: 'Advanced',
    EXPERT: 'Expert',
  }
  return map[level] ?? level
}

// ── Validation Helpers ─────────────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ── Storage Helpers ────────────────────────────────────────────────────────

export function getStorageItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

// ── Confidence Color ───────────────────────────────────────────────────────

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return 'High'
  if (confidence >= 0.65) return 'Medium'
  return 'Low'
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.85) return 'text-green-400'
  if (confidence >= 0.65) return 'text-yellow-400'
  return 'text-red-400'
}
