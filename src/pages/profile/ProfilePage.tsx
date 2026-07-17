import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Lock, Bell, Download, Trash2, Shield, Clock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUpdateProfile, useChangePassword, useLoginHistory, useUserPreferences, useUpdatePreferences } from '@/hooks/useAnalytics'
import { useLogout } from '@/hooks/useAuth'
import { PageHeader, LoadingScreen } from '@/components/common'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'



import { formatDate, formatRelative } from '@/utils/formatters'
import { userApi } from '@/api/user.api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'

const profileSchema = z.object({ name: z.string().min(2, 'At least 2 characters') })
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'One uppercase').regex(/[0-9]/, 'One number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] })

export default function ProfilePage() {
  const { user } = useAuthStore()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const { data: loginHistory, isLoading: historyLoading } = useLoginHistory(10)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const logout = useLogout()

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'

  const profileForm = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: user?.name || '' } })
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) })

  const onProfileSubmit = (data: { name: string }) => updateProfile.mutate(data)
  const onPasswordSubmit = (data: any) => changePassword.mutate({ currentPassword: data.currentPassword, newPassword: data.newPassword })

  const handleExport = async () => {
    const data = await userApi.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'my-data.json'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <PageHeader title="Profile" description="Manage your account settings" />

      {/* Avatar section */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={user?.profilePicture || undefined} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant={user?.role === 'PREMIUM' ? 'accent' : 'secondary'} className="text-xs">
                  {user?.role}
                </Badge>
                {user?.emailVerified && <Badge variant="success" className="text-xs">Verified</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="danger">Account</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><User className="size-4" />Personal Info</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    error={profileForm.formState.errors.name?.message}
                    {...profileForm.register('name')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled className="opacity-60" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                {updateProfile.isSuccess && (
                  <p className="text-sm text-green-400">Profile updated successfully!</p>
                )}
                <Button type="submit" loading={updateProfile.isPending}>Save Changes</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Lock className="size-4" />Change Password</CardTitle>
              <CardDescription>Use a strong unique password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" error={passwordForm.formState.errors.currentPassword?.message} {...passwordForm.register('currentPassword')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" error={passwordForm.formState.errors.newPassword?.message} {...passwordForm.register('newPassword')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" error={passwordForm.formState.errors.confirmPassword?.message} {...passwordForm.register('confirmPassword')} />
                </div>
                {changePassword.isSuccess && <p className="text-sm text-green-400">Password changed! You may need to log in again.</p>}
                {changePassword.isError && <p className="text-sm text-destructive">{(changePassword.error as any)?.response?.data?.error?.message}</p>}
                <Button type="submit" loading={changePassword.isPending}>Update Password</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Clock className="size-4" />Login History</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? <LoadingScreen /> : (
                <div className="space-y-2">
                  {loginHistory?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={item.success ? 'success' : 'destructive'} className="text-xs">
                            {item.success ? 'Success' : 'Failed'}
                          </Badge>
                          <span className="text-xs text-muted-foreground capitalize">{item.loginMethod}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.ipAddress}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatRelative(item.createdAt)}</p>
                    </div>
                  ))}
                  {!loginHistory?.length && <p className="text-sm text-muted-foreground text-center py-4">No login history</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Download className="size-4" />Export Data</CardTitle>
              <CardDescription>Download all your data in JSON format (GDPR)</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="size-4" />
                Export My Data
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-destructive"><Trash2 className="size-4" />Delete Account</CardTitle>
              <CardDescription>Permanently delete your account and all data. This cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="size-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your account, all interviews, progress and data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Label>Type <span className="font-mono text-destructive">DELETE MY ACCOUNT</span> to confirm</Label>
                    <Input
                      value={deleteConfirm}
                      onChange={e => setDeleteConfirm(e.target.value)}
                      placeholder="DELETE MY ACCOUNT"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={deleteConfirm !== 'DELETE MY ACCOUNT'}
                      onClick={async () => {
                        await userApi.deleteAccount({ confirmation: 'DELETE MY ACCOUNT' })
                        logout.mutate()
                      }}
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
