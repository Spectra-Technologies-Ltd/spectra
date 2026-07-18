'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ClipboardCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceRecord {
  id: string;
  guard: { fullName: string };
  site: { name: string };
  checkInTime: string;
  checkOutTime: string | null;
  status: string;
  checkInMethod: string;
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'ON_TIME':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'FLAGGED':
      return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    case 'LATE':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'ABSENT':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    default:
      return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  }
}

export default function AttendancePage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-history', page],
    queryFn: async () => {
      const res = await api.get('/attendance/history', {
        params: { page, limit: 20 },
      });
      return res.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" /> Attendance Tracking
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor guard check-ins, check-outs, and attendance status across all sites.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Guard Name</th>
                <th className="px-6 py-4 font-medium tracking-wider">Site</th>
                <th className="px-6 py-4 font-medium tracking-wider">Check-in Time</th>
                <th className="px-6 py-4 font-medium tracking-wider">Check-out Time</th>
                <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium tracking-wider">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading attendance records...
                    </div>
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No attendance records found.</p>
                  </td>
                </tr>
              ) : (
                data?.data?.map((record: AttendanceRecord) => (
                  <tr key={record.id} className="hover:bg-secondary/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {record.guard.fullName.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">
                          {record.guard.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground">{record.site.name}</td>
                    <td className="px-6 py-4 text-foreground font-mono text-xs">
                      {formatDateTime(record.checkInTime)}
                    </td>
                    <td className="px-6 py-4 text-foreground font-mono text-xs">
                      {formatDateTime(record.checkOutTime)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider',
                          getStatusStyle(record.status),
                        )}
                      >
                        {record.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                        {record.checkInMethod}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta && (
          <div className="border-t border-border p-4 flex items-center justify-between bg-secondary/10">
            <span className="text-xs text-muted-foreground">
              Showing{' '}
              <span className="font-medium text-foreground">{data.data.length}</span> of{' '}
              <span className="font-medium text-foreground">{data.meta.total}</span>{' '}
              entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium px-2 text-foreground">
                Page {page} of {data.meta.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.meta.pages, p + 1))}
                disabled={page === data.meta.pages || data.meta.pages === 0}
                className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
