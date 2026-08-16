'use client'

import { useState } from 'react'
import { MapPin, Users, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { MapCanvas } from '@/components/dashboard/map-canvas'
import { cn } from '@/lib/utils'

interface Site {
  id: string
  name: string
  address: string
  riskLevel: string
  client?: { companyName: string }
  _count?: { guards: number; incidents: number }
}

const riskTone: Record<string, { label: string; text: string; dot: string }> = {
  LOW: { label: 'Low', text: 'text-success', dot: 'bg-success' },
  MEDIUM: { label: 'Medium', text: 'text-info', dot: 'bg-info' },
  HIGH: { label: 'High', text: 'text-warning', dot: 'bg-warning' },
  CRITICAL: { label: 'Critical', text: 'text-destructive', dot: 'bg-destructive' },
}

export default function MapPage() {
  const [activeId, setActiveId] = useState<string>('')

  const { data } = useQuery({
    queryKey: ['map-sites'],
    queryFn: async () => {
      const res = await api.get('/sites', { params: { limit: 100 } })
      return res.data
    },
    staleTime: 60000,
  })

  const sites: Site[] = data?.data ?? []
  const active = sites.find((s) => s.id === activeId) ?? sites[0]

  return (
    <DashboardLayout>
      <div className="flex flex-1 flex-col gap-4 lg:h-[calc(100vh-7rem)] lg:flex-row">
        <div className="min-h-[420px] flex-1">
          <MapCanvas activeId={active?.id} onSelect={setActiveId} />
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
        {active && (
          <div className="rounded-lg border border-primary/40 bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">
                {active.riskLevel} RISK
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <span className={cn('size-2 rounded-full', riskTone[active.riskLevel]?.dot)} />
                <span className={riskTone[active.riskLevel]?.text}>
                  {riskTone[active.riskLevel]?.label}
                </span>
              </span>
            </div>
            <h3 className="mt-1 text-lg font-semibold">{active.name}</h3>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {active.address}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-md border border-border bg-background/50 p-2.5">
                <p className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <Users className="size-3" /> Guards
                </p>
                <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
                  {active._count?.guards ?? 0}
                </p>
              </div>
              <div className="rounded-md border border-border bg-background/50 p-2.5">
                <p className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <AlertTriangle className="size-3" /> Incidents
                </p>
                <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
                  {active._count?.incidents ?? 0}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card">
          <header className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Deployed Sites</h2>
          </header>
          <ul className="flex-1 divide-y divide-border overflow-y-auto">
            {sites.map((site) => (
              <li key={site.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(site.id)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40',
                    activeId === site.id && 'bg-accent/60',
                  )}
                >
                  <span className={cn('size-2 shrink-0 rounded-full', riskTone[site.riskLevel]?.dot)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{site.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {site.client?.companyName ?? '—'}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {site._count?.guards ?? 0} guards
                  </span>
                </button>
              </li>
            ))}
            {sites.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                No sites deployed yet
              </li>
            )}
          </ul>
        </div>
      </aside>
      </div>
    </DashboardLayout>
  )
}
