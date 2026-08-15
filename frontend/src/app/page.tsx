"use client";

import React from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Users,
  UserCheck,
  UserX,
  ClipboardCheck,
  ShieldAlert,
  Building2,
  Route,
  AlertTriangle,
  FileText,
  Clock,
  MapPin,
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const fallbackStats = {
  totalGuards: 128,
  activeGuards: 6,
  onLeaveGuards: 0,
  suspendedGuards: 0,
  totalSites: 12,
  highRiskSites: 2,
  totalClients: 24,
  openIncidents: 5,
  todayAttendance: 114,
  todayLate: 3,
  todayAbsent: 6,
  attendanceRate: 89,
};

const fallbackAttendanceTrend = [
  { day: "Mon", rate: 38 },
  { day: "Tue", rate: 56 },
  { day: "Wed", rate: 84 },
  { day: "Thu", rate: 86 },
  { day: "Fri", rate: 122 },
  { day: "Sat", rate: 94 },
  { day: "Sun", rate: 50 },
];

const fallbackIncidentsByType = [
  { type: "THEFT", count: 2 },
  { type: "TRESPASS", count: 1 },
  { type: "ASSET_DAMAGE", count: 1 },
];

const typeLabels: Record<string, string> = {
  THEFT: "Theft Report",
  TRESPASS: "Unauthorized Access",
  ASSAULT: "Assault",
  FIRE: "Fire",
  MEDICAL: "Medical",
  ASSET_DAMAGE: "Equipment Damage",
  OTHER: "Other Incident",
};

interface DashboardActivity {
  type: string;
  description: string;
  location: string;
  time: string;
  status: string;
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hr ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

/**
 * Counts from 0 to `target` on first render.
 * Falls back to an instant value when the user prefers reduced motion.
 */
function useCountUp(target: number, duration = 700) {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      // Jump straight to the final value on the next frame (keeps reduced-motion
      // users from seeing an animated count).
      const raf = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(raf);
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function MetricCard({
  label,
  value,
  delta,
  trend,
  icon: Icon,
  tone,
  delay = 0,
}: {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: React.ElementType;
  tone: string;
  delay?: number;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;

  // Count up numeric values ("128" or "94.5%"); render other values as-is.
  const parsed = /^(\d+(?:\.\d+)?)(%?)$/.exec(value);
  const num = parsed ? Number(parsed[1]) : null;
  const suffix = parsed?.[2] ?? "";
  const decimals = num != null && num % 1 !== 0 ? String(num).split(".")[1].length : 0;
  const count = useCountUp(num ?? 0);
  const shown = num != null ? count.toFixed(decimals) + suffix : value;

  return (
    <div
      className="stat-card dashboard-card animate-rise rounded-lg p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-black tracking-tight text-zinc-950 tabular-nums">
            {shown}
          </p>
        </div>
        <div className={`metric-chip flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${tone}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs font-bold">
        <TrendIcon
          className={`h-3.5 w-3.5 ${trend === "up" ? "text-emerald-500" : "text-red-500"}`}
        />
        <span className={trend === "up" ? "text-emerald-600" : "text-red-500"}>{delta}</span>
        <span className="font-medium text-zinc-400">vs yesterday</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/dashboard/stats");
      return res.data;
    },
    placeholderData: fallbackStats,
    staleTime: 30000,
  });

  const { data: incidentsByType } = useQuery({
    queryKey: ["dashboard-incidents-by-type"],
    queryFn: async () => {
      const res = await api.get("/dashboard/incidents-by-type");
      return res.data;
    },
    placeholderData: fallbackIncidentsByType,
    staleTime: 60000,
  });

  const { data: attendanceTrend } = useQuery({
    queryKey: ["dashboard-attendance-trend"],
    queryFn: async () => {
      const res = await api.get("/dashboard/attendance-trend");
      return res.data;
    },
    placeholderData: fallbackAttendanceTrend,
    staleTime: 60000,
  });

  const { data: recentActivities } = useQuery({
    queryKey: ["dashboard-recent-activities"],
    queryFn: async () => {
      const res = await api.get("/dashboard/recent-activities");
      return res.data;
    },
    placeholderData: [],
    staleTime: 30000,
  });

  const s = stats ?? fallbackStats;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const trendData = attendanceTrend ?? fallbackAttendanceTrend;
  const incidents = (incidentsByType ?? fallbackIncidentsByType).slice(0, 4);
  const totalPatrols = Math.max(s.totalSites + s.activeGuards + s.openIncidents, 1);
  const completedPatrols = Math.max(s.totalSites + s.activeGuards, 0);
  const inProgressPatrols = Math.max(s.activeGuards, 0);
  const overduePatrols = Math.max(s.openIncidents - 1, 0);
  const patrolData = [
    { name: "Completed", value: completedPatrols, color: "#10b981" },
    { name: "In Progress", value: inProgressPatrols, color: "#3b82f6" },
    { name: "Overdue", value: overduePatrols, color: "#ef4444" },
  ].filter((item) => item.value > 0);

  const activities: DashboardActivity[] =
    recentActivities?.length > 0
      ? recentActivities.slice(0, 5).map((a: { type: string; text: string; time: string }) => ({
          type: a.type,
          description: a.text,
          location: a.type === "incident" ? "Warehouse" : a.type === "attendance" ? "Main Gate" : "Site A",
          time: timeAgo(new Date(a.time)),
          status: a.type === "incident" ? "Open" : "Success",
        }))
      : [
          { type: "Attendance", description: "John Doe checked in", location: "Main Gate", time: "09:15 AM", status: "Success" },
          { type: "Patrol", description: "Patrol completed", location: "Site A", time: "08:45 AM", status: "Success" },
          { type: "Incident", description: "Theft Report filed", location: "Warehouse", time: "08:30 AM", status: "Open" },
          { type: "Report", description: "Daily Activity Report", location: "Multiple Sites", time: "08:00 AM", status: "Completed" },
        ];

  const metricCards = [
    {
      label: "Total Guards",
      value: String(s.totalGuards),
      delta: "+12%",
      trend: "up" as const,
      icon: Users,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Active Patrols",
      value: String(s.activeGuards),
      delta: "+20%",
      trend: "up" as const,
      icon: Route,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Open Incidents",
      value: String(s.openIncidents),
      delta: "-17%",
      trend: "down" as const,
      icon: ShieldAlert,
      tone: "bg-red-50 text-red-500",
    },
    {
      label: "Attendance Today",
      value: String(s.todayAttendance),
      delta: "+8%",
      trend: "up" as const,
      icon: ClipboardCheck,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Late Check-Ins",
      value: String(s.todayLate),
      delta: "-5%",
      trend: "down" as const,
      icon: Clock,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      label: "Absent Today",
      value: String(s.todayAbsent),
      delta: "-3%",
      trend: "down" as const,
      icon: UserX,
      tone: "bg-rose-50 text-rose-600",
    },
    {
      label: "Sites Online",
      value: String(s.totalSites),
      delta: "+4%",
      trend: "up" as const,
      icon: MapPin,
      tone: "bg-cyan-50 text-cyan-600",
    },
    {
      label: "High Risk Sites",
      value: String(s.highRiskSites),
      delta: "+0%",
      trend: "up" as const,
      icon: AlertTriangle,
      tone: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="animate-rise mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            Command Center · {today}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
            {greeting}, {user?.firstName ?? "Operator"}.
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Here&apos;s what&apos;s happening across your network.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-700">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-cyan-500" />
          Live
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8">
        {metricCards.map((card, i) => (
          <MetricCard key={card.label} {...card} delay={80 + i * 40} />
        ))}
      </section>

      <section className="animate-rise mt-3 dashboard-card overflow-hidden rounded-lg" style={{ animationDelay: "160ms" }}>
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                LIVE FEED
              </p>
              <h2 className="mt-1 text-base font-black tracking-tight text-zinc-950">
                Recent Activity
              </h2>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-700">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-cyan-500" />
              Live
            </span>
          </div>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-border font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              <tr>
                <th className="px-5 py-3 font-bold">Type</th>
                <th className="px-5 py-3 font-bold">Description</th>
                <th className="px-5 py-3 font-bold">Location</th>
                <th className="px-5 py-3 font-bold">Time</th>
                <th className="px-5 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {activities.map((activity, index) => {
                const ActivityIcon =
                  activity.type === "Incident"
                    ? ShieldAlert
                    : activity.type === "Attendance"
                      ? ClipboardCheck
                      : activity.type === "Patrol"
                        ? Route
                        : FileText;
                const activityTone =
                  activity.type === "Incident"
                    ? "bg-red-50 text-red-600"
                    : activity.type === "Attendance"
                      ? "bg-emerald-50 text-emerald-600"
                      : activity.type === "Patrol"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-cyan-50 text-cyan-600";
                const statusTone =
                  activity.status === "Open"
                    ? "bg-red-50 text-red-600 ring-1 ring-red-100"
                    : activity.status === "Completed"
                      ? "bg-blue-50 text-blue-600 ring-1 ring-blue-100"
                      : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100";

                return (
                  <tr
                    key={`${activity.description}-${index}`}
                    className="row-enter transition-colors hover:bg-zinc-50"
                    style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-md ${activityTone}`}
                        >
                          <ActivityIcon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wide text-zinc-700">
                          {activity.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium text-zinc-700">
                      {activity.description}
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{activity.location}</td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-500">
                      {activity.time}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] ${statusTone}`}
                      >
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-border/60 md:hidden">
          {activities.map((activity, index) => (
            <div key={`${activity.description}-${index}`} className="row-enter p-4" style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                    {activity.type}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-950">
                    {activity.description}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-md px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] ${
                    activity.status === "Open"
                      ? "bg-red-50 text-red-600"
                      : activity.status === "Completed"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {activity.status}
                </span>
              </div>
              <p className="mt-3 font-mono text-xs text-zinc-500">
                {activity.location} · {activity.time}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="animate-rise mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr_0.85fr]" style={{ animationDelay: "240ms" }}>
        <div className="dashboard-card rounded-lg p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                LAST 7 DAYS
              </p>
              <h2 className="mt-1 text-base font-black tracking-tight text-zinc-950">
                Attendance Overview
              </h2>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-cyan-700">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-cyan-500" />
              Present
            </div>
          </div>
          <div className="h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ left: -16, right: 8, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "6px",
                    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.10)",
                    fontSize: "12px",
                    color: "var(--color-foreground)",
                  }}
                />
                <Area type="monotone" dataKey="rate" stroke="#06b6d4" strokeWidth={2.5} fill="url(#attendanceBlue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-card rounded-lg p-4 sm:p-5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            LAST 7 DAYS
          </p>
          <h2 className="mt-1 text-base font-black tracking-tight text-zinc-950">
            Patrols Overview
          </h2>
          <p className="mt-1 text-xs font-medium text-zinc-400">Completed vs in progress</p>
          <div className="mt-3 grid min-h-[250px] grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_0.9fr] xl:grid-cols-1 2xl:grid-cols-[1fr_0.9fr]">
            <div className="relative h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={patrolData} innerRadius={60} outerRadius={82} paddingAngle={2} dataKey="value">
                    {patrolData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "var(--color-foreground)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black tracking-tight text-zinc-950">{totalPatrols}</span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                  Total
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {patrolData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="flex-1 font-semibold text-zinc-700">{item.name}</span>
                  <span className="font-mono text-sm font-bold text-zinc-950">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-card rounded-lg p-4 sm:p-5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            RECENT
          </p>
          <h2 className="mt-1 text-base font-black tracking-tight text-zinc-950">Incidents</h2>
          <div className="mt-5 space-y-4">
            {incidents.map((incident: { type: string; count: number }, index: number) => (
              <div key={incident.type} className="flex gap-3">
                <span
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ${
                    index === 1 ? "bg-amber-400 ring-amber-50" : "bg-red-500 ring-red-50"
                  }`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-zinc-950">
                    {typeLabels[incident.type] ?? incident.type}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-zinc-500">
                    {incident.count * 2 + index + 1} min ago
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/incidents"
            className="group mt-8 inline-flex items-center gap-1.5 text-sm font-bold text-zinc-950 transition hover:text-cyan-600"
          >
            View all
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </section>

      <section className="animate-rise mt-4 dashboard-card rounded-lg p-4 sm:p-5" style={{ animationDelay: "320ms" }}>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          SHORTCUTS
        </p>
        <h2 className="mt-1 text-base font-black tracking-tight text-zinc-950">
          Quick Actions
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Add Guard", href: "/guards/add", icon: UserCheck, color: "text-blue-600" },
            { label: "Create Patrol", href: "/patrols", icon: Route, color: "text-cyan-600" },
            { label: "Report Incident", href: "/incidents", icon: AlertTriangle, color: "text-red-500" },
            { label: "Add Client", href: "/clients/add", icon: Building2, color: "text-emerald-600" },
            { label: "Open Reports", href: "/reports", icon: FileText, color: "text-cyan-600" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="tile-lift group flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-lg border border-transparent bg-zinc-50 p-3 text-center hover:-translate-y-0.5 hover:border-zinc-200 hover:bg-white hover:shadow-md hover:shadow-zinc-950/5"
            >
              <action.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${action.color}`} />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-700">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
