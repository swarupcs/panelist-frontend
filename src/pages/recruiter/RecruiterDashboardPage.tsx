// src/pages/recruiter/RecruiterDashboardPage.tsx
//
// What a recruiter sees: the interviews they have defined, and who they have
// sent them to.
//
// Templates exist so an interview is configured once per job rather than once
// per candidate — and so candidates can be compared at all, since two results
// only mean something side by side if both people sat the same interview.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  CircleAlert,
  FileText,
  Loader2,
  Plus,
  Send,
  TriangleAlert,
  UserCheck,
  Users,
  BellRing,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Seo } from '@/components/common/Seo';
import { TemplateDialog } from '@/components/recruiter/TemplateDialog';
import { InviteDialog } from '@/components/recruiter/InviteDialog';
import { OutcomeControl } from '@/components/recruiter/OutcomeControl';
import {
  useArchiveTemplate,
  useAvailableViews,
  useInvitations,
  useRevokeInvitation,
  useTemplates,
} from '@/hooks/useRecruiter';
import type { IdentityConfidence, InvitationStatus } from '@/api/recruiter.api';

const STATUS_LABEL: Record<InvitationStatus, { label: string; tone: string }> = {
  PENDING: { label: 'Sent', tone: 'text-muted-foreground' },
  OPENED: { label: 'Opened', tone: 'text-sky-400' },
  IN_PROGRESS: { label: 'In progress', tone: 'text-amber-400' },
  COMPLETED: { label: 'Completed', tone: 'text-emerald-400' },
  EXPIRED: { label: 'Expired', tone: 'text-muted-foreground' },
  REVOKED: { label: 'Withdrawn', tone: 'text-muted-foreground' },
};

/**
 * Identity is shown as a fact, never as a score.
 *
 * Without third-party verification impersonation cannot be prevented, only
 * detected and disclosed. A mismatch is worth a recruiter's attention and is
 * not by itself evidence of anything — plenty of people sign in with a
 * personal address.
 */
function IdentityNote({ confidence }: { confidence: IdentityConfidence }) {
  if (confidence !== 'EMAIL_MISMATCH') return null;

  return (
    <span
      className="flex items-center gap-1 text-xs text-amber-400"
      title="Signed in with a different email address than the one invited. Common and usually innocent, but worth knowing."
    >
      <CircleAlert className="size-3" />
      different email
    </span>
  );
}

export default function RecruiterDashboardPage() {
  const { profile, dpaAccepted } = useAvailableViews();
  const { data: templates, isLoading } = useTemplates();
  const { data: pipeline } = useInvitations();
  const archive = useArchiveTemplate();
  const revoke = useRevokeInvitation();

  const [templateOpen, setTemplateOpen] = useState(false);
  const [inviteFor, setInviteFor] = useState<{ id: string; name: string } | null>(null);

  const quota = pipeline?.quota;
  const quotaSpent = quota ? quota.used >= quota.limit : false;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <Seo title="Hiring" description="Interviews you have defined and the candidates you have invited." noIndex />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Hiring</h1>
          <p className="text-sm text-muted-foreground">
            {profile?.companyName ?? 'Your company'}
          </p>
        </div>
        <Button onClick={() => setTemplateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          New interview
        </Button>
      </div>

      {/* The DPA gates invitations rather than the profile, so this is the one
          place it has to be chased. */}
      {!dpaAccepted && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-4">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Accept the data processing agreement</p>
              <p className="text-xs text-muted-foreground">
                You cannot invite candidates until you do.{' '}
                <Link to="/recruiter/setup" className="text-primary hover:underline">
                  Finish setting up
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {quota && (
        <p className="text-xs text-muted-foreground">
          {quota.used} of {quota.limit} invitations used while billing is off.
          {quotaSpent && ' Withdraw one to free a slot.'}
        </p>
      )}

      {/* ── Interviews ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Interviews</h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !templates?.length ? (
          <Card>
            <CardContent className="space-y-2 p-6 text-center">
              <FileText className="mx-auto size-6 text-muted-foreground" />
              <p className="text-sm font-medium">No interviews yet</p>
              <p className="text-xs text-muted-foreground">
                Define one per role. Every candidate for that role sits the same
                interview, which is what makes their results comparable.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {templates.map((template) => (
              <li
                key={template.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{template.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      template.type.replace(/_/g, ' ').toLowerCase(),
                      template.difficulty.toLowerCase(),
                      `${template.durationMinutes} min`,
                      template.requireRecording ? 'recorded' : 'not recorded',
                      template.allowHints ? 'hints on' : 'hints off',
                    ].join(' · ')}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {template._count?.invitations ?? 0} invited
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={!dpaAccepted || quotaSpent}
                    onClick={() => setInviteFor({ id: template.id, name: template.name })}
                  >
                    <Send className="size-3.5" />
                    Invite
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => archive.mutate(template.id)}
                    title="Archive — existing invitations keep working"
                  >
                    <Archive className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Candidates ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Candidates</h2>
          {(pipeline?.invitations.length ?? 0) > 1 && (
            <Link
              to="/recruiter/candidates"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Users className="size-3.5" /> Compare &amp; rank
            </Link>
          )}
        </div>

        {!pipeline?.invitations.length ? (
          <p className="text-sm text-muted-foreground">
            Nobody invited yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {pipeline.invitations.map((invitation) => {
              const status = STATUS_LABEL[invitation.status];
              const session = invitation.attempts.at(-1)?.sessionId;

              return (
                <li
                  key={invitation.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-4"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium">{invitation.email}</p>
                    <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{invitation.template.name}</span>
                      <span className={cn('font-medium', status.tone)}>{status.label}</span>
                      {invitation.reminderSentAt && (
                        <span
                          className="inline-flex items-center gap-1 text-amber-500"
                          title={`Reminder emailed ${new Date(invitation.reminderSentAt).toLocaleString()}`}
                        >
                          <BellRing className="size-3" />
                          Reminded
                        </span>
                      )}
                      <OutcomeControl
                        invitationId={invitation.id}
                        outcome={invitation.outcome}
                        compact
                      />
                      <IdentityNote confidence={invitation.identityConfidence} />
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {/* Only once there is something to look at. A link to an
                        interview nobody has taken is a dead end. */}
                    {session && (
                      <Link to={`/recruiter/sessions/${session}`}>
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <UserCheck className="size-3.5" />
                          Review
                        </Button>
                      </Link>
                    )}
                    {invitation.status !== 'COMPLETED' && invitation.status !== 'REVOKED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => revoke.mutate(invitation.id)}
                        title="Withdraw — also how you fix a link that reached the wrong person"
                      >
                        {revoke.isPending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          'Withdraw'
                        )}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <TemplateDialog isOpen={templateOpen} onClose={() => setTemplateOpen(false)} />
      {inviteFor && (
        <InviteDialog
          template={inviteFor}
          isOpen
          onClose={() => setInviteFor(null)}
        />
      )}
    </div>
  );
}
