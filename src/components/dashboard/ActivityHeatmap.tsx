import { useQuery } from '@tanstack/react-query';
import { ActivityCalendar } from 'react-activity-calendar';
import { gamificationApi } from '@/api/user.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Flame } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

/**
 * "Mon, 14 Jul 2025" for a `yyyy-MM-dd` string.
 *
 * Parsed as parts rather than `new Date(iso)`, which reads a bare date as UTC
 * midnight and then renders it in local time — a day earlier for anyone west
 * of Greenwich. A tooltip naming the wrong day is worse than none.
 */
function formatActivityDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

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
              /* Mon/Wed/Fri only. All seven crowd a 12px row and the grid is
                 read by position anyway — three anchors are enough to tell
                 which row is which. */
              showWeekdayLabels={['mon', 'wed', 'fri']}
              /* Weeks start on Monday, matching the weekday labels above and
                 how a working week is usually counted. */
              weekStart={1}
              tooltips={{
                activity: {
                  withArrow: true,
                  // Says the date and what happened on it. A bare square tells
                  // you an intensity and nothing else — not which day it was,
                  // and not whether "darker" meant two questions or twenty.
                  text: (activity) =>
                    `${activity.count === 0 ? 'No activity' : `${activity.count} question${activity.count === 1 ? '' : 's'}`} on ${formatActivityDate(activity.date)}`,
                },
              }}
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
