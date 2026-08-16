'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Brain,
  Activity,
  ShieldAlert,
  Users,
  Clock,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { LoadingState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

interface Insight {
  severity: string;
  category: string;
  title: string;
  detail: string;
  recommendation: string;
  metric: string;
}

interface Overview {
  healthScore: number;
  openIncidents: number;
  avgGuardPerformance: number;
  lateCheckInRate: number;
  patrolCompletionRate: number;
  atRiskGuardCount: number;
  siteCount: number;
  insights: Insight[];
  generatedAt: string;
}

interface SiteRisk {
  siteId: string;
  siteName: string;
  riskLevel: string;
  riskScore: number;
  incidentCount30d: number;
  openIncidents30d: number;
  lateCheckInRate: number;
  patrolCompletionRate: number;
  peakIncidentHour: number | null;
}

interface AtRiskGuard {
  guardId: string;
  fullName: string;
  shift: string;
  site: string;
  performanceScore: number;
  reliability: number;
  lateCount: number;
  absentCount: number;
  flaggedCount: number;
  riskLevel: string;
  riskFactors: string[];
}

const insightTone: Record<string, { ring: string; label: string }> = {
  HIGH: { ring: 'border-destructive/30 bg-destructive/10 text-destructive', label: 'High priority' },
  MEDIUM: { ring: 'border-warning/30 bg-warning/10 text-warning', label: 'Watch' },
  INFO: { ring: 'border-info/30 bg-info/10 text-info', label: 'Signal' },
};

const riskLevelTone: Record<string, string> = {
  CRITICAL: 'bg-destructive/15 text-destructive border-destructive/30',
  HIGH: 'bg-warning/15 text-warning border-warning/30',
  MEDIUM: 'bg-info/15 text-info border-info/30',
  LOW: 'bg-success/15 text-success border-success/30',
};

function riskColor(score: number): string {
  if (score >= 75) return 'hsl(0 72% 51%)';
  if (score >= 50) return 'hsl(38 92% 50%)';
  if (score >= 25) return 'hsl(210 100% 60%)';
  return 'hsl(142 71% 45%)';
}

export default function NapoleonPage() {
  const { data: overview, isLoading } = useQuery<Overview>({
    queryKey: ['napoleon-overview'],
    queryFn: async () => (await api.get('/napoleon/overview')).data,
  });

  const { data: riskBySite } = useQuery<SiteRisk[]>({
    queryKey: ['napoleon-risk-by-site'],
    queryFn: async () => (await api.get('/napoleon/risk-by-site')).data,
  });

  const { data: atRiskGuards } = useQuery<AtRiskGuard[]>({
    queryKey: ['napoleon-at-risk-guards'],
    queryFn: async () => (await api.get('/napoleon/at-risk-guards')).data,
  });

  if (isLoading || !overview) {
    return (
      <DashboardLayout>
        <LoadingState label="Napoleon is analyzing your operations…" />
      </DashboardLayout>
    );
  }

  const kpis = [
    {
      label: 'Operational Health',
      value: `${overview.healthScore}`,
      suffix: '/100',
      icon: Activity,
      tone: 'bg-success/15 text-success',
      sub: `${overview.siteCount} sites monitored`,
    },
    {
      label: 'Open Incidents',
      value: `${overview.openIncidents}`,
      suffix: '',
      icon: ShieldAlert,
      tone: 'bg-destructive/15 text-destructive',
      sub: 'last 30 days',
    },
    {
      label: 'At-Risk Guards',
      value: `${overview.atRiskGuardCount}`,
      suffix: '',
      icon: Users,
      tone: 'bg-warning/15 text-warning',
      sub: 'need attention',
    },
    {
      label: 'Late Check-ins',
      value: `${overview.lateCheckInRate}`,
      suffix: '%',
      icon: Clock,
      tone: 'bg-info/15 text-info',
      sub: '14-day window',
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          Spectra Intelligence Layer
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-foreground">
          <Brain className="h-6 w-6 text-primary" /> Napoleon Intelligence
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Signals, patterns, and predictions computed from live operational data.
          Updated {new Date(overview.generatedAt).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Health gauge + KPI grid */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        <div className="card-lift relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-border bg-card p-5 lg:col-span-1">
          <div className="relative h-28 w-28">
            <div
              className="size-full rounded-full"
              style={{
                background: `conic-gradient(${riskColor(overview.healthScore)} ${overview.healthScore * 3.6}deg, var(--color-border) 0deg)`,
              }}
            />
            <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-card">
              <span className="font-mono text-2xl font-bold tabular-nums">
                {overview.healthScore}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                Health
              </span>
            </div>
          </div>
          <p className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {overview.healthScore >= 75 ? 'Strong' : overview.healthScore >= 50 ? 'Managing' : 'At risk'}
          </p>
        </div>
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              style={{ '--i': i } as React.CSSProperties}
              className="stagger-item card-lift group relative overflow-hidden rounded-xl border border-border bg-card p-4 hover:border-primary/40"
            >
              <div className="flex items-start justify-between">
                <span className={cn('flex size-9 items-center justify-center rounded-lg', kpi.tone)}>
                  <Icon className="size-4" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {kpi.label}
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
                  {kpi.value}
                </span>
                {kpi.suffix && (
                  <span className="font-mono text-sm text-muted-foreground">{kpi.suffix}</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Insights */}
        <section className="flex flex-col rounded-xl border border-border bg-card xl:col-span-2">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Napoleon analysis
              </p>
              <h2 className="mt-0.5 flex items-center gap-2 text-sm font-semibold">
                <Lightbulb className="size-4 text-primary" /> Insights & Recommendations
              </h2>
            </div>
            <span className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" /> Auto-generated
            </span>
          </header>
          <ul className="divide-y divide-border">
            {overview.insights.map((insight, i) => {
              const tone = insightTone[insight.severity] ?? insightTone.INFO;
              return (
                <li
                  key={`${insight.category}-${i}`}
                  style={{ '--i': i } as React.CSSProperties}
                  className="stagger-item flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-accent/30 sm:flex-row sm:items-start"
                >
                  <span className={cn('mt-0.5 shrink-0 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider', tone.ring)}>
                    {tone.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{insight.title}</h3>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {insight.category}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{insight.detail}</p>
                    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-primary">
                      <TrendingUp className="mt-0.5 size-3 shrink-0" />
                      {insight.recommendation}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground">
                    {insight.metric}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* At-risk guards */}
        <section className="flex flex-col rounded-xl border border-border bg-card">
          <header className="border-b border-border px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Anomaly detection
            </p>
            <h2 className="mt-0.5 text-sm font-semibold">At-Risk Personnel</h2>
          </header>
          {!atRiskGuards?.length ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-muted-foreground">
              <Users className="size-8 opacity-30" />
              <p className="text-sm">No anomalies detected</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {atRiskGuards.slice(0, 6).map((guard) => (
                <li key={guard.guardId} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/30">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-semibold text-primary">
                    {guard.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{guard.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {guard.site} · {guard.shift}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {guard.riskFactors.slice(0, 2).map((f) => (
                        <span key={f} className="rounded bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="shrink-0">
                    <span
                      className={cn(
                        'rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
                        riskLevelTone[guard.riskLevel] ?? riskLevelTone.LOW,
                      )}
                    >
                      {guard.riskLevel}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Risk by site */}
      <section className="mt-6 flex flex-col rounded-xl border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Site intelligence
            </p>
            <h2 className="mt-0.5 flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="size-4 text-primary" /> Risk Exposure by Site
            </h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Last 30 days
          </span>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Site</th>
                <th className="px-4 py-2.5 font-medium">Risk Score</th>
                <th className="px-4 py-2.5 font-medium">Level</th>
                <th className="px-4 py-2.5 font-medium">Incidents (30d)</th>
                <th className="px-4 py-2.5 font-medium">Late Check-ins</th>
                <th className="px-4 py-2.5 font-medium">Patrol Completion</th>
                <th className="px-4 py-2.5 font-medium">Peak Hour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(riskBySite ?? []).map((site) => (
                <tr key={site.siteId} className="transition-colors hover:bg-accent/30">
                  <td className="px-4 py-3 font-medium text-foreground">{site.siteName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${site.riskScore}%`,
                            background: riskColor(site.riskScore),
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs tabular-nums">{site.riskScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
                        riskLevelTone[site.riskLevel] ?? riskLevelTone.LOW,
                      )}
                    >
                      {site.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-muted-foreground">
                    {site.incidentCount30d}
                    {site.openIncidents30d > 0 && (
                      <span className="ml-1 text-destructive">({site.openIncidents30d} open)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-muted-foreground">
                    {site.lateCheckInRate}%
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-muted-foreground">
                    {site.patrolCompletionRate}%
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-muted-foreground">
                    {site.peakIncidentHour != null
                      ? `${String(site.peakIncidentHour).padStart(2, '0')}:00`
                      : '—'}
                  </td>
                </tr>
              ))}
              {!riskBySite?.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No site data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <footer className="border-t border-border px-4 py-3">
          <a
            href="/reports"
            className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
          >
            Explore full reports <ChevronRight className="size-3" />
          </a>
        </footer>
      </section>
    </DashboardLayout>
  );
}
