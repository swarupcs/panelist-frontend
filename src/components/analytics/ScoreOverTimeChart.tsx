import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { formatDate, formatScore } from '@/utils/formatters';
import type { PerformanceTrend } from '@/types';

interface ScoreOverTimeChartProps {
  data: PerformanceTrend[];
}

export function ScoreOverTimeChart({ data }: ScoreOverTimeChartProps) {
  // Sort data chronologically just in case
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  if (!sortedData.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground border rounded-xl border-dashed">
        No score data available
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={sortedData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => formatDate(date)} 
            stroke="rgba(255,255,255,0.5)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          <YAxis 
            domain={[0, 100]} 
            stroke="rgba(255,255,255,0.5)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
            itemStyle={{ color: '#10b981' }}
            labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
            formatter={(value: number) => [formatScore(value), 'Score']}
            labelFormatter={(label) => formatDate(label as string)}
          />
          <Area 
            type="monotone" 
            dataKey="averageScore" 
            stroke="#10b981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorScore)" 
            activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
