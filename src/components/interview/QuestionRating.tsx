// src/components/interview/QuestionRating.tsx
//
// FIX-3: Added `fromQuestionBank` prop (default false).
// When false, the widget renders nothing — no API call is ever made.
// The results page always passes false because InterviewSession questions
// are LLM-generated and never exist in QuestionBank.
// Only topic/company practice pages that serve real QuestionBank questions
// should pass fromQuestionBank={true}.

import { useState } from 'react';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useRateQuestion } from '@/hooks/useInterview';

interface QuestionRatingProps {
  questionId: string;
  compact?: boolean;
  /**
   * Set true only when the questionId is a QuestionBank.id (e.g. topic/company practice).
   * For InterviewSession results (LLM-generated questions) leave false or omit.
   * Default: false — renders nothing, no API call made.
   */
  fromQuestionBank?: boolean;
}

const LABELS = ['Too easy', 'Easy', 'Just right', 'Hard', 'Too hard'];

export function QuestionRating({
  questionId,
  compact = false,
  fromQuestionBank = false,
}: QuestionRatingProps) {
  // Guard first — no render, no API call, no errors
  if (!fromQuestionBank) return null;

  return <QuestionRatingInner questionId={questionId} compact={compact} />;
}

// Inner component only mounts when fromQuestionBank is true
function QuestionRatingInner({
  questionId,
  compact,
}: {
  questionId: string;
  compact: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const rateQuestion = useRateQuestion();

  const submitRating = (rating: number, commentText?: string) => {
    rateQuestion.mutate(
      { questionId, rating, comment: commentText || undefined },
      {
        onSuccess: () => setSubmitted(true),
        onError: () => {
          setSelected(0);
          setShowComment(false);
        },
      },
    );
  };

  const handleRate = (rating: number) => {
    if (submitted) return;
    setSelected(rating);
    if (!compact) {
      setShowComment(true);
    } else {
      submitRating(rating);
    }
  };

  const handleSubmitWithComment = () => {
    if (!selected) return;
    submitRating(selected, comment || undefined);
    setShowComment(false);
  };

  if (submitted) {
    return (
      <div className='flex items-center gap-1.5 text-xs text-green-400'>
        <CheckCircle2 className='size-3.5' />
        Rating submitted
      </div>
    );
  }

  const display = hovered || selected;

  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-1'>
        <span className='text-xs text-muted-foreground mr-1'>
          Rate difficulty:
        </span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type='button'
            onClick={() => handleRate(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            disabled={rateQuestion.isPending}
            className='transition-colors disabled:opacity-50'
            title={LABELS[n - 1]}
          >
            <Star
              className={cn(
                'size-4 transition-colors',
                n <= display
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground/40 hover:text-yellow-400/60',
              )}
            />
          </button>
        ))}
        {display > 0 && (
          <span className='ml-1 text-xs text-muted-foreground'>
            {LABELS[display - 1]}
          </span>
        )}
        {rateQuestion.isPending && (
          <Loader2 className='size-3.5 animate-spin text-muted-foreground ml-1' />
        )}
      </div>

      {showComment && !compact && (
        <div className='space-y-2 animate-fade-in'>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment (e.g. 'Ambiguous wording')"
            rows={2}
            className={cn(
              'w-full rounded-lg border border-border bg-card px-3 py-2 text-xs',
              'text-foreground placeholder:text-muted-foreground/50',
              'focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none',
            )}
          />
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={handleSubmitWithComment}
              disabled={rateQuestion.isPending}
              className={cn(
                'flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs',
                'font-medium text-primary-foreground hover:bg-primary/90',
                'disabled:opacity-50 transition-colors',
              )}
            >
              {rateQuestion.isPending && (
                <Loader2 className='size-3 animate-spin' />
              )}
              Submit Rating
            </button>
            <button
              type='button'
              onClick={() => {
                setShowComment(false);
                setSelected(0);
              }}
              className='rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors'
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
