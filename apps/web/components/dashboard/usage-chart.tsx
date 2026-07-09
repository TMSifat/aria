'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartPoint } from '@/lib/usage';

export function UsageChart({ data }: { data: ChartPoint[] }) {
  const interval = Math.max(0, Math.floor(data.length / 6) - 1);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C8501F" stopOpacity={0.16} />
            <stop offset="100%" stopColor="#C8501F" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="rgba(22,21,15,0.07)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#8B8674', fontFamily: 'var(--font-jetbrains)' }}
          tickLine={false}
          axisLine={false}
          interval={interval}
          minTickGap={16}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#8B8674', fontFamily: 'var(--font-jetbrains)' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={32}
        />
        <Tooltip
          cursor={{ stroke: '#C8501F', strokeWidth: 1 }}
          contentStyle={{
            borderRadius: 10,
            border: '1px solid rgba(22,21,15,0.15)',
            background: '#F4F5EF',
            fontSize: 12,
            boxShadow: '0 4px 14px rgba(22,21,15,0.08)',
          }}
          labelStyle={{ color: '#16150F', fontWeight: 600 }}
          formatter={(value: number) => [value, 'Messages']}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#C8501F"
          strokeWidth={2.5}
          fill="url(#usageFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
