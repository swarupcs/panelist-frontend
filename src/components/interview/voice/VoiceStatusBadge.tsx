/**
 * VoiceStatusBadge — Shows the current phase of the voice interview
 */

import { Loader2, Mic, MicOff, Volume2, Brain, PauseCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { VoicePhase } from '@/services/voice/types';

interface VoiceStatusBadgeProps {
  phase: VoicePhase;
  className?: string;
}

const PHASE_CONFIG: Record<
  VoicePhase,
  { label: string; icon: React.ElementType; color: string; pulse?: boolean }
> = {
  connecting:   { label: 'Connecting…',      icon: Loader2,      color: 'text-muted-foreground',  pulse: true },
  ready:        { label: 'Ready',             icon: CheckCircle2, color: 'text-emerald-400' },
  ai_speaking:  { label: 'AI is speaking',   icon: Volume2,      color: 'text-violet-400',  pulse: true },
  user_speaking:{ label: 'Your turn — speak',icon: Mic,          color: 'text-emerald-400', pulse: true },
  ai_thinking:  { label: 'AI is thinking…',  icon: Brain,        color: 'text-amber-400',   pulse: true },
  feedback:     { label: 'Receiving feedback',icon: Volume2,      color: 'text-blue-400',    pulse: true },
  paused:       { label: 'Paused',            icon: PauseCircle,  color: 'text-yellow-400' },
  completed:    { label: 'Completed',         icon: CheckCircle2, color: 'text-emerald-400' },
  error:        { label: 'Error',             icon: MicOff,       color: 'text-destructive' },
};

export function VoiceStatusBadge({ phase, className }: VoiceStatusBadgeProps) {
  const config = PHASE_CONFIG[phase];
  const Icon   = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
        'border-border/50 bg-card/60 backdrop-blur-sm',
        config.color,
        className,
      )}
    >
      <Icon className={cn('size-3.5', config.pulse && 'animate-pulse')} />
      {config.label}
    </div>
  );
}
