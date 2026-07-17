import { useState } from 'react'
import { BookOpen, CheckCircle2, Circle, ChevronDown, ChevronRight, Sparkles, Clock, RotateCcw } from 'lucide-react'
import { useLearningPath, useCompleteTopic, useDueReviews, useRecordReview, useRecommendations } from '@/hooks/useAnalytics'
import { PageHeader, LoadingScreen, ErrorState, EmptyState } from '@/components/common'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useGenerateLearningPath } from '@/hooks/useAnalytics'
import { formatDate, formatRelative } from '@/utils/formatters'
import { cn } from '@/lib/cn'

const ROLES = [
  { value: 'FRONTEND_DEVELOPER', label: 'Frontend Developer' },
  { value: 'BACKEND_DEVELOPER', label: 'Backend Developer' },
  { value: 'FULLSTACK_DEVELOPER', label: 'Full-Stack Developer' },
  { value: 'DSA_SPECIALIST', label: 'DSA Specialist' },
  { value: 'MOBILE_DEVELOPER', label: 'Mobile Developer' },
  { value: 'DEVOPS_ENGINEER', label: 'DevOps Engineer' },
]

const LEVELS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
]

function GeneratePathDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [role, setRole] = useState('')
  const [level, setLevel] = useState('')
  const generate = useGenerateLearningPath()

  const handleGenerate = () => {
    if (!role || !level) return
    generate.mutate({ targetRole: role, currentLevel: level }, { onSuccess: onClose })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Learning Path</DialogTitle>
          <DialogDescription>Configure your personalized learning path</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Target Role</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Current Level</label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger><SelectValue placeholder="Select level..." /></SelectTrigger>
              <SelectContent>
                {LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="gradient"
            className="w-full"
            onClick={handleGenerate}
            loading={generate.isPending}
            disabled={!role || !level}
          >
            Generate Path
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PhaseCard({ phase, index }: { phase: any; index: number }) {
  const [expanded, setExpanded] = useState(index === 0)
  const completeTopic = useCompleteTopic()
  const completedTopics = phase.topics?.filter((t: any) => t.isCompleted).length ?? 0
  const totalTopics = phase.topics?.length ?? 0
  const progress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0

  return (
    <Card className={cn(phase.isCompleted && 'opacity-75')}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
            phase.isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-primary/20 text-primary',
          )}>
            {phase.isCompleted ? <CheckCircle2 className="size-4" /> : phase.phaseNumber}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm">{phase.title}</p>
            <p className="text-xs text-muted-foreground">{completedTopics}/{totalTopics} topics · {phase.estimatedDays} days</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={progress} className="w-16 h-1.5 hidden sm:block" />
          {expanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <CardContent className="pt-0 space-y-2">
          {phase.topics?.map((topic: any) => (
            <div key={topic.id} className={cn(
              'flex items-center gap-3 rounded-lg p-3 transition-colors',
              topic.isCompleted ? 'bg-green-500/5' : 'hover:bg-secondary',
            )}>
              <button
                onClick={() => !topic.isCompleted && completeTopic.mutate(topic.id)}
                className="shrink-0"
                disabled={topic.isCompleted || completeTopic.isPending}
              >
                {topic.isCompleted
                  ? <CheckCircle2 className="size-5 text-green-400" />
                  : <Circle className="size-5 text-muted-foreground hover:text-primary transition-colors" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', topic.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground')}>
                  {topic.title}
                </p>
                <p className="text-xs text-muted-foreground">{topic.questionsToSolve} questions</p>
              </div>
              {topic.questionsSolved > 0 && (
                <span className="text-xs text-muted-foreground">{topic.questionsSolved}/{topic.questionsToSolve}</span>
              )}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  )
}

export default function LearningPage() {
  const [showGenerate, setShowGenerate] = useState(false)
  const { data: learningPath, isLoading, isError, refetch } = useLearningPath()
  const { data: reviewData } = useDueReviews()
  const { data: recommendations } = useRecommendations()
  const recordReview = useRecordReview()

  if (isLoading) return <LoadingScreen message="Loading learning path..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Learning Path"
        description="Your personalized interview preparation roadmap"
        action={
          <Button variant="gradient" size="sm" onClick={() => setShowGenerate(true)} className="gap-2">
            <Sparkles className="size-4" />
            {learningPath ? 'Regenerate' : 'Generate Path'}
          </Button>
        }
      />

      <GeneratePathDialog open={showGenerate} onClose={() => setShowGenerate(false)} />

      <Tabs defaultValue="path">
        <TabsList>
          <TabsTrigger value="path">Learning Path</TabsTrigger>
          <TabsTrigger value="reviews">
            Due Reviews
            {(reviewData?.stats?.dueForReview ?? 0) > 0 && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                {reviewData?.stats?.dueForReview}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="path" className="space-y-4">
          {!learningPath ? (
            <EmptyState
              icon={BookOpen}
              title="No learning path yet"
              description="Generate a personalized path based on your target role and skill level"
              action={
                <Button variant="gradient" onClick={() => setShowGenerate(true)} className="gap-2">
                  <Sparkles className="size-4" />
                  Generate Learning Path
                </Button>
              }
            />
          ) : (
            <>
              <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Target: {learningPath.targetRole?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground">Phase {learningPath.currentPhase} of {learningPath.totalPhases} · {learningPath.estimatedWeeks} weeks estimated</p>
                </div>
                <Progress
                  value={(learningPath.currentPhase / learningPath.totalPhases) * 100}
                  className="flex-1 h-2"
                />
              </div>
              {learningPath.phases?.map((phase: any, i: number) => (
                <PhaseCard key={phase.id} phase={phase} index={i} />
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          {reviewData?.stats && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Cards', value: reviewData.stats.totalCards },
                { label: 'Due Today', value: reviewData.stats.dueForReview, highlight: true },
                { label: 'Mastered', value: reviewData.stats.mastered },
              ].map(s => (
                <div key={s.label} className={cn('rounded-xl border p-3 text-center', s.highlight && 'border-primary/30 bg-primary/5')}>
                  <p className={cn('text-xl font-bold', s.highlight ? 'text-primary' : 'text-foreground')}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {!reviewData?.reviews?.length ? (
            <EmptyState icon={RotateCcw} title="No reviews due" description="Great! You're all caught up on your spaced repetition reviews." />
          ) : (
            <div className="space-y-3">
              {reviewData.reviews.map((item: any) => (
                <Card key={item.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.category}</p>
                        <p className="text-xs text-muted-foreground">Due: {formatRelative(item.nextReview)}</p>
                      </div>
                      <div className="flex gap-2">
                        {[0, 1, 3, 5].map(q => (
                          <button
                            key={q}
                            onClick={() => recordReview.mutate({ itemId: item.id, quality: q })}
                            className={cn(
                              'rounded px-2 py-1 text-xs font-medium transition-colors',
                              q === 0 ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' :
                              q === 1 ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20' :
                              q === 3 ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' :
                              'bg-green-500/10 text-green-400 hover:bg-green-500/20',
                            )}
                            title={['Blackout', 'Wrong', 'Hard', 'Easy'][[0,1,3,5].indexOf(q)]}
                          >
                            {['✗', '~', '✓', '★'][[0,1,3,5].indexOf(q)]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-3">
          {!recommendations?.length ? (
            <EmptyState icon={Sparkles} title="No recommendations yet" description="Complete more interviews to get personalized recommendations." />
          ) : (
            recommendations.map((rec: any) => (
              <Card key={rec.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-foreground">{rec.title}</p>
                        <Badge variant="outline" className="text-xs shrink-0">Priority {rec.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
