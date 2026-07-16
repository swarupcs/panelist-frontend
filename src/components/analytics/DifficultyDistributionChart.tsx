import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DifficultyDistribution } from '@/types';

interface DifficultyDistributionChartProps {
  data: DifficultyDistribution[];
}

const COLORS = {
  Easy: '#10b981',   // Emerald 500
  Medium: '#f59e0b', // Amber 500
  Hard: '#ef4444',   // Red 500
};

export function DifficultyDistributionChart({ data }: DifficultyDistributionChartProps) {
  const chartData = useMemo(() => {
    return data.filter(d => d.count > 0);
  }, [data]);

  if (!chartData.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground border rounded-xl border-dashed">
        No difficulty data available
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="count"
            nameKey="difficulty"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.difficulty as keyof typeof COLORS] || '#8884d8'} 
                stroke="rgba(0,0,0,0.1)"
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: number, name: string) => [value, name]}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
