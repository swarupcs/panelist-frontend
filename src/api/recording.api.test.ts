// Tests for chunk upload retry.
//
// Chunks are uploaded during the interview and appended server-side to a
// single file. Before this, one failed request silently dropped those seconds
// of recording — the failure was counted and never shown to anyone, so a
// candidate could finish an assessment whose recording had holes in it and
// nobody would know until a recruiter watched it.
//
// The classification is the part worth pinning. Retrying too little loses
// recording to a momentary blip; retrying too much holds up every chunk queued
// behind it, each one sitting in memory as a Blob, in the middle of an
// interview.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const post = vi.fn();
vi.mock('./axios', () => ({ default: { post: (...a: unknown[]) => post(...a) } }));

import { recordingApi } from './recording.api';

/** An axios-shaped failure with an HTTP status. */
const httpError = (status: number) => ({ response: { status } });

/** A failure with no response at all — offline, DNS, connection reset. */
const networkError = () => Object.assign(new Error('Network Error'), { response: undefined });

const chunk = new Blob(['data']);

beforeEach(() => {
  post.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/**
 * Run an upload and let its backoff elapse instantly.
 *
 * The retry loop awaits a real setTimeout between attempts. Left alone the
 * suite would sit through every backoff — seconds of wall clock for logic that
 * has none. runAllTimersAsync drains the chained timers while the upload
 * promise is still pending, so the test measures the behaviour rather than the
 * delay.
 */
async function uploadFlushingBackoff(recordingId: string, blob: Blob): Promise<void> {
  const pending = recordingApi.uploadChunk(recordingId, blob);
  // Attach a no-op catch first: a rejection that settles before the awaits
  // below would otherwise surface as an unhandled rejection.
  const settled = pending.then(
    () => ({ ok: true }) as const,
    (error: unknown) => ({ ok: false, error }) as const,
  );

  await vi.runAllTimersAsync();

  const result = await settled;
  if (!result.ok) throw result.error;
}

describe('uploadChunk', () => {
  it('sends the chunk once when it succeeds', async () => {
    post.mockResolvedValue({ data: {} });

    await uploadFlushingBackoff('rec-1', chunk);

    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][0]).toBe('/interview/recordings/rec-1/chunk');
  });

  it('retries a network failure and succeeds on a later attempt', async () => {
    // The case this exists for: a moment of wifi, not a broken request.
    post.mockRejectedValueOnce(networkError()).mockResolvedValueOnce({ data: {} });

    await uploadFlushingBackoff('rec-1', chunk);

    expect(post).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['500 server error', 500],
    ['502 bad gateway', 502],
    ['503 unavailable', 503],
    ['408 request timeout', 408],
    ['429 rate limited', 429],
  ])('retries on %s', async (_label, status) => {
    post.mockRejectedValueOnce(httpError(status)).mockResolvedValueOnce({ data: {} });

    await uploadFlushingBackoff('rec-1', chunk);

    expect(post).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['413 chunk too large', 413],
    ['409 recording already finished', 409],
    ['404 recording not found', 404],
    ['401 unauthenticated', 401],
    ['400 malformed', 400],
  ])('does NOT retry on %s', async (_label, status) => {
    // These fail identically every time. Retrying delays the inevitable and
    // holds up every chunk behind this one.
    post.mockRejectedValue(httpError(status));

    await expect(uploadFlushingBackoff('rec-1', chunk)).rejects.toBeDefined();

    expect(post).toHaveBeenCalledTimes(1);
  });

  it('gives up after a bounded number of attempts', async () => {
    // Unbounded retry would stall the upload chain indefinitely while chunks
    // accumulate in memory behind it.
    post.mockRejectedValue(networkError());

    await expect(uploadFlushingBackoff('rec-1', chunk)).rejects.toBeDefined();

    expect(post).toHaveBeenCalledTimes(3);
  });

  it('throws the last error so the caller can count the loss', async () => {
    // The caller decides what a lost chunk means — this only decides whether
    // to try again. Swallowing it here would hide the gap entirely.
    const failure = httpError(500);
    post.mockRejectedValue(failure);

    await expect(uploadFlushingBackoff('rec-1', chunk)).rejects.toBe(failure);
  });

  it('sends the chunk as raw bytes, not multipart', async () => {
    // MediaRecorder produces a Blob every few seconds for the length of an
    // interview; form encoding would add overhead to every one.
    post.mockResolvedValue({ data: {} });

    await uploadFlushingBackoff('rec-1', chunk);

    const [, body, config] = post.mock.calls[0];
    expect(body).toBe(chunk);
    expect((config as { headers: Record<string, string> }).headers['Content-Type']).toBe(
      'video/webm',
    );
  });
});
