'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ShieldCheck, Search, Fingerprint } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string } | null;
}

const actionTone: Record<string, string> = {
  POST: 'bg-success/15 text-success border-success/30',
  PATCH: 'bg-warning/15 text-warning border-warning/30',
  PUT: 'bg-warning/15 text-warning border-warning/30',
  DELETE: 'bg-destructive/15 text-destructive border-destructive/30',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function SecurityCenterPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, search],
    queryFn: async () => {
      const res = await api.get('/audit-logs', { params: { page, limit: 20, search } });
      return res.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Compliance & Trust
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-foreground">
            <ShieldCheck className="h-6 w-6 text-primary" /> Security Center
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Immutable audit trail of every action across the platform.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search actions, entities…"
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <LoadingState label="Loading audit trail…" />
        ) : !data?.data?.length ? (
          <EmptyState icon={Fingerprint} title="No audit entries found." />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-bold">Time</th>
                    <th className="px-5 py-3 font-bold">User</th>
                    <th className="px-5 py-3 font-bold">Action</th>
                    <th className="px-5 py-3 font-bold">Entity</th>
                    <th className="px-5 py-3 font-bold">ID</th>
                    <th className="px-5 py-3 font-bold">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data.data.map((entry: AuditEntry) => (
                    <tr key={entry.id} className="table-row-hover">
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-muted-foreground">
                        {formatTime(entry.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-medium text-foreground">
                          {entry.user
                            ? `${entry.user.firstName} ${entry.user.lastName}`
                            : 'System'}
                        </span>
                        {entry.user && (
                          <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                            {entry.user.email}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-md px-2 py-0.5 font-mono text-[10px] font-bold',
                            actionTone[entry.action] ?? 'bg-secondary text-muted-foreground',
                          )}
                        >
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        {entry.entity.replace('/api/v1/', '')}
                      </td>
                      <td className="max-w-[140px] truncate px-5 py-3 font-mono text-xs text-muted-foreground">
                        {entry.entityId || '—'}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        {entry.ipAddress || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-border/60 md:hidden">
              {data.data.map((entry: AuditEntry) => (
                <div key={entry.id} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatTime(entry.createdAt)}
                    </span>
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 font-mono text-[10px] font-bold',
                        actionTone[entry.action] ?? 'bg-secondary text-muted-foreground',
                      )}
                    >
                      {entry.action}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-foreground">
                    {entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : 'System'}
                  </p>
                  <p className="mt-0.5 break-all font-mono text-xs text-muted-foreground">
                    {entry.entity.replace('/api/v1/', '')} · {entry.entityId || '—'}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {entry.ipAddress || '—'}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {data?.meta && (
          <Pagination
            page={page}
            totalPages={data.meta.pages}
            currentCount={data.data.length}
            totalCount={data.meta.total}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(data.meta.pages, p + 1))}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
