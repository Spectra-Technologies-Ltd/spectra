'use client';

import React, { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Inbox,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  code: string;
  severity: string;
  score: number;
  metric: string | null;
  metricValue: number | null;
  title: string;
  message: string;
  siteId: string | null;
  siteName: string | null;
  incidentId: string | null;
  isRead: boolean;
  wasReal: boolean | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const RULES = ['CRITICAL_INCIDENT', 'ANOMALY', 'INCIDENT_SURGE'];
const SEVERITIES = ['CRITICAL', 'WARNING'];
const STATUSES = ['UNREAD', 'READ', 'REAL', 'FALSE', 'UNLABELLED', 'ALL'] as const;

type StatusFilter = (typeof STATUSES)[number];

const ruleMeta = (code: string) => {
  switch (code) {
    case 'CRITICAL_INCIDENT':
      return { icon: Flame, tone: 'bg-red-500/10 text-red-500' };
    case 'ANOMALY':
      return { icon: Activity, tone: 'bg-violet-500/10 text-violet-500' };
    default:
      return { icon: AlertTriangle, tone: 'bg-amber-500/10 text-amber-500' };
  }
};

const scoreTone = (score: number) => {
  if (score >= 100) return 'bg-red-500/15 text-red-500 border-red-500/30';
  if (score >= 90) return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
  return 'bg-secondary text-muted-foreground border-border';
};

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [rule, setRule] = useState('ALL');
  const [severity, setSeverity] = useState('ALL');
  const [status, setStatus] = useState<StatusFilter>('UNREAD');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: alerts, isLoading } = useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: async () => (await api.get('/alerts?limit=200')).data,
    refetchInterval: 15000,
  });

  const label = useMutation({
    mutationFn: ({ id, wasReal }: { id: string; wasReal: boolean }) =>
      api.post(`/alerts/${id}/label`, { wasReal }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/alerts/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const visible = useMemo(() => {
    return (alerts ?? [])
      .filter((a) => {
        if (rule !== 'ALL' && a.code !== rule) return false;
        if (severity !== 'ALL' && a.severity !== severity) return false;
        if (status === 'UNREAD' && a.isRead) return false;
        if (status === 'READ' && !a.isRead) return false;
        if (status === 'REAL' && a.wasReal !== true) return false;
        if (status === 'FALSE' && a.wasReal !== false) return false;
        if (status === 'UNLABELLED' && a.wasReal !== null) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score);
  }, [alerts, rule, severity, status]);

  const selected = visible.find((a) => a.id === selectedId) ?? visible[0] ?? null;
  const unreadCount = (alerts ?? []).filter((a) => !a.isRead).length;

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-primary" /> Alerts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ranked by deviation score. Label each alert so the model learns what is real.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{unreadCount}</span> unread
          </span>
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{visible.length}</span> shown
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Filter label="Rule" value={rule} onChange={setRule} options={['ALL', ...RULES]} />
        <Filter label="Severity" value={severity} onChange={setSeverity} options={['ALL', ...SEVERITIES]} />
        <Filter
          label="Status"
          value={status}
          onChange={(value) => setStatus(value as StatusFilter)}
          options={[...STATUSES]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ranked list */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
                <p>Loading alerts...</p>
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Inbox className="h-12 w-12 mb-3 opacity-20" />
                <p>No alerts match these filters</p>
                <p className="text-xs mt-1">
                  Napoleon raises alerts when incident traffic deviates from a site&apos;s baseline.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {visible.map((a) => {
                  const { icon: RuleIcon, tone } = ruleMeta(a.code);
                  const busy = label.isPending || markRead.isPending;
                  return (
                    <div
                      key={a.id}
                      onClick={() => setSelectedId(a.id)}
                      className={cn(
                        'cursor-pointer px-5 py-4 transition-colors',
                        selected?.id === a.id ? 'bg-primary/5' : 'hover:bg-secondary/20',
                        !a.isRead && 'border-l-2 border-l-primary',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', tone)}>
                          <RuleIcon className="h-4 w-4" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
                              {a.code.replace('_', ' ')}
                            </span>
                            <Badge className={cn('border', scoreTone(a.score))}>{a.score}</Badge>
                            {a.metric && (
                              <span className="text-[11px] text-muted-foreground">
                                {a.metric}
                                {a.metricValue !== null ? `: ${a.metricValue}` : ''}
                              </span>
                            )}
                            {a.wasReal !== null && (
                              <span
                                className={cn(
                                  'text-[11px] px-1.5 py-0.5 rounded',
                                  a.wasReal
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-secondary text-muted-foreground',
                                )}
                              >
                                {a.wasReal ? 'REAL' : 'FALSE'}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-foreground">{a.message}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {a.siteName ?? 'Unassigned site'} · {formatDate(a.createdAt)}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <div className="flex gap-2">
                            <button
                              disabled={busy}
                              onClick={(e) => {
                                e.stopPropagation();
                                label.mutate({ id: a.id, wasReal: true });
                              }}
                              className="flex items-center gap-1 rounded-md border border-emerald-500/40 px-2.5 py-1 text-xs font-medium text-emerald-500 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> REAL
                            </button>
                            <button
                              disabled={busy}
                              onClick={(e) => {
                                e.stopPropagation();
                                label.mutate({ id: a.id, wasReal: false });
                              }}
                              className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/40 disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" /> FALSE
                            </button>
                          </div>
                          {!a.isRead && (
                            <button
                              disabled={busy}
                              onClick={(e) => {
                                e.stopPropagation();
                                markRead.mutate(a.id);
                              }}
                              className="text-[11px] text-primary hover:underline disabled:opacity-50"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Context panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Event context</h2>
            {!selected ? (
              <p className="mt-3 text-xs text-muted-foreground">Select an alert to see the event behind it.</p>
            ) : (
              <dl className="mt-3 space-y-3 text-xs">
                <Field label="Rule" value={selected.code} />
                <Field label="Severity" value={selected.severity} />
                <Field label="Score" value={String(selected.score)} />
                <Field label="Site" value={selected.siteName ?? '—'} />
                {selected.metric && (
                  <Field
                    label="Metric"
                    value={`${selected.metric}${
                      selected.metricValue !== null ? ` = ${selected.metricValue}` : ''
                    }`}
                  />
                )}
                <Field label="Raised" value={formatDate(selected.createdAt)} />
                {selected.incidentId && <Field label="Event ID" value={selected.incidentId} mono />}
                <div>
                  <dt className="text-muted-foreground">Message</dt>
                  <dd className="mt-0.5 text-foreground">{selected.message}</dd>
                </div>
                {Object.keys(selected.metadata ?? {}).length > 0 && (
                  <div>
                    <dt className="text-muted-foreground">Context payload</dt>
                    <dd className="mt-1 overflow-x-auto rounded-md bg-secondary/30 p-2 font-mono text-[11px] leading-relaxed text-foreground">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(selected.metadata, null, 2)}</pre>
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === 'ALL' ? 'All' : option.replace('_', ' ')}
          </option>
        ))}
      </select>
    </label>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('rounded border px-1.5 py-0.5 text-[11px] font-semibold tabular-nums', className)}>
      {children}
    </span>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('mt-0.5 text-foreground break-all', mono && 'font-mono text-[11px]')}>{value}</dd>
    </div>
  );
}
