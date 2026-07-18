// src/api/access-token.ts
//
// The access token lives in memory, not in localStorage.
//
// Anything in localStorage is readable by any script the page loads, so a
// single compromised dependency can lift a credential out of it. Keeping the
// access token in a module variable means it is gone the moment the tab
// closes and it never sits in storage waiting to be read. It is also
// short-lived, so the worst case is a fifteen-minute window rather than the
// week a refresh token would give.
//
// The cost is that a page reload starts with no token. That is recovered by
// calling /auth/refresh, which authenticates with the httpOnly refresh cookie
// the browser sends automatically — see initAuth in the auth store.

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
}
