"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  MapPin,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Activity,
  Shield,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Fallback mock data when API fails or DB is empty
const fallbackStats = {
  totalGuards: 0,
  activeGuards: 0,
  onLeaveGuards: 0,
  suspendedGuards: 0,
  totalSites: 0,
  highRiskSites: 0,
  totalClients: 0,
  openIncidents: 0,
  todayAttendance: 0,
  todayLate: 0,
  todayAbsent: 0,
  attendanceRate: 100,
};

const fallbackAttendanceTrend = [
  { day: "Mon", rate: 0 },
  { day: "Tue", rate: 0 },
  { day: "Wed", rate: 0 },
  { day: "Thu", rate: 0 },
  { day: "Fri", rate: 0 },
  { day: "Sat", rate: 0 },
  { day: "Sun", rate: 0 },
];

const fallbackIncidentsByType: { type: string; count: number }[] = [];
const fallbackSiteDistribution: {
  name: string;
  value: number;
  color: string;
}[] = [];

const riskColors: Record<string, string> = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
  CRITICAL: "#dc2626",
};

const typeLabels: Record<string, string> = {
  THEFT: "Theft",
  TRESPASS: "Trespass",
  ASSAULT: "Assault",
  FIRE: "Fire",
  MEDICAL: "Medical",
  ASSET_DAMAGE: "Asset Damage",
  OTHER: "Other",
};

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

  const { data: siteDistribution } = useQuery({
    queryKey: ["dashboard-site-risk"],
    queryFn: async () => {
      const res = await api.get("/dashboard/site-risk-distribution");
      return res.data;
    },
    placeholderData: fallbackSiteDistribution,
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

  const statsCards = [
    {
      label: "Total Guards",
      value: String(s.totalGuards),
      change: s.activeGuards > 0 ? `+${s.activeGuards} active` : "0",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active On-Duty",
      value: String(s.activeGuards),
      change: `${s.todayAttendance} checked in`,
      icon: UserCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Late Check-Ins",
      value: String(s.todayLate),
      change: "today",
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Absent Today",
      value: String(s.todayAbsent),
      change: "reported",
      icon: UserX,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
    {
      label: "Sites Online",
      value: String(s.totalSites),
      change: `${s.highRiskSites} high risk`,
      icon: MapPin,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Open Incidents",
      value: String(s.openIncidents),
      change: s.openIncidents > 0 ? `${s.openIncidents} open` : "none",
      icon: AlertTriangle,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      label: "High Risk Sites",
      value: String(s.highRiskSites),
      change: "monitored",
      icon: AlertCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "Attendance %",
      value: `${s.attendanceRate}%`,
      change: "today",
      icon: TrendingUp,
      color: "text-teal-400",
      bg: "bg-teal-500/10",
    },
  ];

  const siteDistData = (siteDistribution ?? fallbackSiteDistribution).map(
    (item: { riskLevel: string; count: number }) => ({
      name: `${item.riskLevel.charAt(0)}${item.riskLevel.slice(1).toLowerCase()} Risk`,
      value: item.count,
      color: riskColors[item.riskLevel] || "#64748b",
    }),
  );

  const incidentData = (incidentsByType ?? fallbackIncidentsByType).map(
    (item: { type: string; count: number }) => ({
      type: typeLabels[item.type] || item.type,
      count: item.count,
    }),
  );

  const activities = (recentActivities ?? []).map(
    (a: { type: string; text: string; time: string }) => ({
      ...a,
      time: timeAgo(new Date(a.time)),
    }),
  );

  return (
    <DashboardLayout>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Operations Command Center
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Welcome back, {user?.firstName}. Here is your real-time operational
          overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statsCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bg}`}
              >
                <card.icon className={`h-4.5 w-4.5 ${card.color}`} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {card.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Attendance Trend */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Weekly Attendance Rate
              </h3>
              <p className="text-xs text-muted-foreground">
                7-day performance overview
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              <TrendingUp className="h-3 w-3" /> {s.attendanceRate}% avg
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={attendanceTrend ?? fallbackAttendanceTrend}>
              <defs>
                <linearGradient
                  id="attendanceGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(215, 27.9%, 16.9%)"
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(224, 71%, 4%)",
                  border: "1px solid hsl(215, 27.9%, 16.9%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#attendanceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Site Risk Distribution */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Site Risk Distribution
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {s.totalSites} active sites
          </p>
          {siteDistData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={siteDistData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {siteDistData.map(
                      (entry: { color: string }, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ),
                    )}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(224, 71%, 4%)",
                      border: "1px solid hsl(215, 27.9%, 16.9%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {siteDistData.map(
                  (item: { name: string; value: number; color: string }) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name}: {item.value}
                    </div>
                  ),
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Incidents by Type */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Incidents by Type
              </h3>
              <p className="text-xs text-muted-foreground">
                Monthly incident breakdown
              </p>
            </div>
          </div>
          {incidentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={incidentData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(215, 27.9%, 16.9%)"
                />
                <XAxis
                  dataKey="type"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(224, 71%, 4%)",
                    border: "1px solid hsl(215, 27.9%, 16.9%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              No incidents recorded
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Real-Time Activity Feed
              </h3>
              <p className="text-xs text-muted-foreground">
                Live operational events
              </p>
            </div>
            <Activity className="h-4 w-4 text-primary animate-pulse" />
          </div>
          <div className="space-y-3">
            {activities.length > 0 ? (
              activities.map(
                (
                  activity: { type: string; text: string; time: string },
                  i: number,
                ) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div
                      className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                        activity.type === "incident"
                          ? "bg-red-400"
                          : activity.type === "late"
                            ? "bg-amber-400"
                            : activity.type === "attendance"
                              ? "bg-emerald-400"
                              : "bg-violet-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">
                        {activity.text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activity.time}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5" />
                  </div>
                ),
              )
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
