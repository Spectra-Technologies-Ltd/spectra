'use client'

import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { AnimatedNumber } from './animated-number'

const fallbackStats = {
  totalGuards: 128,
  activeGuards: 6,
  onLeaveGuards: 0,
  suspendedGuards: 0,
  totalSites: 12,
  highRiskSites: 2,
  totalClients: 24,
  openIncidents: 5,
  todayAttendance: 114,
  todayLate: 3,
  todayAbsent: 6,
  attendanceRate: 89,
}

export function KpiCards() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats')
      return res.data
    },
    placeholderData: fallbackStats,
    staleTime: 30000,
  })

  const s = stats ?? fallbackStats

  const kpis = [
    {
      id: 'active-sites',
      label: 'Active Sites',
      value: String(s.totalSites),
      delta: `+${s.highRiskSites}`,
      trend: 'up' as const,
      hint: `${s.highRiskSites} high risk`,
    },
    {
      id: 'personnel',
      label: 'Personnel Deployed',
      value: String(s.totalGuards),
      delta: `+${s.activeGuards}`,
      trend: 'up' as const,
      hint: `${s.activeGuards} on duty now`,
    },
    {
      id: 'open-incidents',
      label: 'Open Incidents',
      value: String(s.openIncidents),
      delta: `-${s.openIncidents}`,
      trend: 'down' as const,
      hint: 'last 24h',
    },
    {
      id: 'attendance',
      label: 'Attendance Rate',
      value: `${s.attendanceRate}%`,
      delta: `${s.todayLate} late`,
      trend: 'down' as const,
      hint: `${s.todayAbsent} absent today`,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {kpis.map((kpi, i) => {
        const positive = kpi.trend === 'up'
        const Arrow = positive ? ArrowUpRight : ArrowDownRight
        return (
          <div
            key={kpi.id}
            style={{ '--i': i } as React.CSSProperties}
            className="stagger-item card-lift group relative overflow-hidden rounded-lg border border-border bg-card p-4 hover:border-primary/40"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {kpi.label}
            </p>
            <div className="mt-3 flex items-end justify-between">
              <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
                <AnimatedNumber value={kpi.value} />
              </span>
              <span
                className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-xs font-medium ${
                  positive ? 'bg-success/15 text-success' : 'bg-info/15 text-info'
                }`}
              >
                <Arrow className="size-3" />
                {kpi.delta}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
          </div>
        )
      })}
    </div>
  )
}
