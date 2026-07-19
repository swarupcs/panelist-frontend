// src/pages/auth/OAuthCallbackPage.tsx
//
// Where Google (and GitHub) sign-in lands.
//
// The backend finishes OAuth, sets the httpOnly refresh cookie, and redirects
// to /auth/callback?accessToken=...&isNewUser=... — but this route did not
// exist, so a successful sign-in dead-ended on a 404 with an access token
// sitting in the address bar.
//
// This page exchanges those parameters for a real session and gets the token
// out of the URL. It is deliberately not a GuestRoute child: an authenticated
// GuestRoute redirects to /dashboard, and by the time the store updates that
// would race this component before it can route a new user to onboarding.

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Brain, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authApi } from '@/api/auth.api';
import { setAccessToken } from '@/api/access-token';
import { useAuthStore } from '@/store/authStore';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [failed, setFailed] = useState(false);

  // Captured once, at mount. The effect below strips the token from the URL,
  // so reading these later would find them gone — and a missing token has to
  // be distinguishable from one this component already consumed.
  const [handoff] = useState(() => ({
    accessToken: searchParams.get('accessToken'),
    isNewUser: searchParams.get('isNewUser') === 'true',
  }));

  // React StrictMode double-invokes effects in development. Without this the
  // exchange runs twice, and the second run navigates on top of the first.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    // Arriving without a token is rendered directly rather than by setting
    // state here — a synchronous setState inside an effect triggers a second
    // render pass for something already knowable during the first.
    if (!handoff.accessToken) return;
    started.current = true;

    const { accessToken, isNewUser } = handoff;

    // Strip the token from the URL before anything else. It would otherwise
    // stay in browser history and be sent as a Referer to any third party the
    // next page talks to — the same reasoning that keeps the refresh token in
    // a cookie rather than a query string. replaceState leaves no history
    // entry, so Back cannot return to the URL that carried it.
    window.history.replaceState({}, '', '/auth/callback');

    (async () => {
      try {
        // The token has to be readable by the API client before /auth/me is
        // called, since that request is what authenticates it.
        setAccessToken(accessToken);

        const { user } = await authApi.me();

        // expiresIn is not in the redirect and is not worth adding: it would
        // put more of the credential's shape in the URL, and the client
        // recovers from expiry by refreshing against the cookie regardless.
        setAuth(user, { accessToken, refreshToken: '', expiresIn: 0 });

        navigate(isNewUser ? '/onboarding' : '/dashboard', { replace: true });
      } catch {
        // A token that /auth/me rejects is not a session. Clear it rather than
        // leaving a half-signed-in state that fails on the next request.
        setAccessToken(null);
        setFailed(true);
      }
    })();
  }, [handoff, navigate, setAuth]);

  if (failed || !handoff.accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 space-y-2">
            <TriangleAlert className="size-8 text-destructive mx-auto" />
            <p className="text-sm font-medium text-foreground">Sign-in didn&rsquo;t complete</p>
            <p className="text-xs text-muted-foreground">
              We couldn&rsquo;t finish signing you in. This usually means the link expired
              — signing in again should work.
            </p>
          </div>
          <Link to="/login">
            <Button className="w-full">Back to sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-4">
      <div className="flex size-12 items-center justify-center rounded-2xl gradient-primary shadow-lg glow-primary animate-pulse">
        <Brain className="size-6 text-white" />
      </div>
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  );
}
