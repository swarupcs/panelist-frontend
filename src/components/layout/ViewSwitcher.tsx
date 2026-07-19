// src/components/layout/ViewSwitcher.tsx
//
// Switching between practising and hiring.
//
// Renders nothing at all unless somebody genuinely has both. A switcher with
// one option is not a switcher, and a recruiter who has never practised should
// not be offered a practice dashboard reading "readiness score: 0".
//
// This is what deriving roles buys: the list comes from what the account has,
// so nobody configures anything and there is no BOTH case to maintain.

import { useNavigate } from 'react-router-dom';
import { Briefcase, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAvailableViews, type AppView } from '@/hooks/useRecruiter';

/** Where each view begins. */
const HOME: Record<AppView, string> = {
  candidate: '/dashboard',
  recruiter: '/recruiter',
};

export function ViewSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const navigate = useNavigate();
  const { views, view, setView, canSwitch } = useAvailableViews();

  if (!canSwitch) return null;

  const go = (next: AppView) => {
    setView(next);
    navigate(HOME[next]);
  };

  if (collapsed) {
    // Collapsed sidebar: one button that toggles, since two labelled halves
    // do not fit and an icon pair would be a guessing game.
    const other: AppView = view === 'recruiter' ? 'candidate' : 'recruiter';
    const Icon = other === 'recruiter' ? Briefcase : GraduationCap;

    return (
      <button
        type="button"
        onClick={() => go(other)}
        title={other === 'recruiter' ? 'Switch to hiring' : 'Switch to practice'}
        className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Icon className="size-4" />
      </button>
    );
  }

  return (
    <div className="flex gap-1 rounded-lg border border-border/60 p-1">
      {views.map((candidate) => {
        const isActive = candidate === view;
        const Icon = candidate === 'recruiter' ? Briefcase : GraduationCap;

        return (
          <button
            key={candidate}
            type="button"
            onClick={() => go(candidate)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
              isActive
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" />
            {candidate === 'recruiter' ? 'Hiring' : 'Practice'}
          </button>
        );
      })}
    </div>
  );
}

export default ViewSwitcher;
