/**
 * WaveformVisualizer
 *
 * Animated waveform bars that visualize audio activity.
 * Three modes:
 *   - 'listening' → animated teal bars (candidate speaking)
 *   - 'speaking'  → animated purple bars (AI speaking)
 *   - 'idle'      → flat grey bars
 */

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

interface WaveformVisualizerProps {
  mode: 'listening' | 'speaking' | 'idle' | 'thinking';
  className?: string;
  barCount?: number;
}

export function WaveformVisualizer({
  mode,
  className,
  barCount = 24,
}: WaveformVisualizerProps) {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  const colorClass =
    mode === 'listening' ? 'bg-emerald-400'
    : mode === 'speaking' ? 'bg-violet-400'
    : mode === 'thinking' ? 'bg-amber-400'
    : 'bg-muted-foreground/30';

  const isAnimated = mode !== 'idle';

  return (
    <div
      className={cn('flex items-center justify-center gap-[3px]', className)}
      aria-hidden
    >
      {bars.map((i) => (
        <Bar
          key={i}
          index={i}
          colorClass={colorClass}
          isAnimated={isAnimated}
          barCount={barCount}
        />
      ))}
    </div>
  );
}

function Bar({
  index,
  colorClass,
  isAnimated,
  barCount,
}: {
  index: number;
  colorClass: string;
  isAnimated: boolean;
  barCount: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const phaseRef = useRef(Math.random() * Math.PI * 2);

  useEffect(() => {
    if (!isAnimated || !ref.current) {
      if (ref.current) ref.current.style.height = '4px';
      return;
    }

    let frame = 0;
    const center = barCount / 2;
    const distFromCenter = Math.abs(index - center) / center;
    const maxHeight = 36 - distFromCenter * 18; // taller in the middle

    const animate = () => {
      frame++;
      // Slow organic wave using multiple sine waves at different frequencies
      const h =
        maxHeight * 0.4 +
        maxHeight * 0.3 * Math.sin(frame * 0.05 + phaseRef.current) +
        maxHeight * 0.2 * Math.sin(frame * 0.12 + phaseRef.current * 1.7) +
        maxHeight * 0.1 * Math.sin(frame * 0.08 + index * 0.4);

      if (ref.current) {
        ref.current.style.height = `${Math.max(4, h)}px`;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isAnimated, index, barCount]);

  return (
    <div
      ref={ref}
      className={cn('w-[3px] rounded-full transition-colors duration-300', colorClass)}
      style={{ height: '4px' }}
    />
  );
}
