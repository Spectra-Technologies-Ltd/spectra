"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Shield,
  Calendar,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  UserX,
  ExternalLink,
  ChevronRight,
  Loader2,
  IdCard,
  Building2,
  UserCheck,
  Camera,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GuardDetail {
  id: string;
  fullName: string;
  photoUrl: string | null;
  phone: string;
  address: string;
  emergencyContact: string;
  nin: string;
  bvn: string | null;
  guarantorDetails: string;
  employmentDate: string;
  status: string;
  currentShift: string;
  performanceScore: number;
  trainingRecords: string;
  certificates: string;
  backgroundVerification: string;
  disciplinaryHistory: string;
  assignedSite: { id: string; name: string; address: string } | null;
  assignedSupervisor: { id: string; firstName: string; lastName: string } | null;
  attendances: {
    id: string;
    checkInTime: string;
    checkOutTime: string | null;
    status: string;
    site: { name: string };
  }[];
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "ON_LEAVE":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "SUSPENDED":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "INACTIVE":
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}

function getShiftBadge(shift: string) {
  switch (shift) {
    case "DAY":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "NIGHT":
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
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
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPerformanceColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 70) return "text-amber-400";
  return "text-rose-400";
}

export default function GuardProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: guard, isLoading } = useQuery<GuardDetail>({
    queryKey: ["guard", id],
    queryFn: async () => {
      const res = await api.get(`/guards/${id}`);
      return res.data;
    },
  });

  const photoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post(`/uploads/guard/${id}/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guard", id] });
      setUploading(false);
    },
    onError: () => {
      setUploading(false);
    },
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
          <p>Loading guard profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!guard) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <UserX className="h-12 w-12 mb-3 opacity-20" />
          <p>Guard not found.</p>
          <button
            onClick={() => router.push("/guards")}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Back to directory
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const bgCheck = (() => {
    try {
      return JSON.parse(guard.backgroundVerification);
    } catch {
      return { status: "UNKNOWN" };
    }
  })();

  const trainingList = (() => {
    try {
      return JSON.parse(guard.trainingRecords);
    } catch {
      return [];
    }
  })();

  const certList = (() => {
    try {
      return JSON.parse(guard.certificates);
    } catch {
      return [];
    }
  })();

  const disciplineList = (() => {
    try {
      return JSON.parse(guard.disciplinaryHistory);
    } catch {
      return [];
    }
  })();

  return (
    <DashboardLayout>
      {/* Back button */}
      <button
        onClick={() => router.push("/guards")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to directory
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN — Identity Card */}
        <div className="lg:col-span-1 space-y-5">
          {/* Photo & Name Card */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="bg-gradient-to-b from-primary/20 to-card p-6 flex flex-col items-center">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {guard.photoUrl ? (
                  <img
                    src={guard.photoUrl}
                    alt={guard.fullName}
                    className="h-28 w-28 rounded-full object-cover border-4 border-card shadow-lg"
                  />
                ) : (
                  <div className="h-28 w-28 rounded-full bg-primary/20 border-4 border-card shadow-lg flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary">
                      {guard.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {uploading ? "Uploading..." : "Click photo to change"}
              </p>
              <h2 className="text-xl font-bold text-foreground mt-4">
                {guard.fullName}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                    getStatusBadge(guard.status),
                  )}
                >
                  {guard.status.replace("_", " ")}
                </span>
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                    getShiftBadge(guard.currentShift),
                  )}
                >
                  {guard.currentShift}
                </span>
              </div>

              {/* Performance Score */}
              <div className="mt-4 flex items-center gap-3 bg-secondary/30 rounded-lg px-4 py-3 w-full max-w-[200px]">
                <Award className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p
                    className={cn(
                      "text-lg font-bold",
                      getPerformanceColor(guard.performanceScore),
                    )}
                  >
                    {guard.performanceScore}%
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Performance Score
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="p-5 space-y-3 border-t border-border">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{guard.phone}</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-foreground">{guard.address}</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Emergency Contact
                  </p>
                  <p className="text-foreground font-medium">
                    {guard.emergencyContact}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Identification Card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <IdCard className="h-4 w-4" /> Identification
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">NIN</p>
                <p className="text-sm font-mono text-foreground">{guard.nin}</p>
              </div>
              {guard.bvn && (
                <div>
                  <p className="text-xs text-muted-foreground">BVN</p>
                  <p className="text-sm font-mono text-foreground">
                    ••••{guard.bvn.slice(-4)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Guarantor</p>
                <p className="text-sm text-foreground">
                  {guard.guarantorDetails}
                </p>
              </div>
            </div>
          </div>

          {/* Employment Card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Employment
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Employed Since</p>
                <p className="text-sm text-foreground">
                  {formatDate(guard.employmentDate)}
                </p>
              </div>
              {guard.assignedSite && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Assigned Site
                  </p>
                  <button
                    onClick={() =>
                      router.push(`/sites`)
                    }
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    {guard.assignedSite.name}
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              )}
              {guard.assignedSupervisor && (
                <div>
                  <p className="text-xs text-muted-foreground">Supervisor</p>
                  <p className="text-sm text-foreground flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    {guard.assignedSupervisor.firstName}{" "}
                    {guard.assignedSupervisor.lastName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Activity & Records */}
        <div className="lg:col-span-2 space-y-5">
          {/* Background Verification */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" /> Background Verification
            </h3>
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg p-4",
                bgCheck.status === "VERIFIED"
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : bgCheck.status === "PENDING"
                    ? "bg-amber-500/10 border border-amber-500/20"
                    : "bg-rose-500/10 border border-rose-500/20",
              )}
            >
              {bgCheck.status === "VERIFIED" ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              ) : bgCheck.status === "PENDING" ? (
                <Clock className="h-6 w-6 text-amber-400" />
              ) : (
                <XCircle className="h-6 w-6 text-rose-400" />
              )}
              <div>
                <p className="font-semibold text-foreground capitalize">
                  {bgCheck.status}
                </p>
                {bgCheck.date && (
                  <p className="text-xs text-muted-foreground">
                    Verified on {formatDate(bgCheck.date)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Training & Certificates */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Award className="h-4 w-4" /> Training & Certificates
            </h3>

            {trainingList.length > 0 || certList.length > 0 ? (
              <div className="space-y-4">
                {trainingList.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      Training Records
                    </p>
                    <div className="space-y-2">
                      {trainingList.map((training: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm bg-secondary/20 rounded-lg px-3 py-2">
                          <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-foreground">{typeof training === 'string' ? training : training.course || training.name}</p>
                            {(training.date || training.expiry) && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {training.date && `Completed: ${formatDate(training.date)}`}
                                {training.expiry && ` · Expires: ${formatDate(training.expiry)}`}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {certList.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      Certificates
                    </p>
                    <div className="space-y-2">
                      {certList.map((cert: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm bg-secondary/20 rounded-lg px-3 py-2">
                          <Award className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-foreground">{typeof cert === 'string' ? cert : cert.name}</p>
                            {(cert.issued || cert.issuer) && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {cert.issuer && `${cert.issuer}`}
                                {cert.issued && ` · ${formatDate(cert.issued)}`}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No training records or certificates on file.
              </p>
            )}
          </div>

          {/* Disciplinary History */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Disciplinary History
            </h3>
            {disciplineList.length > 0 ? (
              <div className="space-y-3">
                {disciplineList.map((entry: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-secondary/20 rounded-lg p-3"
                  >
                    <div className="h-2 w-2 rounded-full bg-rose-400 mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        {entry.reason || entry.incident || entry}
                      </p>
                      {entry.date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(entry.date)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No disciplinary incidents on record.
              </p>
            )}
          </div>

          {/* Recent Attendance */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Recent Attendance (Last 10)
              </h3>
            </div>
            {guard.attendances.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Site</th>
                      <th className="px-5 py-3 font-medium">Check-in</th>
                      <th className="px-5 py-3 font-medium">Check-out</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {guard.attendances.map((att) => (
                      <tr
                        key={att.id}
                        className="hover:bg-secondary/20 transition-colors"
                      >
                        <td className="px-5 py-3 text-foreground">
                          {att.site.name}
                        </td>
                        <td className="px-5 py-3 text-foreground font-mono text-xs">
                          {formatDateTime(att.checkInTime)}
                        </td>
                        <td className="px-5 py-3 text-foreground font-mono text-xs">
                          {formatDateTime(att.checkOutTime)}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                              att.status === "ON_TIME"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20",
                            )}
                          >
                            {att.status || "UNKNOWN"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5 text-center text-sm text-muted-foreground">
                No attendance records found.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
