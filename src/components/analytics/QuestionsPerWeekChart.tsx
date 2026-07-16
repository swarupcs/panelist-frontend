import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDate } from '@/utils/formatters';
import type { PerformanceTrend } from '@/types';

interface QuestionsPerWeekChartProps {
  data: PerformanceTrend[];
}

export function QuestionsPerWeekChart({ data }: QuestionsPerWeekChartProps) {
  // Group by week (we can just group by ISO week or simply present a simpler aggregated daily array if it's small,
  // but let's actually group by week string (e.g., "Week of YYYY-MM-DD"))
  const weeklyData = useMemo(() => {
    const weeksMap = new Map<string, number>();

    data.forEach((day) => {
      const dateObj = new Date(day.date);
      // Get the Monday of this week
      const dayOfWeek = dateObj.getDay();
      const diff = dateObj.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
      const monday = new Date(dateObj.setDate(diff));
      const weekLabel = `Week of ${formatDate(monday.toISOString())}`;

      const current = weeksMap.get(weekLabel) || 0;
      weeksMap.set(weekLabel, current + (day.questionCount || 0));
    });

    const result = Array.from(weeksMap.entries()).map(([week, count]) => ({
      week,
      count,
    }));

    return result;
  }, [data]);

  if (!weeklyData.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground border rounded-xl border-dashed">
        No question data available
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={weeklyData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="week" 
            stroke="rgba(255,255,255,0.5)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => val.replace('Week of ', '')}
          />
          <YAxis 
            allowDecimals={false}
            stroke="rgba(255,255,255,0.5)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            formatter={(value: number) => [value, 'Questions Answered']}
          />
          <Bar 
            dataKey="count" 
            fill="#3b82f6" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
