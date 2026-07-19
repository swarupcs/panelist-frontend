// src/components/recruiter/InviteDialog.tsx
//
// Inviting one candidate.
//
// The link is shown after sending, not just emailed. Email delivery is
// best-effort — SMTP may not be configured, spam folders are real — and a
// recruiter who cannot find the invitation has no way to recover otherwise.

import { useState } from 'react';
import { Check, Copy, Loader2, Send } from 'lucide-react';
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
import { useInvite } from '@/hooks/useRecruiter';

export function InviteDialog({
  template,
  isOpen,
  onClose,
}: {
  template: { id: string; name: string };
  isOpen: boolean;
  onClose: () => void;
}) {
  const invite = useInvite();

  const [email, setEmail] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [extraMinutes, setExtraMinutes] = useState(0);
  const [sentUrl, setSentUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSend = async () => {
    const result = await invite.mutateAsync({
      templateId: template.id,
      email: email.trim(),
      expiresInDays,
      accommodationExtraMinutes: extraMinutes,
    });
    setSentUrl(result.url);
  };

  const handleCopy = async () => {
    if (!sentUrl) return;
    await navigator.clipboard.writeText(sentUrl);
    setCopied(true);
    toast.success('Link copied.');
  };

  const handleClose = () => {
    setEmail('');
    setSentUrl(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{sentUrl ? 'Invitation sent' : 'Invite a candidate'}</DialogTitle>
          <DialogDescription>{template.name}</DialogDescription>
        </DialogHeader>

        {sentUrl ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We emailed <strong className="text-foreground">{email}</strong>. You can also
              send this link yourself — worth doing if it does not arrive.
            </p>

            <div className="flex gap-2">
              <Input readOnly value={sentUrl} className="font-mono text-xs" />
              <Button variant="outline" onClick={handleCopy} className="shrink-0 gap-1.5">
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                Copy
              </Button>
            </div>

            {/* Said here as well as on the candidate's page: whoever holds this
                link can start the interview, and it binds to the first person
                who does. */}
            <p className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
              Anyone with this link can start the interview, and it locks to the first
              person who does. If it reaches the wrong person, withdraw it and send
              another.
            </p>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cemail">Candidate email</Label>
              <Input
                id="cemail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@example.com"
                autoComplete="off"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cexp">Deadline</Label>
                <select
                  id="cexp"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value={3}>Within 3 days</option>
                  <option value={7}>Within a week</option>
                  <option value={14}>Within 2 weeks</option>
                  <option value={30}>Within a month</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cacc">Extra time</Label>
                <select
                  id="cacc"
                  value={extraMinutes}
                  onChange={(e) => setExtraMinutes(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value={0}>None</option>
                  <option value={10}>+10 minutes</option>
                  <option value={20}>+20 minutes</option>
                  <option value={30}>+30 minutes</option>
                </select>
              </div>
            </div>

            {/* Extra time is an accommodation. The candidate is never asked to
                explain why they need it, and nothing tells them it was
                applied — which is the point. */}
            <p className="text-xs text-muted-foreground">
              Extra time is applied quietly. The candidate is not told it was added, and
              is never asked to give a reason.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleClose} disabled={invite.isPending}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={!email.trim() || invite.isPending}
                className="gap-2"
              >
                {invite.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Send invitation
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default InviteDialog;
