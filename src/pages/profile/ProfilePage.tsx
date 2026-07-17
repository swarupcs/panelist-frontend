// src/pages/profile/ProfilePage.tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Lock,
  Bell,
  History,
  Download,
  Trash2,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { userApi } from '@/api/user.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/common';
import {
  formatDateTime,
  formatRelative,
  getInitials,
} from '@/utils/formatters';
import { cn } from '@/lib/cn';
import type { UserPreferences } from '@/types';

// ── Avatar ─────────────────────────────────────────────────────────────────

function Avatar({ name, picture }: { name: string; picture?: string | null }) {
  if (picture) {
    return (
      <img
        src={picture}
        alt={name}
        className='size-20 rounded-full object-cover border-2 border-primary/20'
      />
    );
  }
  return (
    <div className='flex size-20 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20'>
      <span className='text-2xl font-bold text-primary'>
        {getInitials(name)}
      </span>
    </div>
  );
}

// ── Change password form ───────────────────────────────────────────────────

function ChangePasswordForm() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirm: '',
  });
  const [success, setSuccess] = useState(false);

  const change = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      userApi.changePassword(data),
    onSuccess: () => {
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    },
  });

  const canSubmit =
    form.currentPassword &&
    form.newPassword.length >= 8 &&
    form.newPassword === form.confirm;

  return (
    <div className='space-y-3'>
      {['currentPassword', 'newPassword', 'confirm'].map((field) => (
        <div key={field} className='space-y-1'>
          <label className='text-xs text-muted-foreground capitalize'>
            {field === 'currentPassword'
              ? 'Current password'
              : field === 'newPassword'
                ? 'New password'
                : 'Confirm new password'}
          </label>
          <input
            type='password'
            value={form[field as keyof typeof form]}
            onChange={(e) =>
              setForm((f) => ({ ...f, [field]: e.target.value }))
            }
            className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50'
            placeholder='••••••••'
          />
        </div>
      ))}

      {form.newPassword !== form.confirm && form.confirm && (
        <p className='text-xs text-destructive'>Passwords don't match</p>
      )}

      {success && (
        <div className='flex items-center gap-2 text-xs text-green-400'>
          <CheckCircle2 className='size-3.5' />
          Password changed successfully
        </div>
      )}

      {change.isError && (
        <p className='text-xs text-destructive'>
          {(change.error as any)?.response?.data?.error?.message ??
            'Failed to change password'}
        </p>
      )}

      <Button
        variant='gradient'
        size='sm'
        onClick={() =>
          change.mutate({
            currentPassword: form.currentPassword,
            newPassword: form.newPassword,
          })
        }
        disabled={!canSubmit}
        loading={change.isPending}
      >
        Update Password
      </Button>
    </div>
  );
}

// ── Preferences form ───────────────────────────────────────────────────────

function PreferencesForm() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: userApi.getPreferences,
  });

  const [local, setLocal] = useState<Partial<UserPreferences>>({});
  const [saved, setSaved] = useState(false);

  const update = useMutation({
    mutationFn: userApi.updatePreferences,
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      qc.invalidateQueries({ queryKey: ['user', 'preferences'] });
    },
  });

  const prefs = data?.preferences;

  const field = (
    key: keyof UserPreferences,
    override?: Partial<UserPreferences>,
  ) => (local[key] ?? prefs?.[key] ?? override?.[key]) as any;

  if (isLoading)
    return <div className='text-xs text-muted-foreground'>Loading…</div>;

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1.5'>
          <label className='text-xs text-muted-foreground'>
            Default difficulty
          </label>
          <select
            value={field('difficulty', { difficulty: 'MEDIUM' })}
            onChange={(e) =>
              setLocal((l) => ({ ...l, difficulty: e.target.value }))
            }
            className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none'
          >
            {['EASY', 'MEDIUM', 'HARD'].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className='space-y-1.5'>
          <label className='text-xs text-muted-foreground'>
            Session duration (min)
          </label>
          <select
            value={field('sessionDuration', { sessionDuration: 30 })}
            onChange={(e) =>
              setLocal((l) => ({
                ...l,
                sessionDuration: Number(e.target.value),
              }))
            }
            className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none'
          >
            {[15, 30, 45, 60, 90].map((d) => (
              <option key={d} value={d}>
                {d} min
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className='flex items-center justify-between py-2 border-t border-border/50'>
        <div>
          <p className='text-sm font-medium text-foreground'>
            Email notifications
          </p>
          <p className='text-xs text-muted-foreground'>
            Receive practice reminders
          </p>
        </div>
        <button
          type='button'
          onClick={() =>
            setLocal((l) => ({
              ...l,
              emailNotifications: !field('emailNotifications', {
                emailNotifications: true,
              }),
            }))
          }
          className={cn(
            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
            field('emailNotifications', { emailNotifications: true })
              ? 'bg-primary'
              : 'bg-secondary',
          )}
        >
          <span
            className={cn(
              'inline-block size-4 transform rounded-full bg-white shadow transition-transform',
              field('emailNotifications', { emailNotifications: true })
                ? 'translate-x-4'
                : 'translate-x-0.5',
            )}
          />
        </button>
      </div>

      <div className='flex items-center gap-3'>
        <Button
          variant='gradient'
          size='sm'
          onClick={() => update.mutate(local)}
          loading={update.isPending}
          disabled={Object.keys(local).length === 0}
        >
          Save Preferences
        </Button>
        {saved && (
          <span className='flex items-center gap-1 text-xs text-green-400'>
            <CheckCircle2 className='size-3.5' /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

// ── Delete account dialog ──────────────────────────────────────────────────

function DeleteAccountSection() {
  const { clearAuth } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [password, setPassword] = useState('');

  const del = useMutation({
    mutationFn: () =>
      userApi.deleteAccount({
        confirmation: confirm,
        password: password || undefined,
      }),
    onSuccess: () => clearAuth(),
  });

  return (
    <div className='space-y-3'>
      {!open ? (
        <Button
          variant='outline'
          size='sm'
          onClick={() => setOpen(true)}
          className='gap-2 text-destructive border-destructive/30 hover:bg-destructive/10'
        >
          <Trash2 className='size-3.5' />
          Delete Account
        </Button>
      ) : (
        <div className='space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4'>
          <div className='flex items-start gap-2'>
            <AlertTriangle className='size-4 text-destructive shrink-0 mt-0.5' />
            <p className='text-sm text-destructive'>
              This action is permanent and cannot be undone. All your data will
              be deleted.
            </p>
          </div>
          <input
            type='password'
            placeholder='Current password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-destructive/50'
          />
          <input
            type='text'
            placeholder='Type "DELETE MY ACCOUNT" to confirm'
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-destructive/50'
          />
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                setOpen(false);
                setConfirm('');
                setPassword('');
              }}
            >
              Cancel
            </Button>
            <Button
              size='sm'
              onClick={() => del.mutate()}
              disabled={confirm !== 'DELETE MY ACCOUNT' || del.isPending}
              loading={del.isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete Forever
            </Button>
          </div>
          {del.isError && (
            <p className='text-xs text-destructive'>
              {(del.error as any)?.response?.data?.error?.message ??
                'Failed to delete account'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState<
    'password' | 'preferences' | 'history' | null
  >(null);

  const { data: historyData, isLoading: histLoading } = useQuery({
    queryKey: ['user', 'login-history'],
    queryFn: () => userApi.getLoginHistory(10),
    enabled: activeSection === 'history',
  });

  const exportData = useMutation({
    mutationFn: userApi.exportData,
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-interview-data.json';
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  if (!user) return null;

  const SECTIONS = [
    { key: 'preferences', label: 'Preferences', icon: Bell },
    { key: 'password', label: 'Change Password', icon: Lock },
    { key: 'history', label: 'Login History', icon: History },
  ] as const;

  return (
    <div className='max-w-xl mx-auto space-y-6 animate-fade-in'>
      <PageHeader
        title='Profile'
        description='Manage your account and preferences'
      />

      {/* Profile card */}
      <Card>
        <CardContent className='pt-6 pb-6'>
          <div className='flex flex-col sm:flex-row items-center sm:items-start gap-5'>
            <Avatar name={user.name} picture={user.profilePicture} />
            <div className='flex-1 text-center sm:text-left space-y-2'>
              <div>
                <h2 className='text-xl font-bold text-foreground'>
                  {user.name}
                </h2>
                <p className='text-sm text-muted-foreground'>{user.email}</p>
              </div>
              <div className='flex flex-wrap gap-2 justify-center sm:justify-start'>
                <Badge
                  variant='outline'
                  className={cn(
                    'text-xs',
                    user.role === 'ADMIN'
                      ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                      : user.role === 'PREMIUM'
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : '',
                  )}
                >
                  {user.role}
                </Badge>
                {user.emailVerified ? (
                  <Badge
                    variant='outline'
                    className='text-xs border-green-500/30 bg-green-500/10 text-green-400'
                  >
                    <CheckCircle2 className='size-3 mr-1' />
                    Verified
                  </Badge>
                ) : (
                  <Badge
                    variant='outline'
                    className='text-xs border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                  >
                    Unverified
                  </Badge>
                )}
              </div>
              {user.lastLogin && (
                <p className='text-xs text-muted-foreground'>
                  Last login {formatRelative(user.lastLogin)}
                </p>
              )}
              {user.oauthProvider && (
                <p className='text-xs text-muted-foreground flex items-center gap-1'>
                  <Shield className='size-3' />
                  Linked via {user.oauthProvider}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section accordion */}
      <div className='space-y-2'>
        {SECTIONS.map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <button
              type='button'
              onClick={() =>
                setActiveSection(activeSection === key ? null : key)
              }
              className='flex w-full items-center justify-between p-4'
            >
              <div className='flex items-center gap-3'>
                <Icon className='size-4 text-muted-foreground' />
                <span className='text-sm font-medium text-foreground'>
                  {label}
                </span>
              </div>
              <ChevronRight
                className={cn(
                  'size-4 text-muted-foreground transition-transform',
                  activeSection === key && 'rotate-90',
                )}
              />
            </button>

            {activeSection === key && (
              <CardContent className='pt-0 pb-4 border-t border-border'>
                {key === 'preferences' && <PreferencesForm />}
                {key === 'password' && <ChangePasswordForm />}
                {key === 'history' && (
                  <div className='space-y-2 mt-3'>
                    {histLoading && (
                      <div className='flex justify-center py-4'>
                        <Loader2 className='size-4 animate-spin text-primary' />
                      </div>
                    )}
                    {historyData?.loginHistory?.map((item) => (
                      <div
                        key={item.id}
                        className='flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/20 px-3 py-2'
                      >
                        <div>
                          <p className='text-xs font-medium text-foreground'>
                            {item.loginMethod} · {item.ipAddress}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {formatDateTime(item.createdAt)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'text-xs font-medium',
                            item.success
                              ? 'text-green-400'
                              : 'text-destructive',
                          )}
                        >
                          {item.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Data & danger zone */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Data & Privacy</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <p className='text-sm font-medium text-foreground'>
                Export my data
              </p>
              <p className='text-xs text-muted-foreground'>
                Download all your interview data as JSON.
              </p>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => exportData.mutate()}
              loading={exportData.isPending}
              className='gap-1.5 shrink-0'
            >
              <Download className='size-3.5' />
              Export
            </Button>
          </div>

          <div className='border-t border-border/50 pt-4'>
            <p className='text-sm font-medium text-foreground mb-3'>
              Danger Zone
            </p>
            <DeleteAccountSection />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
