import { Seo } from '@/components/common/Seo';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Trophy, ShieldAlert, Loader2, Lock, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScoreRing } from '@/components/common';
import { formatInterviewType, formatDate, getDifficultyBadge } from '@/utils/formatters';

export default function PublicScorecardPage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);

  const fetchScorecard = async (pwd?: string) => {
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (pwd) headers['x-share-password'] = pwd;

      const res = await fetch(`${process.env.VITE_API_URL || 'http://localhost:3000'}/api/share/${token}`, { headers });
      const result = await res.json();

      if (!result.success) {
        setError(result.error);
      } else {
        setData(result.data);
      }
     
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError({ code: 'NETWORK_ERROR', message: 'Failed to load scorecard' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScorecard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background text-foreground'>
        <Loader2 className='size-8 animate-spin text-primary' />
      </div>
    );
  }

  // Password needed state
  if (error?.code === 'PASSWORD_REQUIRED' || error?.code === 'INVALID_PASSWORD') {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <div className='mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2'>
              <Lock className='size-6 text-primary' />
            </div>
            <CardTitle>Protected Scorecard</CardTitle>
            <p className='text-sm text-muted-foreground mt-2'>
              This interview scorecard is password protected.
            </p>
          </CardHeader>
          <CardContent className='space-y-4'>
            {error?.code === 'INVALID_PASSWORD' && (
              <p className='text-sm text-red-500 text-center'>Incorrect password, please try again.</p>
            )}
            <Input
              type='password'
              placeholder='Enter password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchScorecard(password)}
            />
            <Button className='w-full' onClick={() => fetchScorecard(password)}>
              View Results
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background p-4'>
        <div className='text-center space-y-4 max-w-md'>
          <ShieldAlert className='size-12 text-destructive mx-auto' />
          <h1 className='text-2xl font-bold'>Unavailable</h1>
          <p className='text-muted-foreground'>{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { session, isBlindMode } = data;
  const finalScore = Math.round(session.score ?? 0);

  return (
    <>
      {/* Indexing is off: the URL is the only access control on a shared
          scorecard, so it must not be discoverable through search. The og:
          tags still matter — they are what makes the link preview when a
          candidate shares their result. */}
      <Seo
        title={`Interview scorecard — ${finalScore}/100`}
        description={`${formatInterviewType(session.type)} interview on Panelist — scored ${finalScore} out of 100 with real code execution and AI assessment.`}
        path={`/scorecard/${token ?? ''}`}
        noIndex
      />
    <div className='min-h-screen bg-background text-foreground py-12 px-4'>
      <div className='max-w-3xl mx-auto space-y-8'>
        
        {/* Brand / Header */}
        <div className='flex items-center justify-between'>
          <div className='font-bold text-xl tracking-tight'>
            AI Interview <span className='text-primary'>Coach</span>
          </div>
          {isBlindMode && (
            <div className='flex items-center gap-1.5 text-xs font-medium text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full'>
              <EyeOff className='size-3' />
              Blind Review Active
            </div>
          )}
        </div>

        {/* Hero */}
        <Card className='border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden'>
          <CardContent className='p-8 flex flex-col md:flex-row items-center gap-8'>
            <div className='relative shrink-0'>
              <ScoreRing score={finalScore} size={140} />
              {finalScore >= 75 && (
                <Trophy className='absolute -top-2 -right-2 size-8 text-yellow-400' />
              )}
            </div>
            <div className='space-y-4 text-center md:text-left flex-1'>
              <div>
                <h1 className='text-3xl font-bold'>{session.user?.name || 'Candidate'}</h1>
                <p className='text-muted-foreground'>{formatInterviewType(session.type)} Interview</p>
              </div>
              <div className='flex flex-wrap gap-4 justify-center md:justify-start text-sm'>
                <div className='bg-secondary/50 rounded-lg px-3 py-1.5'>
                  <span className='text-muted-foreground block text-xs'>Completed</span>
                  <span className='font-medium'>{formatDate(session.startTime)}</span>
                </div>
                <div className='bg-secondary/50 rounded-lg px-3 py-1.5'>
                  <span className='text-muted-foreground block text-xs'>Questions</span>
                  <span className='font-medium'>{session.totalQuestions}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Feedback */}
        {session.feedback && (
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Overall AI Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='prose prose-sm prose-invert max-w-none'>
                <ReactMarkdown>{session.feedback}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions Breakdown */}
        <div className='space-y-4'>
          <h2 className='text-xl font-bold tracking-tight'>Detailed Breakdown</h2>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {session.questions.map((q: any, i: number) => (
            <Card key={q.id}>
              <CardContent className='p-6 space-y-4'>
                <div className='flex justify-between items-start gap-4'>
                  <div>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='text-sm font-semibold'>Question {i + 1}</span>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getDifficultyBadge(q.difficulty)}`}>
                        {q.difficulty || 'N/A'}
                      </span>
                    </div>
                    <p className='text-sm'>{q.question}</p>
                  </div>
                  <div className='shrink-0 text-right'>
                    <div className='text-xl font-bold text-primary'>{q.score ?? 0}<span className='text-sm text-muted-foreground'>/100</span></div>
                  </div>
                </div>

                <div className='grid md:grid-cols-2 gap-4 pt-4 border-t'>
                  <div className='space-y-2'>
                    <span className='text-xs font-semibold text-muted-foreground uppercase'>Candidate Answer</span>
                    <div className='text-sm bg-secondary/30 rounded-md p-3 max-h-48 overflow-y-auto whitespace-pre-wrap'>
                      {q.userAnswer || q.userCode || <span className='text-muted-foreground italic'>Skipped / No Answer</span>}
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <span className='text-xs font-semibold text-muted-foreground uppercase'>AI Evaluation</span>
                    <div className='text-sm prose prose-sm prose-invert max-w-none'>
                      <ReactMarkdown>{q.feedback || 'No feedback provided.'}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
    </>
  );
}
