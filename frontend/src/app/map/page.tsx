'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Users, AlertTriangle, ShieldCheck, LocateFixed } from 'lucide-react'
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
  clientName: string | null
  guardsAssigned: number
  guardsOnDuty: number
  totalIncidents: number
  openIncidents: number
  targetGuards: number
}

const riskTone: Record<string, { label: string; text: string; dot: string; badge: string }> = {
  LOW: { label: 'Low', text: 'text-success', dot: 'bg-success', badge: 'bg-success/15 text-success border-success/30' },
  MEDIUM: { label: 'Medium', text: 'text-info', dot: 'bg-info', badge: 'bg-info/15 text-info border-info/30' },
  HIGH: { label: 'High', text: 'text-warning', dot: 'bg-warning', badge: 'bg-warning/15 text-warning border-warning/30' },
  CRITICAL: { label: 'Critical', text: 'text-destructive', dot: 'bg-destructive', badge: 'bg-destructive/15 text-destructive border-destructive/30' },
}

const riskWeight: Record<string, number> = { LOW: 20, MEDIUM: 45, HIGH: 70, CRITICAL: 90 }

function scoreTone(score: number) {
  if (score >= 70) return 'text-destructive'
  if (score >= 40) return 'text-warning'
  return 'text-success'
}

export default function MapPage() {
  const [activeId, setActiveId] = useState<string>('')

  const { data } = useQuery({
    queryKey: ['map-data'],
    queryFn: async () => {
      const res = await api.get('/dashboard/map-data')
      return res.data
    },
    refetchInterval: 60000,
  })

  const sites: Site[] = data?.sites ?? []
  const guardsOnDuty = (data?.guards ?? []).filter((g: { onDuty: boolean }) => g.onDuty).length
  const openIncidents = (data?.incidents ?? []).filter(
    (i: { status: string }) => i.status === 'OPEN' || i.status === 'INVESTIGATING',
  ).length

  const active = sites.find((s) => s.id === activeId) ?? sites[0]
  const riskScore = active
    ? Math.min(99, (riskWeight[active.riskLevel] ?? 20) + (active.totalIncidents ?? 0) * 2)
    : 0

  return (
    <DashboardLayout>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Command View
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-foreground">
            <LocateFixed className="h-6 w-6 text-primary" /> Live Operations Map
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Drag to pan · scroll to zoom · click markers for details
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: `${sites.length} sites`, tone: 'border-primary/40 text-primary' },
            { label: `${guardsOnDuty} on duty`, tone: 'border-success/40 text-success' },
            { label: `${openIncidents} open incidents`, tone: 'border-destructive/40 text-destructive' },
          ].map((chip) => (
            <span
              key={chip.label}
              className={cn('rounded-md border bg-card px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider', chip.tone)}
            >
              {chip.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 lg:h-[calc(100vh-12rem)] lg:flex-row">
        <div className="min-h-[460px] flex-1">
          <MapCanvas activeId={active?.id} onSelect={setActiveId} />
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          {active && (
            <div className="rounded-lg border border-primary/40 bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">
                  {active.riskLevel} RISK
                </span>
                <span
                  className={cn(
                    'rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
                    riskTone[active.riskLevel]?.badge,
                  )}
                >
                  {riskTone[active.riskLevel]?.label}
                </span>
              </div>
              <h3 className="mt-1 text-lg font-semibold">{active.name}</h3>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5" />
                {active.address}
              </p>
              {active.clientName && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Client: <span className="text-foreground">{active.clientName}</span>
                </p>
              )}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-md border border-border bg-background/50 p-2.5 text-center">
                  <p className="flex items-center justify-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <Users className="size-3" /> On duty
                  </p>
                  <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
                    {active.guardsOnDuty}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-background/50 p-2.5 text-center">
                  <p className="flex items-center justify-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <ShieldCheck className="size-3" /> Assigned
                  </p>
                  <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
                    {active.guardsAssigned}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-background/50 p-2.5 text-center">
                  <p className="flex items-center justify-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <AlertTriangle className="size-3" /> Open
                  </p>
                  <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
                    {active.openIncidents}
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-md border border-border bg-background/50 p-2.5">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Risk Score
                  </p>
                  <p className={`font-mono text-lg font-semibold tabular-nums ${scoreTone(riskScore)}`}>
                    {riskScore}/99
                  </p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-success via-warning to-destructive"
                    style={{ width: `${riskScore}%` }}
                  />
                </div>
              </div>
              <Link
                href={`/sites/${active.id}`}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary/15 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
              >
                <ShieldCheck className="size-3.5" /> Open site profile
              </Link>
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Deployed Sites</h2>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {guardsOnDuty} on duty
              </span>
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
                        {site.clientName ?? '—'} · {site.guardsOnDuty}/{site.guardsAssigned} on duty
                      </p>
                    </div>
                    {site.openIncidents > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                        {site.openIncidents}
                      </span>
                    )}
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
