'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Building2, Search, Plus, Filter, MoreVertical, ChevronLeft, ChevronRight, MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Client {
  id: string;
  companyName: string;
  estateName: string;
  contactPerson: string;
  phone: string;
  billingStatus: string;
  contractEnd: string;
  sites: { id: string; name: string }[];
}

export default function ClientsDirectoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, search],
    queryFn: async () => {
      const res = await api.get('/clients', { params: { page, limit: 10, search } });
      return res.data;
    },
  });

  const getBillingStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'UNPAID': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'OVERDUE': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Client Portfolio
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your corporate clients, estates, and contracts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-secondary text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors border border-border">
            <Filter className="h-4 w-4" /> Filter
          </button>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Plus className="h-4 w-4" /> Add Client
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/20">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search clients or estates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Client / Estate</th>
                <th className="px-6 py-4 font-medium tracking-wider">Contact Person</th>
                <th className="px-6 py-4 font-medium tracking-wider">Active Sites</th>
                <th className="px-6 py-4 font-medium tracking-wider">Contract Expiry</th>
                <th className="px-6 py-4 font-medium tracking-wider">Billing</th>
                <th className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading clients...
                    </div>
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No clients found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                data?.data?.map((client: Client) => (
                  <tr key={client.id} className="hover:bg-secondary/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer">
                          {client.companyName}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {client.estateName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-foreground">{client.contactPerson}</span>
                        <span className="text-xs text-muted-foreground">{client.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {client.sites.length}
                        </span>
                        <span className="text-xs text-muted-foreground">sites</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-foreground text-sm">
                        {format(new Date(client.contractEnd), 'MMM dd, yyyy')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider', getBillingStatusColor(client.billingStatus))}>
                        {client.billingStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-secondary transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
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
              Showing <span className="font-medium text-foreground">{data.data.length}</span> of <span className="font-medium text-foreground">{data.meta.total}</span> entries
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
