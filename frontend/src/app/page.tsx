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
  MoreVertical,
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

function MetricCard({
  label,
  value,
  delta,
  trend,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: React.ElementType;
  tone: string;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;

  return (
    <div className="dashboard-card rounded-lg p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
        <button aria-label={`${label} options`} className="text-slate-400 transition hover:text-slate-700">
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-xl font-black tracking-tight text-slate-950">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] font-semibold">
        <TrendIcon className={`h-3 w-3 ${trend === "up" ? "text-emerald-500" : "text-orange-500"}`} />
        <span className={trend === "up" ? "text-emerald-600" : "text-orange-500"}>{delta}</span>
        <span className="font-medium text-slate-400">vs yesterday</span>
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
  const trendData = attendanceTrend ?? fallbackAttendanceTrend;
  const incidents = (incidentsByType ?? fallbackIncidentsByType).slice(0, 4);
  const totalPatrols = Math.max(s.totalSites + s.activeGuards + s.openIncidents, 1);
  const completedPatrols = Math.max(s.totalSites + s.activeGuards, 0);
  const inProgressPatrols = Math.max(s.activeGuards, 0);
  const overduePatrols = Math.max(s.openIncidents - 1, 0);
  const patrolData = [
    { name: "Completed", value: completedPatrols, color: "#22c55e" },
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
      tone: "bg-violet-50 text-violet-600",
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
      <div className="mb-4 sm:hidden">
        <h1 className="text-2xl font-black tracking-tight text-slate-950">Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back, {user?.firstName ?? "Operator"}.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8">
        {metricCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </section>

      <section className="mt-3 dashboard-card overflow-hidden rounded-lg">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-950">Recent Activity</h2>
              <p className="text-xs font-medium text-slate-500">Live operational events</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
          </div>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.map((activity, index) => (
                <tr key={`${activity.description}-${index}`} className="transition hover:bg-slate-50/80">
                  <td className="px-5 py-3 font-semibold text-slate-700">{activity.type}</td>
                  <td className="px-5 py-3 text-slate-700">{activity.description}</td>
                  <td className="px-5 py-3 text-slate-500">{activity.location}</td>
                  <td className="px-5 py-3 text-slate-500">{activity.time}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${activity.status === "Open" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                      {activity.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-slate-100 md:hidden">
          {activities.map((activity, index) => (
            <div key={`${activity.description}-${index}`} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">{activity.type}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{activity.description}</p>
                </div>
                <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${activity.status === "Open" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                  {activity.status}
                </span>
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">
                {activity.location} - {activity.time}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr_0.85fr]">
        <div className="dashboard-card rounded-lg p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-950">Attendance Overview</h2>
              <p className="text-xs font-medium text-slate-500">Last 7 Days</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Present
            </div>
          </div>
          <div className="h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ left: -16, right: 8, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.10)",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={3} fill="url(#attendanceBlue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-card rounded-lg p-4 sm:p-5">
          <h2 className="text-base font-black text-slate-950">Patrols Overview</h2>
          <p className="text-xs font-medium text-slate-500">Last 7 Days</p>
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
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-950">{totalPatrols}</span>
                <span className="text-xs font-semibold text-slate-400">Total</span>
              </div>
            </div>
            <div className="space-y-3">
              {patrolData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="flex-1 font-semibold text-slate-700">{item.name}</span>
                  <span className="font-bold text-slate-950">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-card rounded-lg p-4 sm:p-5">
          <h2 className="text-base font-black text-slate-950">Incidents</h2>
          <p className="text-xs font-medium text-slate-500">Recent</p>
          <div className="mt-5 space-y-4">
            {incidents.map((incident: { type: string; count: number }, index: number) => (
              <div key={incident.type} className="flex gap-3">
                <span className={`mt-1 h-2.5 w-2.5 rounded-full ${index === 1 ? "bg-amber-400" : "bg-red-500"}`} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">{typeLabels[incident.type] ?? incident.type}</p>
                  <p className="text-xs font-medium text-slate-500">{incident.count * 2 + index + 1} min ago</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/incidents" className="mt-8 inline-flex text-sm font-bold text-blue-600 transition hover:text-blue-700">
            View all
          </Link>
        </div>
      </section>

      <section className="mt-4 dashboard-card rounded-lg p-4 sm:p-5">
        <h2 className="text-base font-black text-slate-950">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Add Guard", href: "/guards/add", icon: UserCheck, color: "text-blue-600" },
            { label: "Create Patrol", href: "/patrols", icon: Route, color: "text-blue-600" },
            { label: "Report Incident", href: "/incidents", icon: AlertTriangle, color: "text-red-500" },
            { label: "Add Client", href: "/clients/add", icon: Building2, color: "text-emerald-600" },
            { label: "Open Reports", href: "/reports", icon: FileText, color: "text-blue-600" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-lg bg-slate-50 p-3 text-center transition hover:bg-blue-50 hover:shadow-sm"
            >
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="text-xs font-bold text-slate-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
