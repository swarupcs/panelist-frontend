// src/components/profile/AccountSecurityCard.tsx
//
// Sign-in method: which OAuth provider is connected, setting a password, and
// disconnecting the provider.
//
// Connecting now works, so this offers it. It previously did not: the backend
// route was a stub that replied "linked successfully" without linking, and a
// button here would have told users their account was connected when nothing
// had happened.
//
// The connect buttons are full-page navigations, not fetches. Linking is an
// OAuth round trip through Google or GitHub, and the result comes back as a
// redirect to /profile carrying either ?linked= or ?linkError=.

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Check, KeyRound, Link as LinkIcon, Loader2, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
};

export function AccountSecurityCard() {
  const { user, setUser } = useAuthStore();
  const provider = (user as { oauthProvider?: string | null } | null)?.oauthProvider ?? null;

  const [searchParams, setSearchParams] = useSearchParams();
  const [linking, setLinking] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [settingPassword, setSettingPassword] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  // The API strips passwordHash, so the client cannot know whether a password
  // exists. This tracks it only within the session, to hide the form again
  // after it is set.
  const [passwordJustSet, setPasswordJustSet] = useState(false);

  // The link happens during a redirect, so the outcome arrives as a query
  // parameter. Reported once and then stripped, otherwise a refresh would
  // re-announce a link that happened minutes ago.
  useEffect(() => {
    const linked = searchParams.get('linked');
    const linkError = searchParams.get('linkError');
    if (!linked && !linkError) return;

    if (linked) {
      toast.success(`${PROVIDER_LABELS[linked] ?? linked} connected.`);
      // The stored user still says no provider is connected, so re-read it —
      // otherwise the card keeps offering to connect what was just connected.
      void authApi.me().then(({ user: fresh }) => setUser(fresh)).catch(() => {});
    } else if (linkError) {
      toast.error(linkError);
    }

    searchParams.delete('linked');
    searchParams.delete('linkError');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleConnect = async (target: 'google' | 'github') => {
    setLinking(target);
    try {
      const { url } = await authApi.startOAuthLink(target);
      // Leaves the app: the provider's consent screen has to render in the
      // browser and it redirects back here when it is done.
      window.location.href = url;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Could not start the connection.';
      toast.error(message);
      setLinking(null);
    }
  };

  const handleSetPassword = async () => {
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setSettingPassword(true);
    try {
      await authApi.setPassword(password);
      setPassword('');
      setPasswordJustSet(true);
      toast.success('Password set. You can now sign in with your email.');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Could not set the password.';
      toast.error(message);
    } finally {
      setSettingPassword(false);
    }
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      await authApi.unlinkOAuth();
      toast.success('Disconnected. Sign in with your email and password from now on.');
    } catch (err: unknown) {
      // The server refuses to unlink an account with no password, since that
      // would lock the user out entirely. Its message says so.
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Could not disconnect the account.';
      toast.error(message);
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sign-in method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">
              {provider ? `Connected to ${PROVIDER_LABELS[provider] ?? provider}` : 'Email and password'}
            </p>
            <p className="text-xs text-muted-foreground">
              {provider
                ? 'You currently sign in through this provider.'
                : 'You sign in with your email address.'}
            </p>
          </div>
          {provider && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnlink}
              disabled={unlinking}
              className="gap-2 shrink-0"
            >
              {unlinking ? <Loader2 className="size-3.5 animate-spin" /> : <Unlink className="size-3.5" />}
              Disconnect
            </Button>
          )}
        </div>

        {/* Only when nothing is connected. The schema holds one provider per
            account, so the server refuses a second one — offering a button
            that always fails would be worse than not offering it. */}
        {!provider && (
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-medium">Connect an account</p>
            <p className="text-xs text-muted-foreground">
              Sign in with one click next time. You can still use your password.
            </p>
            <div className="flex flex-wrap gap-2">
              {(['google', 'github'] as const).map((target) => (
                <Button
                  key={target}
                  variant="outline"
                  size="sm"
                  onClick={() => handleConnect(target)}
                  disabled={linking !== null}
                  className="gap-2"
                >
                  {linking === target ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <LinkIcon className="size-3.5" />
                  )}
                  {PROVIDER_LABELS[target]}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Offered whether or not a provider is connected: someone signed in
            through Google has no password at all, and the server will refuse to
            disconnect them until they set one. */}
        {passwordJustSet ? (
          <p className="flex items-center gap-2 text-sm text-emerald-500">
            <Check className="size-4" />
            Password set.
          </p>
        ) : (
          <div className="space-y-2 border-t border-border pt-4">
            <label htmlFor="new-password" className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="size-3.5" />
              {provider ? 'Set a password' : 'Change your password'}
            </label>
            {provider && (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <AlertCircle className="mt-0.5 size-3 shrink-0" />
                Needed before you can disconnect {PROVIDER_LABELS[provider] ?? provider} — otherwise
                you would have no way back in.
              </p>
            )}
            <div className="flex gap-2">
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              <Button
                onClick={handleSetPassword}
                disabled={settingPassword || password.length === 0}
                className="shrink-0 gap-2"
              >
                {settingPassword && <Loader2 className="size-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AccountSecurityCard;
