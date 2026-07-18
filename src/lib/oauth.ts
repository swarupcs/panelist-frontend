// src/lib/oauth.ts
//
// Where the "Continue with Google/GitHub" links point.
//
// They were hardcoded to "/api/auth/google", a root-relative path. That
// resolves against whatever origin is serving the page — in development the
// Vite server on :5199, which has no /api — so the button 404'd rather than
// starting sign-in. It only looks correct in a deployment where the API is
// reverse-proxied under the same origin as the app.
//
// Deriving it from VITE_API_URL means the links follow the API wherever it
// lives, and the '/api' default preserves the same-origin proxy case.

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

export type OAuthProvider = 'google' | 'github';

/**
 * A full-page navigation, not fetch/XHR: the provider's consent screen has to
 * render in the browser, and the backend completes the flow with a redirect
 * back to /auth/callback.
 */
export function oauthUrl(provider: OAuthProvider): string {
  return `${API_BASE.replace(/\/$/, '')}/auth/${provider}`;
}
