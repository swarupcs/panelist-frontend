import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Loader2, EyeOff, Shield } from 'lucide-react';
import api from '@/api/axios';

interface ShareScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export function ShareScorecardModal({ isOpen, onClose, sessionId }: ShareScorecardModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Form State
  const [isBlindMode, setIsBlindMode] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<string>('never');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setShareUrl('');
    setCopied(false);

    try {
      // Goes through the shared client rather than raw fetch. That reads
      // process.env, which does not exist in the browser under Vite — the URL
      // silently fell back to localhost:3000 and the request never reached the
      // API. It also attaches the access token and retries once on 401, neither
      // of which a bare fetch does.
      const { data } = await api.post(`/share/generate/${sessionId}`, {
        isBlindMode,
        password: password || undefined,
        expiresInDays: expiresInDays === 'never' ? undefined : parseInt(expiresInDays, 10),
      });

      setShareUrl(data.data.url);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ??
          err?.message ??
          'Failed to generate link',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Share Scorecard</DialogTitle>
          <DialogDescription>
            Create a secure public link to share your interview results.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          <div className='space-y-4'>
            {/* Blind Mode */}
            <div className='flex items-center justify-between rounded-lg border p-4'>
              <div className='space-y-0.5'>
                <Label className='flex items-center gap-2'>
                  <EyeOff className='size-4 text-muted-foreground' />
                  Blind Review Mode
                </Label>
                <p className='text-xs text-muted-foreground'>
                  Hide your name, email, and photo from the shared scorecard to reduce bias.
                </p>
              </div>
              <Switch checked={isBlindMode} onCheckedChange={setIsBlindMode} />
            </div>

            {/* Password Protection */}
            <div className='space-y-2'>
              <Label className='flex items-center gap-2'>
                <Shield className='size-4 text-muted-foreground' />
                Password Protection (Optional)
              </Label>
              <Input
                type='password'
                placeholder='Leave blank for open access'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Expiration */}
            <div className='space-y-2'>
              <Label>Link Expiration</Label>
              <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                <SelectTrigger>
                  <SelectValue placeholder='Select expiration' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='7'>7 Days</SelectItem>
                  <SelectItem value='30'>30 Days</SelectItem>
                  <SelectItem value='never'>Never Expires</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className='text-sm text-red-500'>{error}</p>}

          {!shareUrl ? (
            <Button className='w-full' onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating && <Loader2 className='mr-2 size-4 animate-spin' />}
              Generate Secure Link
            </Button>
          ) : (
            <div className='space-y-3 pt-4 border-t'>
              <Label>Your Share Link</Label>
              <div className='flex gap-2'>
                <Input value={shareUrl} readOnly className='flex-1' />
                <Button variant='outline' onClick={handleCopy} className='shrink-0'>
                  {copied ? <CheckCircle className='size-4 text-green-500' /> : <Copy className='size-4' />}
                  <span className='sr-only'>Copy</span>
                </Button>
              </div>
              <p className='text-xs text-muted-foreground text-center'>
                Anyone with this link {password ? 'and password ' : ''}can view this scorecard.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Needed CheckCircle import above
import { CheckCircle } from 'lucide-react';
