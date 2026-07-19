import { describe, expect, it } from 'vitest';
import { isCredentialRejection, RESTORE_BACKOFF_MS } from './auth-failure';

describe('isCredentialRejection', () => {
  it('treats 401 as a real rejection', () => {
    expect(isCredentialRejection({ response: { status: 401 } })).toBe(true);
  });

  it('treats 403 as a real rejection', () => {
    expect(isCredentialRejection({ response: { status: 403 } })).toBe(true);
  });

  // The case that signed people out on every backend restart. Axios reports a
  // refused connection with no `response` at all, which the old code caught
  // alongside a genuine 401 and acted on identically.
  it('does not treat an unreachable server as a rejection', () => {
    expect(isCredentialRejection({ code: 'ERR_NETWORK', message: 'Network Error' })).toBe(false);
    expect(isCredentialRejection({ code: 'ECONNABORTED', message: 'timeout of 30000ms exceeded' })).toBe(false);
    expect(isCredentialRejection(new Error('Network Error'))).toBe(false);
  });

  // A server that is up but broken has not judged the credential either. It
  // may well be failing precisely because it cannot reach its own database.
  it('does not treat a server error as a rejection', () => {
    expect(isCredentialRejection({ response: { status: 500 } })).toBe(false);
    expect(isCredentialRejection({ response: { status: 502 } })).toBe(false);
    expect(isCredentialRejection({ response: { status: 503 } })).toBe(false);
  });

  it('survives a malformed error without throwing', () => {
    expect(isCredentialRejection(undefined)).toBe(false);
    expect(isCredentialRejection(null)).toBe(false);
    expect(isCredentialRejection('boom')).toBe(false);
    expect(isCredentialRejection({ response: {} })).toBe(false);
  });
});

describe('RESTORE_BACKOFF_MS', () => {
  it('outlasts a development server restart', () => {
    const total = RESTORE_BACKOFF_MS.reduce((a, b) => a + b, 0);
    // ts-node needs a few seconds to come back up. Retrying for less than that
    // would restore the old behaviour with extra steps.
    expect(total).toBeGreaterThanOrEqual(5000);
  });

  it('backs off rather than hammering a server that is trying to start', () => {
    for (let i = 1; i < RESTORE_BACKOFF_MS.length; i++) {
      expect(RESTORE_BACKOFF_MS[i]).toBeGreaterThan(RESTORE_BACKOFF_MS[i - 1]);
    }
  });
});
