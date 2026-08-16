'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

const fallback = [
  { day: 'Mon', rate: 38 },
  { day: 'Tue', rate: 56 },
  { day: 'Wed', rate: 84 },
  { day: 'Thu', rate: 86 },
  { day: 'Fri', rate: 94 },
  { day: 'Sat', rate: 78 },
  { day: 'Sun', rate: 62 },
]

export function AttendanceChart() {
  const { data } = useQuery({
    queryKey: ['attendance-chart'],
    queryFn: async () => {
      const res = await api.get('/dashboard/attendance-trend')
      return res.data
    },
    placeholderData: fallback,
    staleTime: 60000,
  })

  const trend = Array.isArray(data) && data.length > 0 ? data : fallback

  return (
    <section className="flex flex-col rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Last 7 days
          </p>
          <h2 className="mt-0.5 text-sm font-semibold">Attendance Overview</h2>
        </div>
        <span className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" />
          Present
        </span>
      </header>
      <div className="h-[240px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ left: -16, right: 8, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="v2Attendance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(42 90% 56%)" stopOpacity={0.32} />
                <stop offset="100%" stopColor="hsl(42 90% 56%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              domain={[0, (dataMax: number) => Math.max(100, Math.ceil((dataMax + 10) / 10) * 10)]}
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ stroke: 'var(--color-border)', strokeDasharray: '4 4' }}
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--color-foreground)',
              }}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="hsl(42 90% 56%)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: 'hsl(42 90% 56%)', stroke: 'var(--color-card)', strokeWidth: 2 }}
              activeDot={{ r: 5.5, fill: 'hsl(42 90% 56%)', stroke: 'var(--color-card)', strokeWidth: 2 }}
              fill="url(#v2Attendance)"
              animationDuration={700}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
