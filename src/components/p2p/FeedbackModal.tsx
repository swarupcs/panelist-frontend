import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (technicalRating: number, communicationRating: number, feedback: string) => void;
}

export function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps) {
  const [technicalRating, setTechnicalRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    if (technicalRating === 0 || communicationRating === 0 || !feedback.trim()) {
      return; // Could show toast error here
    }
    onSubmit(technicalRating, communicationRating, feedback);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Interview Complete!</DialogTitle>
          <DialogDescription>
            Please provide constructive feedback for your peer. This helps everyone improve.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Technical Skills Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={`tech-${star}`}
                  type="button"
                  onClick={() => setTechnicalRating(star)}
                  className="focus:outline-none transition-colors"
                >
                  <Star className={cn("h-6 w-6", star <= technicalRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Communication Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={`comm-${star}`}
                  type="button"
                  onClick={() => setCommunicationRating(star)}
                  className="focus:outline-none transition-colors"
                >
                  <Star className={cn("h-6 w-6", star <= communicationRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback">Written Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="What did they do well? What could they improve?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Skip</Button>
          <Button onClick={handleSubmit} disabled={technicalRating === 0 || communicationRating === 0 || !feedback.trim()}>
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
