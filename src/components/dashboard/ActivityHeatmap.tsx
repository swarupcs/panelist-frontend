import { useQuery } from '@tanstack/react-query';
import { ActivityCalendar } from 'react-activity-calendar';
import { gamificationApi } from '@/api/user.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Flame } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function ActivityHeatmap() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['gamification', 'activity'],
    queryFn: () => gamificationApi.getActivity(),
    enabled: !!user,
  });

  const activityData = data?.activity || [];

  // The calendar throws on an empty array, so a single day stands in until the
  // first request resolves. The API now returns a contiguous year — every day
  // including the empty ones — because a contribution grid renders exactly the
  // range it is handed, and a sparse array drew a couple of lonely squares.
  const safeData =
    activityData.length > 0
      ? activityData
      : [{ date: new Date().toISOString().split('T')[0], count: 0, level: 0 as const }];

  return (
    <Card className="border-border bg-card shadow-sm h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          Activity & Streak
        </CardTitle>
      </CardHeader>
      {/* Scrolls horizontally rather than centring. A year is wider than the
          card on a narrow screen, and centring a grid that overflows hides its
          start rather than its end — the recent weeks are the ones worth
          seeing. */}
      <CardContent className="overflow-x-auto custom-scrollbar pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-[120px]">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <div className="min-w-[max-content] px-1">
            <ActivityCalendar
              data={safeData}
              theme={{
                light: ['#f0f0f0', '#dcfce7', '#86efac', '#22c55e', '#166534'],
                dark:  ['#1e293b', '#064e3b', '#065f46', '#059669', '#10b981'],
              }}
              colorScheme="dark"
              blockSize={12}
              blockRadius={2}
              blockMargin={4}
              fontSize={12}
              labels={{
                legend: {
                  less: 'Less',
                  more: 'More',
                },
                months: [
                  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ],
                weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                totalCount: '{{count}} questions in {{year}}',
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
