import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCrashCourse } from '@/hooks/useLearning';
import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function CrashCourseModal({
  topicId,
  topicTitle,
  isOpen,
  onClose,
}: {
  topicId: string | null;
  topicTitle: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data: crashCourse, isLoading, isError } = useCrashCourse(topicId!, isOpen && !!topicId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-xl flex items-center gap-2'>
            <span className='bg-primary/20 p-1 rounded'>📖</span> {topicTitle} Crash Course
          </DialogTitle>
        </DialogHeader>
        
        <div className='mt-4'>
          {isLoading ? (
            <div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
              <Loader2 className='size-8 animate-spin mb-4 text-primary' />
              <p>Generating personalized AI Crash Course...</p>
            </div>
          ) : isError ? (
            <div className='text-center py-8 text-red-500'>
              Failed to load the crash course. Please try again.
            </div>
          ) : (
            <div className='prose prose-invert prose-sm md:prose-base max-w-none 
              prose-headings:text-foreground prose-a:text-primary 
              prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded
              prose-pre:bg-secondary/50 prose-pre:border'>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {crashCourse || ''}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
