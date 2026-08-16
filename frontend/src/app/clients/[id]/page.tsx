'use client';

import React, { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  ArrowLeft, Building2, Phone, Mail, MapPin, Calendar, DollarSign, Users,
  Shield, AlertTriangle, Loader2, ExternalLink, Camera, Download, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface ClientDetail {
  id: string;
  companyName: string;
  estateName: string;
  contactPerson: string;
  phone: string;
  email: string;
  contractStart: string;
  contractEnd: string;
  monthlyFee: number;
  numberOfGuardsAllocated: number;
  billingStatus: string;
  outstandingBalance: number;
  notes: string | null;
  photoUrl: string | null;
  sites: { id: string; name: string; address: string; riskLevel: string; _count: { guards: number; incidents: number } }[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
}

function getBillingColor(status: string) {
  switch (status) {
    case 'PAID': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'UNPAID': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'OVERDUE': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
  }
}

function getRiskColor(level: string) {
  switch (level) {
    case 'LOW': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'HIGH': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/20';
    default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
  }
}

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: client, isLoading } = useQuery<ClientDetail>({
    queryKey: ['client', id],
    queryFn: async () => {
      const res = await api.get(`/clients/${id}`);
      return res.data;
    },
  });

  const photoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/uploads/client/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      setUploading(false);
    },
    onError: () => setUploading(false),
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    photoMutation.mutate(file);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p>Loading client profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <Building2 className="h-12 w-12 mb-3 opacity-20" />
          <p>Client not found.</p>
          <button onClick={() => router.push('/clients')} className="mt-4 text-sm text-primary hover:underline">Back to directory</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => router.push('/clients')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to directory
        </button>
        <div className="flex items-center gap-2">
          <a
            href={`/api/v1/clients/${id}/export`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/40"
          >
            <Download className="h-3.5 w-3.5" /> Export Data
          </a>
          <a
            href={`/api/v1/reports/client/${id}/pdf`}
            className="btn-accent inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
          >
            <FileText className="h-3.5 w-3.5" /> Summary PDF
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Company card */}
        <div className="lg:col-span-1 space-y-5">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="bg-gradient-to-b from-primary/20 to-card p-6 flex flex-col items-center">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {client.photoUrl ? (
                  <img src={client.photoUrl} alt={client.companyName} className="h-20 w-20 rounded-lg object-cover border-2 border-card" />
                ) : (
                  <div className="h-20 w-20 rounded-lg bg-primary/20 border-2 border-card flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-primary" />
                  </div>
                )}
                <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <p className="text-xs text-muted-foreground mt-2">{uploading ? 'Uploading...' : 'Click to add logo'}</p>
              <h2 className="text-xl font-bold text-foreground mt-4 text-center">{client.companyName}</h2>
              <p className="text-sm text-muted-foreground mt-1">{client.estateName}</p>
              <Badge colorClassName={getBillingColor(client.billingStatus)} className="mt-2">{client.billingStatus}</Badge>
            </div>

            <div className="p-5 space-y-3 border-t border-border">
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{client.contactPerson}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{client.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{client.email}</span>
              </div>
            </div>
          </div>

          {/* Contract card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Contract
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="text-sm text-foreground">{formatDate(client.contractStart)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">End Date</p>
                <p className="text-sm text-foreground">{formatDate(client.contractEnd)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monthly Fee</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(client.monthlyFee)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Guards Allocated</p>
                <p className="text-sm text-foreground font-medium">{client.numberOfGuardsAllocated}</p>
              </div>
              {client.outstandingBalance > 0 && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    <div>
                      <p className="text-xs text-rose-400 font-medium">Outstanding Balance</p>
                      <p className="text-sm font-bold text-rose-400">{formatCurrency(client.outstandingBalance)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column — Sites */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Deployed Sites ({client.sites.length})
              </h3>
            </div>
            {client.sites.length > 0 ? (
              <div className="divide-y divide-border">
                {client.sites.map((site) => (
                  <div key={site.id} className="p-5 hover:bg-secondary/20 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{site.name}</h4>
                          <Badge colorClassName={getRiskColor(site.riskLevel)} className="text-[10px]">{site.riskLevel}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{site.address}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-foreground font-medium">{site._count.guards} guards</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <AlertTriangle className={cn("h-3.5 w-3.5", site._count.incidents > 0 ? "text-rose-400" : "text-muted-foreground/30")} />
                            <span className={cn("text-xs", site._count.incidents > 0 ? "text-rose-400 font-medium" : "text-muted-foreground")}>
                              {site._count.incidents} incidents
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/sites/${site.id}`)}
                        className="shrink-0 text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">No sites assigned to this client.</div>
            )}
          </div>

          {client.notes && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Notes</h3>
              <p className="text-sm text-foreground whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
