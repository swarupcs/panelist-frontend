// src/pages/profile/PublicProfilePage.tsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/api/user.api';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { PageHeader, EmptyState } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Badge } from '@/components/ui/badge';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getInitials, formatDateTime } from '@/utils/formatters';
import { Target, Trophy, Clock, BrainCircuit, Activity } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['publicProfile', username],
    queryFn: () => userApi.getPublicProfile(username!),
    enabled: !!username,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className='max-w-4xl mx-auto space-y-6'>
        <Skeleton className='h-40 w-full rounded-xl' />
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Skeleton className='h-64 rounded-xl md:col-span-1' />
          <Skeleton className='h-64 rounded-xl md:col-span-2' />
        </div>
      </div>
    );
  }

  if (isError || !data?.profile) {
    return (
      <EmptyState
        title='Profile Not Found'
        description={`We couldn't find a user with the username "${username}". They might have changed it or deleted their account.`}
        action={<Link to='/' className='text-primary hover:underline'>Return Home</Link>}
      />
    );
  }

  const profile = data.profile;
  const progress = profile.userProgress;
  const streak = profile.streaks?.[0];
  const isOwner = currentUser?.username === profile.username;

  return (
    <div className='max-w-4xl mx-auto space-y-6 animate-fade-in'>
      {isOwner && (
        <div className='bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg text-sm flex items-center justify-between'>
          <span>This is how your public profile looks to others.</span>
          <Link to='/profile' className='underline font-medium hover:text-primary/80'>Edit Profile</Link>
        </div>
      )}

      {/* Main Profile Header */}
      <Card className='overflow-hidden border-none shadow-md bg-card/50'>
        <div className='h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent' />
        <CardContent className='relative pt-0 pb-8 px-8'>
          <div className='flex flex-col md:flex-row gap-6 md:items-end -mt-12'>
            <div className='relative'>
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.name}
                  className='size-24 rounded-full object-cover border-4 border-background bg-background shadow-sm'
                />
              ) : (
                <div className='flex size-24 items-center justify-center rounded-full bg-primary/10 border-4 border-background shadow-sm'>
                  <span className='text-3xl font-bold text-primary'>
                    {getInitials(profile.name)}
                  </span>
                </div>
              )}
            </div>
            
            <div className='flex-1 space-y-1 md:pb-2'>
              <h1 className='text-2xl font-bold text-foreground'>{profile.name}</h1>
              <p className='text-muted-foreground font-medium'>@{profile.username}</p>
            </div>
            
            <div className='md:pb-2'>
              <div className='text-sm text-muted-foreground'>Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
            </div>
          </div>

          {profile.bio && (
            <div className='mt-6 text-sm text-foreground/90 max-w-2xl leading-relaxed'>
              {profile.bio}
            </div>
          )}
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Left Column - Stats */}
        <div className='space-y-6 md:col-span-1'>
          <Card>
            <CardContent className='p-5 space-y-6'>
              <div>
                <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4'>Community Stats</h3>
                <div className='space-y-4'>
                  <div className='flex items-center gap-3'>
                    <div className='p-2 rounded-md bg-blue-500/10 text-blue-500'>
                      <BrainCircuit className='size-4' />
                    </div>
                    <div>
                      <div className='text-xs text-muted-foreground'>Questions Answered</div>
                      <div className='font-semibold text-foreground'>{progress?.totalQuestionsAnswered || 0}</div>
                    </div>
                  </div>
                  
                  <div className='flex items-center gap-3'>
                    <div className='p-2 rounded-md bg-purple-500/10 text-purple-500'>
                      <Target className='size-4' />
                    </div>
                    <div>
                      <div className='text-xs text-muted-foreground'>Total Interviews</div>
                      <div className='font-semibold text-foreground'>{progress?.totalInterviews || 0}</div>
                    </div>
                  </div>

                  <div className='flex items-center gap-3'>
                    <div className='p-2 rounded-md bg-green-500/10 text-green-500'>
                      <Clock className='size-4' />
                    </div>
                    <div>
                      <div className='text-xs text-muted-foreground'>Practice Time</div>
                      <div className='font-semibold text-foreground'>{Math.round((progress?.totalStudyTime || 0) / 60)} hrs</div>
                    </div>
                  </div>
                  
                  <div className='flex items-center gap-3'>
                    <div className='p-2 rounded-md bg-orange-500/10 text-orange-500'>
                      <Activity className='size-4' />
                    </div>
                    <div>
                      <div className='text-xs text-muted-foreground'>Current Streak</div>
                      <div className='font-semibold text-foreground flex items-center gap-1.5'>
                        {streak?.current || 0} days
                        {(streak?.current || 0) > 0 && <span className='text-orange-500'>🔥</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Achievements */}
        <div className='space-y-6 md:col-span-2'>
          <Card className='h-full'>
            <CardContent className='p-6'>
              <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2'>
                <Trophy className='size-4' />
                Badges & Achievements
              </h3>
              
              {profile.achievements && profile.achievements.length > 0 ? (
                <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  {profile.achievements.map((ach: any) => (
                    <div key={ach.achievementId} className='flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-secondary/20 text-center gap-2 hover:bg-secondary/40 transition-colors'>
                      <div className='size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1'>
                        <Trophy className='size-6' />
                      </div>
                      <div className='text-sm font-medium text-foreground line-clamp-1' title={ach.achievementId.replace(/_/g, ' ')}>
                        {ach.achievementId.replace(/_/g, ' ')}
                      </div>
                      <div className='text-[10px] text-muted-foreground'>
                        {new Date(ach.unlockedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <div className='size-16 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground mb-4'>
                    <Trophy className='size-8 opacity-20' />
                  </div>
                  <p className='text-sm font-medium text-foreground'>No badges yet</p>
                  <p className='text-xs text-muted-foreground mt-1'>This user hasn't unlocked any achievements.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
