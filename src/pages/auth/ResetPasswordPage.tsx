// src/pages/auth/ResetPasswordPage.tsx
//
// The page the password-reset email links to.
//
// It did not exist. The backend issued a token and mailed a link to
// /reset-password, the API route worked, and useResetPassword was already
// written — but the URL resolved to nothing, so the last step of account
// recovery was a dead end. This is the missing screen, not new functionality.

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Brain, Eye, EyeOff, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResetPassword } from '@/hooks/useAuth';

const schema = z
  .object({
    // Matches the eight characters the API enforces. A shorter minimum here
    // would send a request that is rejected server-side for a reason the form
    // could have explained immediately.
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = useState(false);
  const resetPassword = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    if (!token) return;
    resetPassword.mutate({ token, newPassword: data.newPassword });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl gradient-primary shadow-lg glow-primary">
            <Brain className="size-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Choose a new password</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Then sign in with your new password
            </p>
          </div>
        </div>

        {/* Someone who opens /reset-password directly, or whose mail client
            mangled the link, gets an explanation and a way forward rather than
            a form that cannot possibly work. */}
        {!token ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-center space-y-2">
              <TriangleAlert className="size-8 text-amber-400 mx-auto" />
              <p className="text-sm font-medium text-foreground">This link is incomplete</p>
              <p className="text-xs text-muted-foreground">
                It&rsquo;s missing the reset code. Copy the full link from your email, or
                request a new one.
              </p>
            </div>
            <Link to="/forgot-password">
              <Button variant="outline" className="w-full">
                Request a new link
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {resetPassword.isError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive text-center">
                {/* Reset tokens expire after an hour and are cleared once used,
                    so an expired or already-spent link is the likely cause and
                    the message says what to do about it. */}
                This link has expired or has already been used.{' '}
                <Link to="/forgot-password" className="underline font-medium">
                  Request a new one
                </Link>
                .
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  error={errors.newPassword?.message}
                  {...register('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Type it again"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" loading={resetPassword.isPending}>
              Reset password
            </Button>
          </form>
        )}

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
