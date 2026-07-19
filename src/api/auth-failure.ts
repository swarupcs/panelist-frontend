// src/api/auth-failure.ts
//
// Telling "your credential is bad" apart from "I could not ask".
//
// Both arrive here as a rejected promise, and treating them the same is what
// signed people out whenever the API restarted: the refresh call failed with
// ECONNREFUSED while the server was still booting, the catch block wiped the
// session, and a perfectly valid refresh cookie was thrown away. The user had
// done nothing wrong and neither had their credentials.
//
// Only the server gets to invalidate a session. A network error, a timeout or
// a 5xx says nothing about whether the cookie is still good — the question was
// never delivered. The only honest response to those is to ask again.

/** The server explicitly rejected the credential, rather than failing to answer. */
export function isCredentialRejection(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 401 || status === 403;
}

/**
 * Backoff for retrying a session restore, in milliseconds.
 *
 * Sized to outlast a development server restart — ts-node takes a few seconds
 * to come back — so that saving a backend file does not sign you out of the
 * tab you are testing in. It also covers a brief production blip, which would
 * otherwise sign out every active user at once.
 */
export const RESTORE_BACKOFF_MS = [500, 1000, 2000, 4000];

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
