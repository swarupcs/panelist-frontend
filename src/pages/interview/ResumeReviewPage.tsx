// src/pages/interview/ResumeReviewPage.tsx
//
// Review a resume, then start an interview built from it.
//
// The review agent and its endpoint have existed for a long time and nothing
// ever called them — a working feature with no way in. This is that way in,
// and it is placed before the interview rather than beside it because the two
// belong in sequence: seeing what your resume actually says, then being
// questioned on it, is the flow people expect.
//
// Starting the interview does not require running a review first. The review
// is worth offering, not worth gating on — someone who knows their resume and
// wants to practise should not have to sit through an analysis to get there.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowRight,
  CircleAlert,
  FileSearch,
  Lightbulb,
  Loader2,
  ThumbsUp,
  TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/cn';
import { Seo } from '@/components/common/Seo';
import { ResumePicker } from '@/components/interview/ResumePicker';
import { resumeApi } from '@/api/user.api';
import { useAuthStore } from '@/store/authStore';

interface ResumeAnalysis {
  overallScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
  formattingIssues?: string[];
  contentGaps?: string[];
  atsCompatibility?: number;
}

/** Green above 75, amber above 50, red below — the usual reading of a score. */
function scoreTone(score: number): string {
  if (score >= 75) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-rose-500';
}

function ScoreRing({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border/60 px-6 py-4">
      <span className={cn('text-3xl font-bold tabular-nums', scoreTone(score))}>{score}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function PointList({
  title,
  points,
  icon: Icon,
  tone,
}: {
  title: string;
  points: string[];
  icon: typeof ThumbsUp;
  tone: string;
}) {
  if (points.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className={cn('size-4', tone)} />
        {title}
      </h3>
      <ul className="space-y-1.5">
        {points.map((point, index) => (
          <li key={index} className="flex gap-2 text-sm text-muted-foreground">
            <span className={cn('mt-1.5 size-1 shrink-0 rounded-full', tone.replace('text-', 'bg-'))} />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ResumeReviewPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');

  const review = useMutation({
    mutationFn: () =>
      resumeApi.reviewResume({
        userId: user?.id as string,
        resumeText,
        targetRole: targetRole.trim() || undefined,
      }),
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Could not review the resume.';
      toast.error(message);
    },
  });

  const analysis: ResumeAnalysis = review.data?.analysis ?? {};
  const hasResume = resumeText.trim().length > 0;

  const startInterview = () => {
    // Carried in navigation state rather than the query string: a resume is
    // long and personal, and query strings land in history and server logs.
    navigate('/interview', {
      state: { resumeText, type: 'resume_deep_dive' },
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <Seo
        title="Resume review"
        description="Get your resume analysed, then interview on it."
      />

      <div>
        <h1 className="text-2xl font-bold">Resume review</h1>
        <p className="text-sm text-muted-foreground">
          See how your resume reads, then get interviewed on what&rsquo;s in it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSearch className="size-4 text-primary" />
            Your resume
          </CardTitle>
          <CardDescription>
            Upload a PDF or .docx and we&rsquo;ll read it — no copying and pasting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResumePicker onTextChange={setResumeText} />

          <div className="space-y-1.5">
            <Label htmlFor="targetRole">
              Target role <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="targetRole"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Senior Backend Engineer"
            />
            <p className="text-xs text-muted-foreground">
              The review is sharper when it knows what you&rsquo;re aiming at.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => review.mutate()}
              disabled={!hasResume || review.isPending}
              className="gap-2"
            >
              {review.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileSearch className="size-4" />
              )}
              Review my resume
            </Button>

            {/* Available without a review: the analysis is an offer, not a gate. */}
            <Button variant="outline" onClick={startInterview} disabled={!hasResume} className="gap-2">
              Skip to interview
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {review.isPending && (
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Loader2 className="size-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Reading your resume — this takes a few seconds.
            </p>
          </CardContent>
        </Card>
      )}

      {review.isSuccess && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What we found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {(typeof analysis.overallScore === 'number' ||
              typeof analysis.atsCompatibility === 'number') && (
              <div className="flex flex-wrap gap-3">
                {typeof analysis.overallScore === 'number' && (
                  <ScoreRing label="Overall" score={analysis.overallScore} />
                )}
                {typeof analysis.atsCompatibility === 'number' && (
                  <ScoreRing label="ATS readability" score={analysis.atsCompatibility} />
                )}
              </div>
            )}

            <PointList
              title="Strengths"
              points={analysis.strengths ?? []}
              icon={ThumbsUp}
              tone="text-emerald-500"
            />
            <PointList
              title="Weaknesses"
              points={analysis.weaknesses ?? []}
              icon={TriangleAlert}
              tone="text-amber-500"
            />
            <PointList
              title="Suggestions"
              points={analysis.suggestions ?? []}
              icon={Lightbulb}
              tone="text-primary"
            />
            <PointList
              title="Gaps"
              points={analysis.contentGaps ?? []}
              icon={CircleAlert}
              tone="text-rose-500"
            />

            {/* The agent also returns prose. It is shown when the structured
                analysis came back empty, so a model that answered in text
                rather than JSON still produces something useful instead of a
                blank card. */}
            {Object.keys(analysis).length === 0 && review.data?.review && (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {review.data.review}
              </p>
            )}

            <div className="border-t border-border pt-4">
              <Button onClick={startInterview} size="lg" className="w-full gap-2">
                Start an interview on this resume
                <ArrowRight className="size-4" />
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Questions are drawn from your own projects and the tools you listed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
