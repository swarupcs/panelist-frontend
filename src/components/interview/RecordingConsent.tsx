// src/components/interview/RecordingConsent.tsx
//
// Asks before recording, and means it.
//
// Recording someone's screen and showing it to a recruiter is not something to
// infer from a toggle left on by default. This says plainly what is captured,
// who can see it, and that declining costs nothing — and declining is a
// genuine option that leads to a normal interview, not a degraded one.
//
// Both buttons are equally prominent on purpose. A dialog where the agreeable
// answer is a filled button and the refusal is faint grey text is not really
// asking.

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Monitor, ShieldCheck } from 'lucide-react';

interface RecordingConsentProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  isStarting?: boolean;
}

export function RecordingConsent({
  isOpen,
  onAccept,
  onDecline,
  isStarting,
}: RecordingConsentProps) {
  return (
    // Not dismissible by clicking away or pressing Escape: a dialog that
    // vanishes on a stray click leaves the answer ambiguous, and this question
    // needs a deliberate one.
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Record this interview?</DialogTitle>
          <DialogDescription>
            Recording lets a recruiter review how you worked, not just your final
            answers.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3 py-2">
          <li className="flex gap-3">
            <Monitor className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Your browser asks which screen or tab to share. You choose — we only
              receive what you pick.
            </p>
          </li>
          <li className="flex gap-3">
            <Eye className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Visible to you and to recruiters reviewing this session. Nobody else.
            </p>
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              You can stop at any time from your browser&rsquo;s sharing bar, and the
              interview carries on.
            </p>
          </li>
        </ul>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onDecline} disabled={isStarting} className="sm:flex-1">
            Continue without recording
          </Button>
          <Button onClick={onAccept} disabled={isStarting} className="sm:flex-1">
            {isStarting ? 'Starting…' : 'Record my session'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RecordingConsent;
