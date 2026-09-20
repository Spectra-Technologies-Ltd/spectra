'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Inbox,
  Loader2,
  StickyNote,
  Wifi,
  WifiOff,
  X,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealtimeEvent, useRealtimeStatus } from '@/lib/realtime';

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
const PAGE_SIZES = [10, 25, 50, 100];

type StatusFilter = (typeof STATUSES)[number];
type StreamStatus = 'connecting' | 'live' | 'offline';

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

const streamTone = (status: StreamStatus) => {
  if (status === 'live') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500';
  if (status === 'offline') return 'border-amber-500/40 bg-amber-500/10 text-amber-500';
  return 'border-border bg-secondary/40 text-muted-foreground';
};

const streamLabel = (status: StreamStatus) => {
  if (status === 'live') return 'Live stream';
  if (status === 'offline') return 'Polling only';
  return 'Connecting…';
};

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [rule, setRule] = useState('ALL');
  const [severity, setSeverity] = useState('ALL');
  const [status, setStatus] = useState<StatusFilter>('UNREAD');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);

  const streamStatus = useRealtimeStatus();

  const { data: alerts, isLoading } = useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: async () => (await api.get('/alerts?limit=200')).data,
    refetchInterval: 15000,
  });

  const label = useMutation({
    mutationFn: ({ id, wasReal, note }: { id: string; wasReal: boolean; note?: string }) =>
      api.post(`/alerts/${id}/label`, note ? { wasReal, note } : { wasReal }),
    onSuccess: (_data, { id }) => {
      // The note has been sent with the label — don't let a later label reuse it.
      setNotes((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const bulkLabel = useMutation({
    mutationFn: async ({ ids, wasReal }: { ids: string[]; wasReal: boolean }) => {
      const results = await Promise.allSettled(
        ids.map((id) => {
          const note = notes[id]?.trim();
          return api.post(`/alerts/${id}/label`, note ? { wasReal, note } : { wasReal });
        }),
      );
      return {
        labelled: results.filter((r) => r.status === 'fulfilled').length,
        failed: results.filter((r) => r.status === 'rejected').length,
      };
    },
    onMutate: () => setBulkNotice(null),
    onSuccess: ({ labelled, failed }, { ids }) => {
      setNotes((prev) => {
        const next = { ...prev };
        ids.forEach((id) => delete next[id]);
        return next;
      });
      setSelectedIds(new Set());
      setBulkNotice(
        failed > 0
          ? `${failed} of ${labelled + failed} labels could not be saved — retry those alerts.`
          : `${labelled} alert${labelled === 1 ? '' : 's'} labelled.`,
      );
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: () => setBulkNotice('Bulk labelling failed — please retry.'),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/alerts/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  // A newly raised alert should appear without waiting for the next poll. The
  // 15s refetchInterval below stays as the fallback when the stream is down.
  useRealtimeEvent('alert:created', () => {
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
  });

  // The stream authenticates from the httpOnly `access_token` cookie, so it only
  // 401s ("Missing token") once that 15-minute cookie has lapsed. Refetching on
  // the drop lets the axios 401 handler rotate the cookie, after which the
  // stream's own backoff reconnect succeeds.
  const wasOffline = useRef(false);
  useEffect(() => {
    if (streamStatus === 'offline' && !wasOffline.current) {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
    wasOffline.current = streamStatus === 'offline';
  }, [streamStatus, queryClient]);

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

  // Pagination — clamp instead of resetting so a shrinking list can't strand the
  // view on an empty page.
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paged = visible.slice(start, start + pageSize);
  const pagedIds = paged.map((a) => a.id);

  // Filters and page size change the result set, so start back at page one.
  useEffect(() => {
    setPage(1);
  }, [rule, severity, status, pageSize]);

  const selectedOnScreen = useMemo(
    () => visible.filter((a) => selectedIds.has(a.id)).map((a) => a.id),
    [visible, selectedIds],
  );
  const allOnPageSelected = pagedIds.length > 0 && pagedIds.every((id) => selectedIds.has(id));
  const someOnPageSelected = pagedIds.some((id) => selectedIds.has(id));

  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAllOnPage = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (pagedIds.every((id) => next.has(id))) pagedIds.forEach((id) => next.delete(id));
      else pagedIds.forEach((id) => next.add(id));
      return next;
    });

  const setNote = (id: string, value: string) => setNotes((prev) => ({ ...prev, [id]: value }));

  const selected = visible.find((a) => a.id === selectedId) ?? visible[0] ?? null;
  const unreadCount = (alerts ?? []).filter((a) => !a.isRead).length;
  const busy = label.isPending || markRead.isPending;
  const bulkBusy = bulkLabel.isPending;

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
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
              streamTone(streamStatus),
            )}
            title={
              streamStatus === 'live'
                ? 'Subscribed to /realtime/stream — new alerts appear instantly'
                : 'Realtime stream unavailable — falling back to 15s polling'
            }
          >
            {streamStatus === 'offline' ? (
              <WifiOff className="h-3 w-3" />
            ) : (
              <Wifi className="h-3 w-3" />
            )}
            {streamLabel(streamStatus)}
          </span>
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
          {/* Bulk labelling */}
          {selectedOnScreen.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 p-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                {selectedOnScreen.length} selected
              </span>
              <button
                disabled={bulkBusy}
                onClick={() => bulkLabel.mutate({ ids: selectedOnScreen, wasReal: true })}
                className="flex items-center gap-1 rounded-md border border-emerald-500/40 px-2.5 py-1 text-xs font-medium text-emerald-500 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
              >
                {bulkBusy && bulkLabel.variables?.wasReal === true ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Label REAL
              </button>
              <button
                disabled={bulkBusy}
                onClick={() => bulkLabel.mutate({ ids: selectedOnScreen, wasReal: false })}
                className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/40 disabled:opacity-50"
              >
                {bulkBusy && bulkLabel.variables?.wasReal === false ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                Label FALSE
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="ml-auto font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          )}

          {bulkNotice && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-secondary/20 px-3 py-2">
              <span className="text-xs text-muted-foreground">{bulkNotice}</span>
              <button
                onClick={() => setBulkNotice(null)}
                aria-label="Dismiss"
                className="ml-auto text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

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
              <>
                <div className="flex flex-wrap items-center gap-3 border-b border-border bg-secondary/10 px-5 py-2.5">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someOnPageSelected && !allOnPageSelected;
                    }}
                    onChange={toggleAllOnPage}
                    aria-label="Select all alerts on this page"
                    className="size-4 cursor-pointer rounded border-border accent-primary"
                  />
                  <span className="text-xs text-muted-foreground">Select all on page</span>
                  {selectedOnScreen.length > 0 && (
                    <span className="ml-auto font-mono text-[11px] uppercase tracking-wider text-primary">
                      {selectedOnScreen.length} selected
                    </span>
                  )}
                </div>

                <div className="divide-y divide-border">
                  {paged.map((a) => {
                    const { icon: RuleIcon, tone } = ruleMeta(a.code);
                    const note = notes[a.id]?.trim();
                    const isSelected = selectedIds.has(a.id);
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
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleSelected(a.id)}
                            aria-label={`Select alert ${a.title}`}
                            className="mt-2.5 size-4 shrink-0 cursor-pointer rounded border-border accent-primary"
                          />

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
                              {note && (
                                <span
                                  title={note}
                                  className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary"
                                >
                                  <StickyNote className="h-3 w-3" /> note
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
                                  label.mutate({ id: a.id, wasReal: true, note });
                                }}
                                className="flex items-center gap-1 rounded-md border border-emerald-500/40 px-2.5 py-1 text-xs font-medium text-emerald-500 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> REAL
                              </button>
                              <button
                                disabled={busy}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  label.mutate({ id: a.id, wasReal: false, note });
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

                <FeedPagination
                  page={currentPage}
                  totalPages={totalPages}
                  from={visible.length === 0 ? 0 : start + 1}
                  to={start + paged.length}
                  total={visible.length}
                  pageSize={pageSize}
                  onPrev={() => setPage(Math.max(1, currentPage - 1))}
                  onNext={() => setPage(Math.min(totalPages, currentPage + 1))}
                  onPageSize={setPageSize}
                />
              </>
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
              <>
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

                <div className="mt-4 border-t border-border pt-4">
                  <label
                    htmlFor="alert-label-note"
                    className="flex items-center gap-1.5 text-xs font-medium text-foreground"
                  >
                    <StickyNote className="h-3.5 w-3.5 text-muted-foreground" /> Label note
                  </label>
                  <textarea
                    id="alert-label-note"
                    rows={2}
                    value={notes[selected.id] ?? ''}
                    onChange={(e) => setNote(selected.id, e.target.value)}
                    placeholder="Optional — why is this real or false?"
                    className="mt-1.5 w-full resize-none rounded-md border border-border bg-card px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Sent with the next label you apply to this alert, then cleared.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      disabled={busy}
                      onClick={() =>
                        label.mutate({
                          id: selected.id,
                          wasReal: true,
                          note: notes[selected.id]?.trim() || undefined,
                        })
                      }
                      className="flex flex-1 items-center justify-center gap-1 rounded-md border border-emerald-500/40 px-2.5 py-1.5 text-xs font-medium text-emerald-500 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> REAL
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        label.mutate({
                          id: selected.id,
                          wasReal: false,
                          note: notes[selected.id]?.trim() || undefined,
                        })
                      }
                      className="flex flex-1 items-center justify-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/40 disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" /> FALSE
                    </button>
                  </div>
                </div>
              </>
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

function FeedPagination({
  page,
  totalPages,
  from,
  to,
  total,
  pageSize,
  onPrev,
  onNext,
  onPageSize,
}: {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
  onPageSize: (size: number) => void;
}) {
  return (
    <div className="border-t border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-secondary/10">
      <span className="text-xs text-muted-foreground text-center sm:text-left">
        Showing <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> of{' '}
        <span className="font-medium text-foreground">{total}</span> alerts
      </span>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Per page
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={onPrev}
          disabled={page === 1}
          aria-label="Previous page"
          className="p-2 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium px-2 text-foreground whitespace-nowrap">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="p-2 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
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
