// src/components/interview/RecordingPlayer.tsx
//
// Plays back a session recording in the recruiter view.
//
// Two paths, depending on where the recording is stored.
//
// In ImageKit, the server hands back a short-lived signed CDN URL after
// checking who is asking. That plays directly, so the browser can seek and
// stream rather than waiting for the whole file — which for an hour-long
// interview is the difference between usable and not. The link is forwardable
// until it expires, which is the trade for range support; the window is small.
//
// On local disk, the stream endpoint is authenticated and a <video src> does
// not send the Authorization header — the access token lives in memory, not a
// cookie. So the file is fetched with the header and played from a blob URL,
// at the cost of downloading it all before playback starts.

import { useEffect, useRef, useState } from 'react';
import { CircleAlert, Loader2, Trash2, Video, VideoOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import api from '@/api/axios';
import { recordingApi } from '@/api/recording.api';
import type { RecruiterDossier } from '@/types/panelist';

type Recording = NonNullable<RecruiterDossier['recording']>;

function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Video className="size-4 text-primary" />
          Session recording
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface RecordingPlayerProps {
  recording: Recording | null;
  /**
   * Whether the viewer is the person who was recorded. Only they may delete
   * it: a recruiter removing an assessment recording is a different act, and
   * the person the recording is of decides whether it exists.
   */
  canDelete?: boolean;
  onDeleted?: () => void;
}

export function RecordingPlayer({ recording, canDelete, onDeleted }: RecordingPlayerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  const handleDelete = async () => {
    if (!recording) return;
    setDeleting(true);
    try {
      await recordingApi.remove(recording.id);
      toast.success('Recording deleted.');
      onDeleted?.();
    } catch {
      toast.error('Could not delete the recording.');
      setDeleting(false);
    }
  };

  const playable = recording?.status === 'READY' || recording?.status === 'INTERRUPTED';

  useEffect(() => {
    if (!recording || !playable) return;
    let cancelled = false;

    (async () => {
      try {
        // Ask where to play from. A URL means the CDN can serve it directly.
        const { data } = await api.get(`/interview/recordings/${recording.id}/playback`);
        const signedUrl: string | null = data?.data?.url ?? null;

        if (cancelled) return;

        if (signedUrl) {
          setBlobUrl(signedUrl);
          return;
        }

        // Local disk: fetch with the header and play from a blob.
        const res = await api.get(recording.streamUrl.replace(/^\/api/, ''), {
          responseType: 'blob',
        });
        if (cancelled) return;

        const url = URL.createObjectURL(res.data as Blob);
        objectUrlRef.current = url;
        setBlobUrl(url);
      } catch {
        if (!cancelled) setError('The recording could not be loaded.');
      }
    })();

    return () => {
      cancelled = true;
      // Blob URLs pin the whole file in memory until revoked, and a recording
      // is large enough that leaking one per visit is noticeable.
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [recording, playable]);

  // Not recorded at all. Said plainly, because "no video" should not read as
  // something having gone wrong — declining is a normal choice.
  if (!recording) {
    return (
      <Shell>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <VideoOff className="size-4 shrink-0" />
          This session was not recorded.
        </div>
      </Shell>
    );
  }

  if (recording.status === 'FAILED') {
    return (
      <Shell>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <CircleAlert className="size-4 shrink-0 text-amber-500" />
          Recording was started but no video was captured.
        </div>
      </Shell>
    );
  }

  if (recording.status === 'RECORDING') {
    return (
      <Shell>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="size-2 animate-pulse rounded-full bg-rose-500" />
          This session is still being recorded.
        </div>
      </Shell>
    );
  }

  const duration = formatDuration(recording.durationSeconds);

  return (
    <Shell>
      <div className="space-y-3">
        {recording.status === 'INTERRUPTED' && (
          // The recruiter needs to know the video stops early for a technical
          // reason, not because the candidate walked out.
          <p className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-500">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
            Recording ended unexpectedly — a closed tab or lost connection. Everything
            captured up to that point is here.
          </p>
        )}

        {error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : blobUrl ? (
          <video
            src={blobUrl}
            controls
            className="w-full rounded-lg border border-border/60 bg-black"
            // No autoplay: a recruiter opening a dossier should not have audio
            // start on its own.
          />
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-border/60 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading the recording…
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {[duration, formatSize(recording.sizeBytes),
              `consent given ${new Date(recording.consentedAt).toLocaleString()}`]
              .filter(Boolean)
              .join(' · ')}
          </p>

          {/* The withdrawal side of consent. Confirmed inline rather than in a
              dialog, and the confirm button says what it does — this deletes
              the video itself, not a reference to it. */}
          {canDelete && (
            confirming ? (
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Delete permanently?</span>
                <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader2 className="size-3.5 animate-spin" /> : 'Delete'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={deleting}>
                  Keep
                </Button>
              </span>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirming(true)}
                className="gap-1.5 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Delete recording
              </Button>
            )
          )}
        </div>
      </div>
    </Shell>
  );
}

export default RecordingPlayer;
