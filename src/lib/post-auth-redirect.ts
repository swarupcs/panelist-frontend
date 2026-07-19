// src/lib/post-auth-redirect.ts
//
// Where to go after signing in.
//
// Everything used to land on /dashboard. That is right for someone who came to
// practise and wrong for someone who clicked an interview invitation: they
// arrive at a dashboard with no explanation, and the invitation they were
// trying to accept is simply gone.
//
// Deliberately narrow. This stores one path, set by the invitation page, and
// refuses anything that is not a same-origin path — a redirect target read
// from storage is an open-redirect waiting to happen if it accepts a URL.

const RETURN_KEY = 'panelist_invite_return';

/** Remember where to come back to. Called before sending someone to sign in. */
export function rememberReturnPath(path: string): void {
  sessionStorage.setItem(RETURN_KEY, path);
}

export function clearReturnPath(): void {
  sessionStorage.removeItem(RETURN_KEY);
}

/**
 * The path to send someone to now that they are signed in.
 *
 * Consumed on read: a stale return path surviving into the next sign-in would
 * send somebody to an invitation they already dealt with.
 */
export function takeReturnPath(fallback = '/dashboard'): string {
  const stored = sessionStorage.getItem(RETURN_KEY);
  clearReturnPath();

  if (!stored) return fallback;

  // Same-origin paths only. "//evil.example" and "https://evil.example" are
  // both valid values for a redirect and neither belongs here.
  if (!stored.startsWith('/') || stored.startsWith('//')) return fallback;

  return stored;
}
