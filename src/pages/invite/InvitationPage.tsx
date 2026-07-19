// src/pages/invite/InvitationPage.tsx
//
// What a candidate sees when they open an invitation link.
//
// Renders before any login wall, deliberately. Demanding an account before
// showing what somebody has been invited to loses candidates, and asking them
// to consent to being recorded *after* they have already signed up and
// invested time is not much of a choice. Everything they are agreeing to is on
// this page, before they commit anything.
//
// It is also deliberately plain. Someone sitting an assessment for a job is
// not here to be sold a subscription, and a person who happens to be a
// recruiter elsewhere gets exactly this page too — the two contexts never
// bleed into each other.

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CalendarClock,
  CircleAlert,
  Clock,
  Eye,
  Loader2,
  Lock,
  Monitor,
  TriangleAlert,
  UserCheck,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Seo } from '@/components/common/Seo';
import { invitationApi, type PublicInvitation } from '@/api/recruiter.api';
import { useAuthStore } from '@/store/authStore';
import { clearReturnPath, rememberReturnPath } from '@/lib/post-auth-redirect';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-lg space-y-6">{children}</div>
    </div>
  );
}

function Closed({ title, detail }: { title: string; detail: string }) {
  return (
    <Shell>
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <TriangleAlert className="mx-auto size-8 text-amber-500" />
          <p className="text-base font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{detail}</p>
        </CardContent>
      </Card>
    </Shell>
  );
}

function Requirement({
  icon: Icon,
  children,
}: {
  icon: typeof Monitor;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{children}</span>
    </li>
  );
}

export default function InvitationPage() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [starting, setStarting] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => invitationApi.getPublic(token),
    enabled: Boolean(token),
    retry: false,
  });

  // Remembered so signing in returns here rather than dumping the candidate on
  // a dashboard with no idea what happened to the invitation they clicked.
  useEffect(() => {
    if (token) rememberReturnPath(`/invite/${token}`);
  }, [token]);

  const handleStart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setStarting(true);
    try {
      const { sessionId } = await invitationApi.start(token);
      clearReturnPath();
      navigate(`/interview/${sessionId}`, { replace: true });
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? 'Could not start the interview.';
      toast.error(message);
      setStarting(false);
    }
  };

  if (isLoading || !isInitialized) {
    return (
      <Shell>
        <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading your invitation…
        </div>
      </Shell>
    );
  }

  if (isError || !data) {
    return (
      <Closed
        title="This link isn’t valid"
        detail="It may have been mistyped, or withdrawn by the company that sent it."
      />
    );
  }

  const invitation: PublicInvitation = data;

  if (invitation.revoked) {
    return (
      <Closed
        title="This invitation was withdrawn"
        detail={`${invitation.companyName} has withdrawn it. If you think that's a mistake, contact them directly.`}
      />
    );
  }

  if (invitation.expired) {
    return (
      <Closed
        title="This invitation has expired"
        detail={`The deadline has passed. ${invitation.companyName} can send you a new one.`}
      />
    );
  }

  if (invitation.completed) {
    return (
      <Closed
        title="You’ve already completed this interview"
        detail={`${invitation.companyName} has your results. There's nothing more to do here.`}
      />
    );
  }

  const deadline = new Date(invitation.expiresAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Shell>
      <Seo
        title={`Interview invitation — ${invitation.companyName}`}
        description="An interview invitation on Panelist."
        noIndex
      />

      <div className="space-y-2 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10">
          <Building2 className="size-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">
          {invitation.companyName} invited you to an interview
        </h1>
        <p className="text-sm text-muted-foreground">{invitation.interviewName}</p>
      </div>

      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              About {invitation.durationMinutes} minutes
            </span>
            <span className="flex items-center gap-2">
              <CalendarClock className="size-4 text-muted-foreground" />
              Take it any time before {deadline}
            </span>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-medium">Before you start</p>
            <ul className="space-y-3">
              <Requirement icon={Monitor}>
                It’s an AI interview — you’ll answer questions and write code, and it’s
                assessed automatically.
              </Requirement>

              {invitation.requiresRecording && (
                <Requirement icon={Eye}>
                  <strong className="text-foreground">Your screen will be recorded</strong> and
                  shared with {invitation.companyName}. Your browser will ask what to share,
                  and you can stop at any time.
                </Requirement>
              )}

              {/* Its own line, before any signup. Being on camera is a
                  materially different ask from sharing a screen, and it is the
                  requirement most likely to make somebody decline — which they
                  should be able to do before investing anything. */}
              {invitation.requiresCamera && (
                <Requirement icon={Video}>
                  <strong className="text-foreground">Your camera will be on.</strong> A
                  person at {invitation.companyName} watches it; it is never analysed
                  automatically, and nothing about your face or expression affects your
                  score.
                </Requirement>
              )}

              <Requirement icon={Lock}>
                {invitation.resultShared
                  ? 'You’ll see your own result when you finish.'
                  : `Your result goes to ${invitation.companyName}. They decide whether to share it with you.`}
              </Requirement>

              {!invitation.allowsHints && (
                <Requirement icon={CircleAlert}>
                  Hints are turned off for this interview.
                </Requirement>
              )}

              {/* The rest of the notice somebody is owed before being
                  assessed: how long what they produce is kept, and that a
                  person makes the decision rather than the model. The second
                  is a legal requirement in several jurisdictions, not a
                  courtesy. */}
              <Requirement icon={Clock}>
                {invitation.requiresRecording
                  ? invitation.retentionDays > 0
                    ? `Your recording is kept for ${invitation.retentionDays} days after ${invitation.companyName} decides, then deleted.`
                    : `Your recording is kept until ${invitation.companyName} no longer needs it.`
                  : `Your answers are kept until ${invitation.companyName} no longer needs them.`}
              </Requirement>

              <Requirement icon={UserCheck}>
                A person at {invitation.companyName} makes the decision — the
                assessment is input to it, not the decision itself. You can ask
                them to have a person review your result.
              </Requirement>
            </ul>
          </div>

          {/* Nobody has verified this company name. Saying so is the interim
              mitigation for a real phishing vector: anyone can claim to be a
              known employer and ask a candidate to share their screen. */}
          <p className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
            We haven’t verified who sent this. If you weren’t expecting an interview from{' '}
            {invitation.companyName}, check with them before sharing your screen.
          </p>

          {invitation.alreadyBound && !isAuthenticated && (
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-500">
              Someone has already started this interview. If that wasn’t you, ask{' '}
              {invitation.companyName} for a new link.
            </p>
          )}

          <Button
            onClick={handleStart}
            size="lg"
            className="w-full gap-2"
            disabled={starting}
          >
            {starting && <Loader2 className="size-4 animate-spin" />}
            {isAuthenticated ? 'Start the interview' : 'Sign in to start'}
          </Button>

          {!isAuthenticated && (
            <p className="text-center text-xs text-muted-foreground">
              You’ll need an account so your work is saved.{' '}
              <Link to="/register" className="text-primary hover:underline">
                Create one
              </Link>{' '}
              — it takes a moment, and it’s free.
            </p>
          )}
        </CardContent>
      </Card>
    </Shell>
  );
}
