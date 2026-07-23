// src/pages/resume/ResumeReviewPage.tsx
//
// Standalone Resume Review feature.
//
// Distinct from the pre-interview resume step at /interview/resume: this is a
// dedicated tool where a candidate submits their resume plus (optionally) a
// target role, experience level and a job description, and gets back a
// structured, actionable review — prioritised suggestions, ATS and
// job-description fit, keyword gaps, section-by-section feedback and concrete
// before/after rewrites — all saved to a history they can revisit.

import { useState } from 'react'
import {
  FileSearch, Loader2, Lightbulb, ThumbsUp, TriangleAlert, Sparkles,
  Target, ClipboardList, Trash2, History as HistoryIcon, ArrowLeft, Check, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Seo } from '@/components/common/Seo'
import { ResumePicker } from '@/components/interview/ResumePicker'
import { cn } from '@/lib/cn'
import { formatRelative } from '@/utils/formatters'
import {
  useResumeReviews, useResumeReview, useCreateResumeReview, useDeleteResumeReview,
} from '@/hooks/useResumeReview'
import type {
  ResumeReview, SuggestionPriority, SectionSeverity,
} from '@/types/resume-review'

// ── helpers ──────────────────────────────────────────────────────────────

function scoreTone(score: number): string {
  if (score >= 75) return 'text-emerald-500'
  if (score >= 50) return 'text-amber-500'
  return 'text-rose-500'
}

function ScoreRing({ label, score }: { label: string; score: number | null | undefined }) {
  const has = score !== null && score !== undefined
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border/60 px-6 py-4 min-w-28">
      <span className={cn('text-3xl font-bold tabular-nums', has ? scoreTone(score as number) : 'text-muted-foreground')}>
        {has ? score : '—'}
      </span>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  )
}

const PRIORITY_STYLES: Record<SuggestionPriority, string> = {
  high: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  low: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
}

const SEVERITY_STYLES: Record<SectionSeverity, string> = {
  critical: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  good: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
}

// ── page ─────────────────────────────────────────────────────────────────

export default function ResumeReviewPage() {
  const [resumeText, setResumeText] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const createReview = useCreateResumeReview()
  const { data: historical } = useResumeReview(activeId)

  // The freshly created review takes precedence; otherwise show a selected
  // historical one, if any.
  const review: ResumeReview | undefined = createReview.data ?? historical

  const canSubmit = resumeText.trim().length >= 50 && !createReview.isPending

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error('Add your resume (paste or upload) before running a review.')
      return
    }
    setActiveId(null)
    createReview.mutate(
      {
        resumeText: resumeText.trim(),
        targetRole: targetRole.trim() || undefined,
        experienceLevel: experienceLevel.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
      },
      {
        onSuccess: () => toast.success('Resume review ready'),
        onError: (e: unknown) =>
          toast.error(e instanceof Error ? e.message : 'Failed to review resume'),
      },
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6">
      <Seo title="Resume Review" description="Get AI-powered, job-tailored feedback on your resume." />

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <FileSearch className="size-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resume Review</h1>
          <p className="text-sm text-muted-foreground">
            Tailored suggestions to improve your resume for a role and job description.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <div className="space-y-6 min-w-0">
          {/* Input form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="size-4" /> Your resume &amp; target
              </CardTitle>
              <CardDescription>
                Paste or upload your resume. Add a role, experience level and job description for sharper, tailored feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResumePicker onTextChange={setResumeText} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="role" className="flex items-center gap-1.5">
                    <Target className="size-3.5" /> Target role
                  </Label>
                  <Input id="role" value={targetRole} placeholder="e.g. Senior Backend Engineer"
                    onChange={(e) => setTargetRole(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="exp" className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5" /> Experience level
                  </Label>
                  <Input id="exp" value={experienceLevel} placeholder="e.g. 4 years / Mid-level"
                    onChange={(e) => setExperienceLevel(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="jd">Job description <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea id="jd" value={jobDescription} rows={6}
                  placeholder="Paste the job description to see how well your resume matches it and which keywords are missing…"
                  onChange={(e) => setJobDescription(e.target.value)} />
              </div>

              <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full sm:w-auto">
                {createReview.isPending
                  ? <><Loader2 className="size-4 animate-spin" /> Reviewing…</>
                  : <><FileSearch className="size-4" /> Review my resume</>}
              </Button>
            </CardContent>
          </Card>

          {/* Result */}
          {createReview.isPending && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analysing your resume against the role and job description…</p>
              </CardContent>
            </Card>
          )}

          {review && !createReview.isPending && <ReviewResult review={review} />}

          {!review && !createReview.isPending && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <FileSearch className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Your review will appear here.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* History sidebar */}
        <HistoryPanel
          activeId={activeId}
          liveReviewId={createReview.data?.id ?? null}
          onSelect={(id) => { createReview.reset(); setActiveId(id) }}
        />
      </div>
    </div>
  )
}

// ── result ───────────────────────────────────────────────────────────────

function ReviewResult({ review }: { review: ResumeReview }) {
  const hasJd = review.jdMatchScore !== null && review.jdMatchScore !== undefined
  return (
    <div className="space-y-5">
      {/* Scores + summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
          {review.targetRole && (
            <CardDescription>
              For <span className="text-foreground font-medium">{review.targetRole}</span>
              {review.experienceLevel ? ` · ${review.experienceLevel}` : ''}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <ScoreRing label="Overall" score={review.overallScore} />
            <ScoreRing label="ATS friendliness" score={review.atsScore} />
            <ScoreRing label="Job match" score={hasJd ? review.jdMatchScore : null} />
          </div>
          {review.summary && <p className="text-sm text-foreground leading-relaxed">{review.summary}</p>}
        </CardContent>
      </Card>

      {/* Prioritised suggestions */}
      {review.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="size-4 text-amber-500" /> How to improve
            </CardTitle>
            <CardDescription>Prioritised, most impactful first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {review.suggestions.map((s, i) => (
              <div key={i} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize', PRIORITY_STYLES[s.priority] ?? PRIORITY_STYLES.low)}>
                    {s.priority}
                  </span>
                  <span className="text-sm font-medium text-foreground">{s.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{s.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Strengths & weaknesses */}
      {(review.strengths.length > 0 || review.weaknesses.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {review.strengths.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ThumbsUp className="size-4 text-emerald-500" /> Strengths</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground"><Check className="size-4 text-emerald-500 shrink-0 mt-0.5" /> {s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {review.weaknesses.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TriangleAlert className="size-4 text-amber-500" /> Weaknesses</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.weaknesses.map((w, i) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground"><X className="size-4 text-rose-500 shrink-0 mt-0.5" /> {w}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Keyword match (JD) */}
      {hasJd && (review.matchedKeywords.length > 0 || review.missingKeywords.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Job description keywords</CardTitle>
            <CardDescription>Skills the posting emphasises, matched against your resume.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {review.missingKeywords.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Missing — add these if they apply</p>
                <div className="flex flex-wrap gap-1.5">
                  {review.missingKeywords.map((k, i) => (
                    <Badge key={i} className="bg-rose-500/10 text-rose-500 border-rose-500/20">{k}</Badge>
                  ))}
                </div>
              </div>
            )}
            {review.matchedKeywords.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Present</p>
                <div className="flex flex-wrap gap-1.5">
                  {review.matchedKeywords.map((k, i) => (
                    <Badge key={i} variant="secondary" className="text-emerald-600 dark:text-emerald-400">{k}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section feedback */}
      {review.sectionFeedback.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Section-by-section</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {review.sectionFeedback.map((sf, i) => (
              <div key={i} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize', SEVERITY_STYLES[sf.severity] ?? SEVERITY_STYLES.warning)}>
                    {sf.severity}
                  </span>
                  <span className="text-sm font-medium text-foreground">{sf.section}</span>
                </div>
                <p className="text-sm text-muted-foreground">{sf.feedback}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rewrite examples */}
      {review.rewriteExamples.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suggested rewrites</CardTitle>
            <CardDescription>Concrete before/after edits you can apply.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {review.rewriteExamples.map((r, i) => (
              <div key={i} className="rounded-lg border border-border/60 p-3 space-y-2">
                {r.section && <p className="text-xs font-medium text-muted-foreground">{r.section}</p>}
                <div className="rounded-md bg-rose-500/5 border border-rose-500/15 px-3 py-2">
                  <p className="text-xs font-medium text-rose-500 mb-0.5">Before</p>
                  <p className="text-sm text-foreground">{r.original}</p>
                </div>
                <div className="rounded-md bg-emerald-500/5 border border-emerald-500/15 px-3 py-2">
                  <p className="text-xs font-medium text-emerald-500 mb-0.5">After</p>
                  <p className="text-sm text-foreground">{r.improved}</p>
                </div>
                {r.rationale && <p className="text-xs text-muted-foreground">💡 {r.rationale}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Content gaps & formatting */}
      {(review.contentGaps.length > 0 || review.formattingIssues.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {review.contentGaps.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Content gaps</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {review.contentGaps.map((c, i) => <li key={i} className="text-sm text-muted-foreground">• {c}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}
          {review.formattingIssues.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Formatting issues</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {review.formattingIssues.map((f, i) => <li key={i} className="text-sm text-muted-foreground">• {f}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// ── history ──────────────────────────────────────────────────────────────

function HistoryPanel({
  activeId, liveReviewId, onSelect,
}: {
  activeId: string | null
  liveReviewId: string | null
  onSelect: (id: string | null) => void
}) {
  const { data: history, isLoading } = useResumeReviews()
  const deleteReview = useDeleteResumeReview()

  return (
    <Card className="h-fit lg:sticky lg:top-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <HistoryIcon className="size-4" /> History
        </CardTitle>
        <CardDescription>Your past reviews.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
        ) : !history?.length ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No reviews yet.</p>
        ) : (
          history.map((h) => {
            const selected = h.id === activeId || h.id === liveReviewId
            return (
              <div key={h.id}
                className={cn(
                  'group rounded-lg border p-2.5 cursor-pointer transition-colors',
                  selected ? 'border-primary/50 bg-primary/5' : 'border-border/60 hover:bg-muted/40',
                )}
                onClick={() => onSelect(h.id)}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {h.targetRole || 'General review'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteReview.mutate(h.id, {
                        onSuccess: () => { if (selected) onSelect(null); toast.success('Review deleted') },
                      })
                    }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500 transition">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn('text-xs font-bold tabular-nums', scoreTone(h.overallScore))}>{h.overallScore}</span>
                  <span className="text-xs text-muted-foreground">overall</span>
                  <span className="text-xs text-muted-foreground ml-auto">{formatRelative(h.createdAt)}</span>
                </div>
              </div>
            )
          })
        )}
        {(activeId || liveReviewId) && (
          <>
            <Separator className="my-2" />
            <Button variant="ghost" size="sm" className="w-full" onClick={() => onSelect(null)}>
              <ArrowLeft className="size-3.5" /> New review
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
