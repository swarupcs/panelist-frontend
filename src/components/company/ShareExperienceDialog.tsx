// src/components/company/ShareExperienceDialog.tsx
//
// Contribute an interview experience for a company.
//
// The backend has accepted these since before this client existed and the
// companies list shows a count of them, so the number was visible while the
// only way to increase it was a direct API call.

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { companyApi } from '@/api/company.api';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
type Outcome = 'OFFER' | 'REJECTED' | 'PENDING' | 'WITHDREW';

interface ShareExperienceDialogProps {
  slug: string;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function ShareExperienceDialog({
  slug,
  companyName,
  isOpen,
  onClose,
  onSubmitted,
}: ShareExperienceDialogProps) {
  const [position, setPosition] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Mid-level');
  const [rounds, setRounds] = useState('');
  const [outcome, setOutcome] = useState<Outcome>('PENDING');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [preparation, setPreparation] = useState('');
  const [tips, setTips] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Position and preparation are what make an entry worth reading; the rest
  // has sensible defaults.
  const canSubmit = position.trim().length > 0 && preparation.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await companyApi.addExperience(slug, {
        position: position.trim(),
        experienceLevel,
        // Stored as JSON. A free-text list of rounds is far easier to write
        // than a structured builder, and reads the same to anyone else.
        rounds: rounds
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean),
        outcome,
        difficulty,
        preparation: preparation.trim(),
        tips: tips.trim() || undefined,
        isAnonymous,
      });
      toast.success('Thanks — your experience will help others prepare.');
      onSubmitted?.();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Could not submit your experience.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share your {companyName} interview</DialogTitle>
          <DialogDescription>
            What the rounds were and how you prepared. This is the part people
            cannot get from a question bank.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="position">Role</Label>
              <Input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Backend Engineer"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="level">Level</Label>
              <select
                id="level"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option>Intern</option>
                <option>Entry-level</option>
                <option>Mid-level</option>
                <option>Senior</option>
                <option>Staff or above</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="difficulty">Difficulty</Label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
                <option value="VERY_HARD">Very hard</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="outcome">Outcome</Label>
              <select
                id="outcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as Outcome)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="OFFER">Offer</option>
                <option value="REJECTED">Rejected</option>
                <option value="PENDING">Still waiting</option>
                <option value="WITHDREW">Withdrew</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rounds">
              Rounds <span className="text-muted-foreground">(one per line)</span>
            </Label>
            <textarea
              id="rounds"
              value={rounds}
              onChange={(e) => setRounds(e.target.value)}
              rows={3}
              placeholder={'Phone screen — two array questions\nSystem design — design a rate limiter\nBehavioural'}
              className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="preparation">How you prepared</Label>
            <textarea
              id="preparation"
              value={preparation}
              onChange={(e) => setPreparation(e.target.value)}
              rows={3}
              placeholder="What you studied, for how long, and what actually mattered on the day."
              className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tips">
              Anything you&rsquo;d tell yourself beforehand{' '}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <textarea
              id="tips"
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              rows={2}
              className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
            <div>
              <p className="text-sm font-medium">Post anonymously</p>
              <p className="text-xs text-muted-foreground">
                Your name is not shown alongside the entry.
              </p>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit} className="gap-2">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShareExperienceDialog;
