// src/components/interview/DrawingCanvas.tsx
//
// Excalidraw canvas for the System Design track.
//
// On submit it captures the scene as JSON — elements plus a small slice of
// appState — and posts it to the session's drawing endpoint. The backend
// serialises the scene into a textual description (components, containment,
// arrow-resolved connections) and evaluates that, so what matters here is
// sending the structured scene rather than an image.
//
// The response includes `interpretedAs`: how the backend actually read the
// canvas. That is surfaced to the candidate deliberately — if a box was
// unlabelled or an arrow was not connected, the AI could not see it, and
// telling them so is more useful than a critique they cannot account for.

import { useCallback, useMemo, useRef, useState } from 'react';
// Excalidraw's stylesheet is imported once in main.tsx rather than here, so
// that every whiteboard in the app is styled regardless of which route loaded
// first. Do not add a local import back.
import { Excalidraw } from '@excalidraw/excalidraw';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Loader2,
  MessageCircleQuestion,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSubmitDrawing } from '@/hooks/usePanelist';
import type { SubmitDrawingResponse } from '@/types/panelist';

/**
 * Excalidraw's imperative handle — only the parts we use.
 *
 * Exported so the interview page can export the canvas as an image when the
 * candidate submits from a different tab, without reaching into Excalidraw's
 * own types or holding a second copy of the API.
 */
export interface ExcalidrawSnapshotApi {
  getSceneElements: () => readonly unknown[];
  getAppState: () => Record<string, unknown>;
  getFiles: () => Record<string, unknown>;
}

interface DrawingCanvasProps {
  sessionId: string;
  /** The design problem, passed through so the agent can ground its feedback. */
  question?: string;
  questionIndex?: number;
  /** Called after a successful evaluation, e.g. to advance the interview. */
  onEvaluated?: (result: SubmitDrawingResponse) => void;
  /**
   * Elements to open the canvas with — used to restore a previous submission
   * so a candidate can revise it rather than redraw from scratch.
   */
  initialElements?: readonly unknown[];
  /** Hands the canvas API to the parent, for exporting the scene elsewhere. */
  onApiReady?: (api: ExcalidrawSnapshotApi) => void;
  className?: string;
}

export function DrawingCanvas({
  sessionId,
  question,
  questionIndex,
  onEvaluated,
  initialElements,
  onApiReady,
  className,
}: DrawingCanvasProps) {
  const apiRef = useRef<ExcalidrawSnapshotApi | null>(null);
  const [explanation, setExplanation] = useState('');
  const [elementCount, setElementCount] = useState(0);
  const [result, setResult] = useState<SubmitDrawingResponse | null>(null);

  const submit = useSubmitDrawing(sessionId);

  // Excalidraw fires onChange on every pointer move while drawing, so this
  // only tracks the count for the empty-canvas guard rather than mirroring the
  // whole scene into React state.
  const handleChange = useCallback((elements: readonly unknown[]) => {
    setElementCount(elements.filter((el) => !(el as { isDeleted?: boolean }).isDeleted).length);
  }, []);

  const handleSubmit = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;

    const elements = api.getSceneElements();
    const appState = api.getAppState();

    // appState carries transient UI state (cursor position, open panels,
    // collaborators) that is large and meaningless server-side. Only the two
    // fields that describe the drawing itself are kept.
    const scene = {
      elements,
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor,
        gridSize: appState.gridSize,
      },
    };

    submit.mutate(
      { scene, explanation: explanation.trim() || undefined, question, questionIndex },
      {
        onSuccess: (data) => {
          setResult(data);
          onEvaluated?.(data);
        },
      },
    );
  }, [explanation, onEvaluated, question, questionIndex, submit]);

  const isEmpty = elementCount === 0;
  const errorMessage = useMemo(() => {
    if (!submit.isError) return null;
    const err = submit.error as { response?: { data?: { error?: { message?: string } } } };
    return err?.response?.data?.error?.message ?? 'Could not evaluate the drawing.';
  }, [submit.isError, submit.error]);

  return (
    <div className={cn('flex h-full flex-col gap-3', className)}>
      {question && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
          {question}
        </div>
      )}

      {/* Excalidraw manages its own sizing, so it needs a bounded parent. */}
      <div className="relative min-h-[380px] flex-1 overflow-hidden rounded-lg border border-border">
        <Excalidraw
          excalidrawAPI={(api: unknown) => {
            apiRef.current = api as ExcalidrawSnapshotApi;
            onApiReady?.(api as ExcalidrawSnapshotApi);
          }}
          onChange={handleChange}
          initialData={{
            elements: (initialElements ?? []) as never,
            appState: { viewBackgroundColor: '#ffffff' },
          }}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="design-explanation" className="text-sm font-medium">
          Explain your design{' '}
          <span className="text-muted-foreground">(optional, but it is scored)</span>
        </label>
        <textarea
          id="design-explanation"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={3}
          placeholder="Walk through the request path, where state lives, and the tradeoffs you made."
          className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {isEmpty
            ? 'Draw your architecture, then submit.'
            : `${elementCount} element${elementCount === 1 ? '' : 's'} on the canvas`}
        </span>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isEmpty || submit.isPending}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
            'bg-primary text-primary-foreground hover:opacity-90',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {submit.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Evaluating…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit design
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <span>{errorMessage}</span>
        </div>
      )}

      {result && <DrawingFeedback result={result} />}
    </div>
  );
}

function DrawingFeedback({ result }: { result: SubmitDrawingResponse }) {
  const { interpretedAs } = result;

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Interviewer feedback</h3>
        <span className="text-sm font-medium">{result.score}/100</span>
      </div>

      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
        {result.evaluation}
      </p>

      {result.followUp && (
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3">
          <MessageCircleQuestion className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Follow-up</p>
            <p className="text-sm">{result.followUp}</p>
          </div>
        </div>
      )}

      {(result.strengths.length > 0 || result.gaps.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {result.strengths.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Strengths</p>
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.gaps.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Gaps</p>
              <ul className="space-y-1">
                {result.gaps.map((g, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* What the AI actually saw. A component missing from this list was
          unlabelled or unconnected on the canvas — which is the real, fixable
          reason the feedback may look like it ignored part of the design. */}
      <details className="rounded-lg border border-border bg-muted/30 p-3">
        <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          How the interviewer read your diagram
        </summary>
        <div className="mt-2 space-y-2 text-sm">
          <div>
            <span className="text-xs text-muted-foreground">Components: </span>
            {interpretedAs.components.length > 0
              ? interpretedAs.components.join(', ')
              : 'none detected — unlabelled shapes cannot be identified'}
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Connections: </span>
            {interpretedAs.connections.length > 0
              ? interpretedAs.connections.join(', ')
              : 'none detected — arrows must touch the shapes they link'}
          </div>
        </div>
      </details>
    </div>
  );
}

export default DrawingCanvas;
