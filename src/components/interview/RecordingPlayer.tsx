// src/components/interview/RecordingPlayer.tsx
//
// Plays back a session recording in the recruiter view.
//
// The stream endpoint is authenticated, so the file cannot simply be set as a
// <video src>: a browser fetching a video does not attach the Authorization
// header, and the access token is held in memory rather than a cookie. The
// recording is fetched with the header, turned into a blob URL, and played
// from that.
//
// The cost is that playback waits for the whole file. That is acceptable here
// — a recruiter opens one recording deliberately — and the alternative, a
// signed URL, means a credential in a link that could be forwarded to someone
// who should not have it.

import { useEffect, useRef, useState } from 'react';
import { CircleAlert, Loader2, Video, VideoOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/api/axios';
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

export function RecordingPlayer({ recording }: { recording: Recording | null }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const playable = recording?.status === 'READY' || recording?.status === 'INTERRUPTED';

  useEffect(() => {
    if (!recording || !playable) return;
    let cancelled = false;

    (async () => {
      try {
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

        <p className="text-xs text-muted-foreground">
          {[duration, formatSize(recording.sizeBytes),
            `consent given ${new Date(recording.consentedAt).toLocaleString()}`]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
    </Shell>
  );
}

export default RecordingPlayer;
