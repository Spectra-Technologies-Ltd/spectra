'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  MapPin, ArrowLeft, Loader2, Building2, Users, AlertTriangle, Target,
  Map, Phone, Shield, Clock, ChevronRight, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SiteGuard {
  id: string;
  fullName: string;
  status: string;
  currentShift: string;
}

interface SiteIncident {
  id: string;
  title: string;
  incidentType: string;
  severity: string;
  status: string;
  reportedAt: string;
}

interface SiteClient {
  id: string;
  companyName: string;
  email?: string;
  phone?: string;
  estateName?: string;
}

interface SiteDetail {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  riskLevel: string;
  targetGuards: number;
  sitePhotos: string[];
  emergencyContacts: string;
  assets: string;
  client: SiteClient;
  guards: SiteGuard[];
  incidents: SiteIncident[];
  createdAt: string;
  updatedAt: string;
  _count?: { guards: number; incidents: number };
}

function getRiskBadge(level: string) {
  switch (level) {
    case 'LOW': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'HIGH': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/20';
    default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
  }
}

function getGuardStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'ON_LEAVE': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'SUSPENDED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    case 'INACTIVE': return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
  }
}

function getShiftBadge(shift: string) {
  switch (shift) {
    case 'DAY': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'NIGHT': return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
  }
}

function getIncidentSeverityColor(severity: string) {
  switch (severity) {
    case 'LOW': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'HIGH': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/20';
    default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SiteProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: site, isLoading } = useQuery<SiteDetail>({
    queryKey: ['site', id],
    queryFn: async () => {
      const res = await api.get(`/sites/${id}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p>Loading site profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!site) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <MapPin className="h-12 w-12 mb-3 opacity-20" />
          <p>Site not found.</p>
          <button
            onClick={() => router.push('/sites')}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Back to sites
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const emergencyContacts = (() => {
    try {
      const parsed = JSON.parse(site.emergencyContacts);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const assetList = (() => {
    try {
      const parsed = JSON.parse(site.assets);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const guardCount = site.guards?.length ?? 0;
  const manningStatus = guardCount < site.targetGuards ? 'UNDERMANNED' : 'FULLY_STAFFED';

  return (
    <DashboardLayout>
      {/* Back button */}
      <button
        onClick={() => router.push('/sites')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sites
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN — Site Identity Card */}
        <div className="lg:col-span-1 space-y-5">
          {/* Name & Risk Card */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="bg-gradient-to-b from-primary/20 to-card p-6 flex flex-col items-center">
              <div className="h-20 w-20 rounded-full bg-primary/20 border-4 border-card shadow-lg flex items-center justify-center">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mt-4 text-center">
                {site.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider',
                    getRiskBadge(site.riskLevel),
                  )}
                >
                  {site.riskLevel} RISK
                </span>
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider',
                    manningStatus === 'FULLY_STAFFED'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                  )}
                >
                  {manningStatus}
                </span>
              </div>

              {/* Manning Level */}
              <div className="mt-4 flex items-center gap-3 bg-secondary/30 rounded-lg px-4 py-3 w-full max-w-[200px]">
                <Users className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="text-lg font-bold text-foreground">
                    {guardCount} / {site.targetGuards}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Manning Level
                  </p>
                </div>
              </div>
            </div>

            {/* Address & Coordinates */}
            <div className="p-5 space-y-3 border-t border-border">
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-foreground">{site.address}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Map className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground font-mono text-xs">
                  {site.latitude?.toFixed(4)}, {site.longitude?.toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          {/* Client Card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Associated Client
            </h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {site.client?.companyName || '—'}
                </p>
                {site.client?.estateName && (
                  <p className="text-xs text-muted-foreground">{site.client.estateName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Phone className="h-4 w-4" /> Emergency Contacts
            </h3>
            {emergencyContacts.length > 0 ? (
              <div className="space-y-3">
                {emergencyContacts.map((contact: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-secondary/20 rounded-lg p-3">
                    <Phone className="h-4 w-4 text-rose-400 shrink-0" />
                    <div>
                      <p className="text-sm text-foreground font-medium">
                        {contact.name || contact.contact || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {contact.phone || contact.phoneNumber || '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No emergency contacts listed.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — Site Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Assets */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" /> On-Site Assets
            </h3>
            {assetList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {assetList.map((asset: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-foreground bg-secondary/20 rounded-lg px-3 py-2"
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{asset.name || asset.type || asset}</span>
                    {asset.quantity && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        x{asset.quantity}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No assets recorded for this site.
              </p>
            )}
          </div>

          {/* Assigned Guards */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Assigned Guards ({guardCount})
              </h3>
            </div>
            {site.guards.length > 0 ? (
              <div className="divide-y divide-border">
                {site.guards.map((guard) => (
                  <button
                    key={guard.id}
                    onClick={() => router.push(`/guards/${guard.id}`)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-secondary/30 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {guard.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground flex items-center gap-2">
                          {guard.fullName}
                          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider',
                              getGuardStatusBadge(guard.status),
                            )}
                          >
                            {guard.status.replace('_', ' ')}
                          </span>
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider',
                              getShiftBadge(guard.currentShift),
                            )}
                          >
                            {guard.currentShift}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-5 text-center text-sm text-muted-foreground">
                No guards assigned to this site.
              </div>
            )}
          </div>

          {/* Recent Incidents */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Recent Incidents ({site.incidents.length})
              </h3>
            </div>
            {site.incidents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Title</th>
                      <th className="px-5 py-3 font-medium">Type</th>
                      <th className="px-5 py-3 font-medium">Severity</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Reported At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {site.incidents.map((incident) => (
                      <tr
                        key={incident.id}
                        className="hover:bg-secondary/20 transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-foreground">
                          {incident.title}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground capitalize">
                          {incident.incidentType}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider',
                              getIncidentSeverityColor(incident.severity),
                            )}
                          >
                            {incident.severity}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="capitalize text-foreground">
                            {incident.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">
                          {formatDateTime(incident.reportedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5 text-center text-sm text-muted-foreground">
                No recent incidents recorded for this site.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
