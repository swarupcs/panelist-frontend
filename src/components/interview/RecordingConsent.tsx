// src/components/interview/RecordingConsent.tsx
//
// Asks before recording, and means it.
//
// Recording someone's screen and showing it to a recruiter is not something to
// infer from a toggle left on by default. This says plainly what is captured,
// who can see it, and what declining costs.
//
// It says different things in the two cases, because they are different deals.
// In practice the recording is the candidate's own: nobody else sees it, they
// can delete it whenever they like, and declining changes nothing. In an
// assessment a named company receives it, it is kept while they decide, and
// where a recruiter requires recording, declining ends the interview. Using
// the practice wording for the second would misdescribe where the video goes.
//
// Both buttons are equally prominent on purpose. A dialog where the agreeable
// answer is a filled button and the refusal is faint grey text is not really
// asking.

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Monitor, ShieldCheck, Video } from 'lucide-react';

interface RecordingConsentProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  isStarting?: boolean;
  /** Null for practice. Present when this interview was sent by a company. */
  assessment?: {
    companyName: string;
    requireRecording: boolean;
    requireCamera: boolean;
    retentionDays: number;
  } | null;
}

export function RecordingConsent({
  isOpen,
  onAccept,
  onDecline,
  isStarting,
  assessment,
}: RecordingConsentProps) {
  const required = Boolean(assessment?.requireRecording);
  const camera = Boolean(assessment?.requireCamera);
  const company = assessment?.companyName;

  const retention =
    assessment && assessment.retentionDays > 0
      ? `kept for ${assessment.retentionDays} days after they decide`
      : 'kept until they no longer need it';
  return (
    // Not dismissible by clicking away or pressing Escape: a dialog that
    // vanishes on a stray click leaves the answer ambiguous, and this question
    // needs a deliberate one.
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {company
              ? camera
                ? `${company} records your screen and camera`
                : `${company} records this interview`
              : 'Record this interview?'}
          </DialogTitle>
          <DialogDescription>
            {company
              ? 'They review how you worked, not just your final answers.'
              : 'Recording lets you review how you worked, not just your final answers.'}
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

          {/* Said as its own point rather than folded into the sentence above.
              Being on camera is a materially different thing from sharing a
              screen, and somebody skimming should not miss it. */}
          {camera && (
            <li className="flex gap-3">
              <Video className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Your camera is recorded too.</strong>{' '}
                A person reviews it — it is never analysed automatically, and nothing
                about your face or expression affects your score.
              </p>
            </li>
          )}

          <li className="flex gap-3">
            <Eye className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {company ? (
                <>
                  Sent to <strong className="text-foreground">{company}</strong> and{' '}
                  {retention}. Nobody else sees it.
                </>
              ) : (
                <>Only you can see this. You can delete it whenever you like.</>
              )}
            </p>
          </li>

          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              You can stop at any time from your browser&rsquo;s sharing bar.
              {company
                ? ' Ask them to delete it once they have made their decision.'
                : ' The interview carries on either way.'}
            </p>
          </li>
        </ul>

        {/* Said before they choose, not after. "Required" has to mean the
            interview does not happen — the alternative is proceeding
            unrecorded and being marked down for something nobody explained. */}
        {required && (
          <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-500">
            {company} requires recording for this interview. If you decline, the
            interview ends and nothing is sent to them.
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onDecline} disabled={isStarting} className="sm:flex-1">
            {required ? 'Decline and exit' : 'Continue without recording'}
          </Button>
          <Button onClick={onAccept} disabled={isStarting} className="sm:flex-1">
            {isStarting ? 'Starting…' : company ? 'Share my screen' : 'Record my session'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RecordingConsent;
