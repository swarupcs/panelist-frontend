import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Brain, ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForgotPassword } from '@/hooks/useAuth'

const schema = z.object({ email: z.string().email('Invalid email address') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const forgotPassword = useForgotPassword()

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    forgotPassword.mutate(data.email, { onSuccess: () => setSent(true) })
  }

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
            <h1 className="text-2xl font-bold text-foreground">Reset password</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {sent ? 'Check your inbox' : "We'll send you a reset link"}
            </p>
          </div>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5 text-center space-y-2">
              <Mail className="size-8 text-green-400 mx-auto" />
              <p className="text-sm font-medium text-foreground">Reset link sent!</p>
              <p className="text-xs text-muted-foreground">
                We sent a password reset link to <strong>{getValues('email')}</strong>.
                Check your inbox and spam folder.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSent(false)}
            >
              Send again
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {forgotPassword.isError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive text-center">
                Something went wrong. Please try again.
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" loading={forgotPassword.isPending}>
              Send Reset Link
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
  )
}
