'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Users, Search, Plus, Filter, MoreVertical, Shield,
  X, Edit, Trash2, ArrowRightLeft, UploadCloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { ImportGuardsModal } from '@/components/dashboard/import-guards-modal';

interface Guard {
  id: string;
  fullName: string;
  nin: string;
  status: string;
  currentShift: string;
  performanceScore?: number;
  assignedSite?: { id: string; name: string };
}

const STATUSES = ['ALL', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'INACTIVE'];

export default function GuardsDirectoryPage() {
  const router = useRouter();
  const [importOpen, setImportOpen] = useState(false);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  // Saved views — persist filters in localStorage
  const [search, setSearch] = useState<string>(() => {
    try {
      return localStorage.getItem('bastion-guards-search') ?? '';
    } catch {
      return '';
    }
  });
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('bastion-guards-status') ?? 'ALL';
    } catch {
      return 'ALL';
    }
  });
  const [showFilter, setShowFilter] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSiteId, setBulkSiteId] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('bastion-guards-search', search);
    } catch {
      /* noop */
    }
  }, [search]);

  useEffect(() => {
    try {
      localStorage.setItem('bastion-guards-status', statusFilter);
    } catch {
      /* noop */
    }
  }, [statusFilter]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['guards', page, search, statusFilter],
    queryFn: async () => {
      const params: any = { page, limit: 10, search };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.get('/guards', { params });
      return res.data;
    },
  });

  const { data: sitesData } = useQuery({
    queryKey: ['guards-sites'],
    queryFn: async () => {
      const res = await api.get('/sites', { params: { limit: 100 } });
      return res.data;
    },
    staleTime: 60000,
  });

  const deleteMutation = useMutation({
    mutationFn: (guardId: string) => api.delete(`/guards/${guardId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guards'] });
      setOpenMenu(null);
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: (dto: { siteId: string; guardIds: string[] }) =>
      api.post('/guards/bulk-assign', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guards'] });
      setSelected(new Set());
      setBulkSiteId('');
    },
  });

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'ON_LEAVE': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'SUSPENDED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Guard Personnel
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your security personnel, assignments, and statuses.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
              showFilter
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-secondary text-foreground border-border hover:bg-secondary/80"
            )}
          >
            <Filter className="h-4 w-4" /> Filter
            {statusFilter !== 'ALL' && (
              <span className="h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center px-1">
                1
              </span>
            )}
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-border bg-card hover:border-primary/40"
          >
            <UploadCloud className="h-4 w-4" /> Import
          </button>
          <button
            onClick={() => router.push('/guards/add')}
            className="btn-accent flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Add Guard
          </button>
        </div>
      </div>

      {/* Bulk assign bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 p-3">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
            {selected.size} selected
          </span>
          <select
            value={bulkSiteId}
            onChange={(e) => setBulkSiteId(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring"
          >
            <option value="">Assign to site…</option>
            {(sitesData?.data ?? []).map((s: { id: string; name: string }) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (!bulkSiteId) return;
              bulkAssignMutation.mutate({
                siteId: bulkSiteId,
                guardIds: Array.from(selected),
              });
            }}
            disabled={!bulkSiteId || bulkAssignMutation.isPending}
            className="btn-accent flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            {bulkAssignMutation.isPending ? 'Assigning…' : 'Assign'} <ArrowRightLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        </div>
      )}

      {/* Filter bar */}
      {showFilter && (
        <div className="mb-4 p-4 rounded-xl border border-border bg-card flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status:</span>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                statusFilter === s
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground"
              )}
            >
              {s === 'ALL' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
          {statusFilter !== 'ALL' && (
            <button
              onClick={() => setStatusFilter('ALL')}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/20">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, NIN, or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Loading personnel data..." />
        ) : data?.data?.length === 0 ? (
          <EmptyState icon={Shield} title="No guards found matching your criteria." />
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium tracking-wider w-10">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="px-6 py-4 font-medium tracking-wider">Guard Name</th>
                    <th className="px-6 py-4 font-medium tracking-wider">National ID (NIN)</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Assigned Site</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Shift</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Performance</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                    <th className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border table-zebra">
                  {data?.data?.map((guard: Guard) => (
                    <tr key={guard.id} className="table-row-hover group">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selected.has(guard.id)}
                          onChange={() => toggleSelected(guard.id)}
                          aria-label={`Select ${guard.fullName}`}
                          className="size-4 rounded border-border accent-primary"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-primary/25">
                            {guard.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <button
                            onClick={() => router.push(`/guards/${guard.id}`)}
                            className="font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer hover:underline text-left"
                          >
                            {guard.fullName}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{guard.nin}</td>
                      <td className="px-6 py-4 text-foreground">
                        {guard.assignedSite?.name || <span className="text-muted-foreground italic">Unassigned</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                          {guard.currentShift}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-xs font-bold ${
                            (guard.performanceScore ?? 100) >= 85
                              ? 'text-success'
                              : (guard.performanceScore ?? 100) >= 70
                                ? 'text-warning'
                                : 'text-destructive'
                          }`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {guard.performanceScore ?? 100}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge colorClassName={getStatusColor(guard.status)}>{guard.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === guard.id ? null : guard.id)}
                          className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-secondary transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openMenu === guard.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-border bg-card shadow-xl z-50 py-1"
                          >
                            <button
                              onClick={() => { router.push(`/guards/${guard.id}`); setOpenMenu(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                            >
                              <Edit className="h-4 w-4 text-muted-foreground" /> View Profile
                            </button>
                            <button
                              onClick={() => { router.push(`/guards/${guard.id}#transfer`); setOpenMenu(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                            >
                              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" /> Transfer
                            </button>
                            <button
                              onClick={() => { if (confirm('Delete this guard?')) deleteMutation.mutate(guard.id); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list — no horizontal scrolling required */}
            <div className="md:hidden divide-y divide-border">
              {data?.data?.map((guard: Guard) => (
                <div key={guard.id} className="p-4 flex items-start gap-3 active:bg-secondary/30">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-primary/25">
                    {guard.fullName.substring(0, 2).toUpperCase()}
                  </div>
                  <button
                    onClick={() => router.push(`/guards/${guard.id}`)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-foreground truncate">{guard.fullName}</p>
                      <Badge colorClassName={getStatusColor(guard.status)}>{guard.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{guard.nin}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {guard.assignedSite?.name || <span className="italic">Unassigned</span>}
                      {' · '}
                      <span className="uppercase tracking-wider">{guard.currentShift}</span>
                    </p>
                  </button>
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setOpenMenu(openMenu === guard.id ? null : guard.id)}
                      className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-secondary transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openMenu === guard.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-border bg-card shadow-xl z-50 py-1"
                      >
                        <button
                          onClick={() => { router.push(`/guards/${guard.id}`); setOpenMenu(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" /> View Profile
                        </button>
                        <button
                          onClick={() => { router.push(`/guards/${guard.id}#transfer`); setOpenMenu(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                        >
                          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" /> Transfer
                        </button>
                        <button
                          onClick={() => { if (confirm('Delete this guard?')) deleteMutation.mutate(guard.id); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
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

      <ImportGuardsModal open={importOpen} onClose={() => setImportOpen(false)} />
    </DashboardLayout>
  );
}
