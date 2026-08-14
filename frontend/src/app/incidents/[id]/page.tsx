"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  ArrowLeft,
  AlertTriangle,
  MapPin,
  Building2,
  UserCircle,
  Shield,
  Clock,
  Calendar,
  FileText,
  Users,
  Camera,
  Video,
  Eye,
  CheckCircle2,
  Loader2,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

interface IncidentDetail {
  id: string;
  title: string;
  incidentType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: string;
  description: string;
  occurrenceTime: string;
  reportedAt: string;
  investigationStatus: string;
  resolutionNotes: string | null;
  guardsInvolved: string;
  photos: string;
  videos: string;
  witnesses: string;
  actionsTaken: string;
  site: {
    id: string;
    name: string;
    address: string;
    riskLevel: string;
    client: { companyName: string };
  };
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "LOW":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "MEDIUM":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "HIGH":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "CRITICAL":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "UNDER_INVESTIGATION":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "RESOLVED":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "CLOSED":
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    default:
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
}

function getInvestigationBadge(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "UNDER_INVESTIGATION":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "RESOLVED":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "CLOSED":
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    default:
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
}

function getRiskBadge(riskLevel: string) {
  switch (riskLevel) {
    case "LOW":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "MEDIUM":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "HIGH":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "CRITICAL":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseJsonList(jsonStr: string): any[] {
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: incident, isLoading } = useQuery<IncidentDetail>({
    queryKey: ["incident", id],
    queryFn: async () => {
      const res = await api.get(`/incidents/${id}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p>Loading incident details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!incident) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mb-3 opacity-20" />
          <p>Incident not found.</p>
          <button
            onClick={() => router.push("/incidents")}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Back to incidents
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const guardsList = parseJsonList(incident.guardsInvolved);
  const photosList = parseJsonList(incident.photos);
  const videosList = parseJsonList(incident.videos);
  const witnessesList = parseJsonList(incident.witnesses);

  const timelineEntries = [
    {
      icon: AlertTriangle,
      label: "Incident Occurred",
      date: incident.occurrenceTime,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
    },
    {
      icon: FileText,
      label: "Reported",
      date: incident.reportedAt,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Shield,
      label: `Investigation ${incident.investigationStatus.replace(/_/g, " ")}`,
      date: incident.resolutionNotes ? incident.reportedAt : null,
      color:
        incident.investigationStatus === "RESOLVED" || incident.investigationStatus === "CLOSED"
          ? "text-emerald-400"
          : "text-amber-400",
      bgColor:
        incident.investigationStatus === "RESOLVED" || incident.investigationStatus === "CLOSED"
          ? "bg-emerald-500/10"
          : "bg-amber-500/10",
    },
  ];

  return (
    <DashboardLayout>
      {/* Back button */}
      <button
        onClick={() => router.push("/incidents")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to incidents
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN — Incident Overview */}
        <div className="lg:col-span-1 space-y-5">
          {/* Header Card */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div
              className={cn(
                "bg-gradient-to-b to-card p-6 flex flex-col items-center",
                incident.severity === "CRITICAL"
                  ? "from-red-500/20"
                  : incident.severity === "HIGH"
                    ? "from-rose-500/20"
                    : incident.severity === "MEDIUM"
                      ? "from-amber-500/20"
                      : "from-emerald-500/20",
              )}
            >
              <div className="h-16 w-16 rounded-full bg-primary/20 border-4 border-card shadow-lg flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mt-4 text-center">
                {incident.title}
              </h2>
              <div className="flex items-center gap-2 mt-3">
                <Badge colorClassName={getSeverityBadge(incident.severity)}>
                  {incident.severity}
                </Badge>
                <Badge colorClassName={getStatusBadge(incident.status)}>
                  {incident.status.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>

            {/* Quick details */}
            <div className="p-5 space-y-3 border-t border-border">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Occurred</p>
                  <p className="text-foreground">{formatDateTime(incident.occurrenceTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Reported</p>
                  <p className="text-foreground">{formatDateTime(incident.reportedAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-foreground font-medium capitalize">
                    {incident.incidentType.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Site Info Card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Site Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Site</p>
                <Link
                  href={`/sites/${incident.site.id}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {incident.site.name}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm text-foreground flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  {incident.site.address}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risk Level</p>
                <Badge colorClassName={getRiskBadge(incident.site.riskLevel)}>
                  {incident.site.riskLevel}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Client</p>
                <p className="text-sm text-foreground">{incident.site.client.companyName}</p>
              </div>
            </div>
          </div>

          {/* Reporter Info Card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <UserCircle className="h-4 w-4" /> Reported By
            </h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {incident.reporter.firstName[0]}
                {incident.reporter.lastName[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {incident.reporter.firstName} {incident.reporter.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{incident.reporter.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Details & Timeline */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Description
            </h3>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {incident.description}
            </p>
          </div>

          {/* Timeline / Status Updates */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Incident Timeline
            </h3>
            <div className="space-y-0">
              {timelineEntries.map((entry, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                        entry.bgColor,
                      )}
                    >
                      <entry.icon className={cn("h-4 w-4", entry.color)} />
                    </div>
                    {idx < timelineEntries.length - 1 && (
                      <div className="w-px flex-1 bg-border my-1" />
                    )}
                  </div>
                  <div className={cn("pb-6", idx === timelineEntries.length - 1 && "pb-0")}>
                    <p className="text-sm font-medium text-foreground">{entry.label}</p>
                    {entry.date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTime(entry.date)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Investigation Status */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" /> Investigation Status
            </h3>
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg p-4",
                incident.investigationStatus === "RESOLVED" || incident.investigationStatus === "CLOSED"
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : incident.investigationStatus === "UNDER_INVESTIGATION"
                    ? "bg-blue-500/10 border border-blue-500/20"
                    : "bg-rose-500/10 border border-rose-500/20",
              )}
            >
              {incident.investigationStatus === "RESOLVED" || incident.investigationStatus === "CLOSED" ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              ) : (
                <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
              )}
              <div>
                <p className="font-semibold text-foreground capitalize">
                  {incident.investigationStatus.replace(/_/g, " ")}
                </p>
                {incident.resolutionNotes && (
                  <p className="text-xs text-muted-foreground mt-1">{incident.resolutionNotes}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions Taken */}
          {incident.actionsTaken && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Actions Taken
              </h3>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {incident.actionsTaken}
              </p>
            </div>
          )}

          {/* Guards Involved */}
          {guardsList.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" /> Guards Involved
              </h3>
              <div className="space-y-2">
                {guardsList.map((guard: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm text-foreground bg-secondary/20 rounded-lg px-3 py-2"
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{typeof guard === "string" ? guard : guard.name || guard.fullName || JSON.stringify(guard)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Witnesses */}
          {witnessesList.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4" /> Witnesses
              </h3>
              <div className="space-y-2">
                {witnessesList.map((witness: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm text-foreground bg-secondary/20 rounded-lg px-3 py-2"
                  >
                    <UserCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>
                      {typeof witness === "string"
                        ? witness
                        : witness.name || `${witness.firstName || ""} ${witness.lastName || ""}`.trim() || JSON.stringify(witness)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {photosList.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Camera className="h-4 w-4" /> Photos ({photosList.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photosList.map((photo: string, i: number) => (
                  <div
                    key={i}
                    className="aspect-video rounded-lg bg-secondary/20 flex items-center justify-center overflow-hidden"
                  >
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {videosList.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Video className="h-4 w-4" /> Videos ({videosList.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {videosList.map((video: string, i: number) => (
                  <div
                    key={i}
                    className="aspect-video rounded-lg bg-secondary/20 flex items-center justify-center overflow-hidden"
                  >
                    <Video className="h-6 w-6 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
