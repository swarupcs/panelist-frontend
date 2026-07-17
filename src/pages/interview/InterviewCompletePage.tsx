import { useParams, Link } from 'react-router-dom'
import { Trophy, RotateCcw, BarChart3, Home, CheckCircle, XCircle } from 'lucide-react'
import { useInterviewStore } from '@/store/interviewStore'
import { ScoreRing } from '@/components/common'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatInterviewType, formatScore, getDifficultyBadge } from '@/utils/formatters'
import { cn } from '@/lib/cn'

export default function InterviewCompletePage() {
  const { sessionId } = useParams()
  const { score, type, answers, totalQuestions, resetSession } = useInterviewStore()

  const finalScore = score ?? 0
  const answeredCount = Object.keys(answers).length
  const passedCount = Object.values(answers).filter(a => (a.score ?? 0) >= 60).length

  const getMessage = () => {
    if (finalScore >= 90) return { text: "Outstanding performance! 🎉", sub: "You're interview-ready!" }
    if (finalScore >= 75) return { text: "Great job! 👏", sub: "A few more sessions and you'll ace it." }
    if (finalScore >= 60) return { text: "Good effort! 💪", sub: "Keep practicing to improve." }
    return { text: "Keep going! 🔥", sub: "Every practice session makes you better." }
  }

  const { text, sub } = getMessage()

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Hero */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <ScoreRing score={finalScore} size={120} />
              {finalScore >= 75 && (
                <Trophy className="absolute -top-2 -right-2 size-6 text-yellow-400" />
              )}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">{text}</h1>
            <p className="text-muted-foreground mt-1">{sub}</p>
          </div>

          <div className="flex justify-center gap-8 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{answeredCount}</p>
              <p className="text-xs text-muted-foreground">Questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{passedCount}</p>
              <p className="text-xs text-muted-foreground">Passed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{answeredCount - passedCount}</p>
              <p className="text-xs text-muted-foreground">Needs Work</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/interview" onClick={resetSession}>
              <Button variant="gradient" size="lg" className="gap-2">
                <RotateCcw className="size-4" />
                Practice Again
              </Button>
            </Link>
            <Link to="/analytics">
              <Button variant="outline" size="lg" className="gap-2">
                <BarChart3 className="size-4" />
                View Analytics
              </Button>
            </Link>
            <Link to="/dashboard" onClick={resetSession}>
              <Button variant="ghost" size="lg" className="gap-2">
                <Home className="size-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Answer Breakdown */}
      {Object.entries(answers).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Answer Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(answers).map(([questionId, answer], i) => (
              <div key={questionId} className={cn(
                'rounded-lg border p-3 space-y-2',
                (answer.score ?? 0) >= 60 ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5',
              )}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {(answer.score ?? 0) >= 60
                      ? <CheckCircle className="size-4 text-green-400 shrink-0" />
                      : <XCircle className="size-4 text-red-400 shrink-0" />
                    }
                    <span className="text-sm font-medium text-foreground">Question {i + 1}</span>
                  </div>
                  <span className={cn('text-sm font-bold', (answer.score ?? 0) >= 60 ? 'text-green-400' : 'text-red-400')}>
                    {formatScore(answer.score)}
                  </span>
                </div>
                {answer.feedback && (
                  <p className="text-xs text-muted-foreground pl-6 leading-relaxed line-clamp-2">
                    {answer.feedback}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
