"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, Calendar, Filter, TrendingUp, AlertTriangle } from "lucide-react";

// Analytics page — incident metrics, attendance trends, and site risk distribution

const typeLabels: Record<string, string> = {
  THEFT: "Theft",
  TRESPASS: "Trespass",
  ASSAULT: "Assault",
  FIRE: "Fire",
  MEDICAL: "Medical",
  ASSET_DAMAGE: "Asset Damage",
  OTHER: "Other",
};

const INCIDENT_TYPES = [
  "THEFT", "TRESPASS", "ASSAULT", "FIRE", "MEDICAL", "ASSET_DAMAGE", "OTHER",
];

const TIME_PERIODS = [
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
];

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS[0]);
  const [incidentTypeFilter, setIncidentTypeFilter] = useState<string>("");

  const startDate = daysAgo(selectedPeriod.days);

  // Incident metrics from the dedicated metrics endpoint
  const { data: incidentMetrics } = useQuery({
    queryKey: ["analytics-incident-metrics", startDate, incidentTypeFilter],
    queryFn: async () => {
      const params: Record<string, string> = { startDate };
      if (incidentTypeFilter) params.type = incidentTypeFilter;
      const res = await api.get("/metrics/incidents", { params });
      return res.data;
    },
  });

  // Incident distribution by type (dashboard endpoint)
  const { data: incidentsByType } = useQuery({
    queryKey: ["analytics-incidents-by-type"],
    queryFn: async () => {
      const res = await api.get("/dashboard/incidents-by-type");
      return res.data;
    },
    placeholderData: [],
  });

  const { data: attendanceTrend } = useQuery({
    queryKey: ["analytics-attendance-trend"],
    queryFn: async () => {
      const res = await api.get("/dashboard/attendance-trend");
      return res.data;
    },
    placeholderData: [],
  });

  const { data: siteRiskDistribution } = useQuery({
    queryKey: ["analytics-site-risk"],
    queryFn: async () => {
      const res = await api.get("/dashboard/site-risk-distribution");
      return res.data;
    },
    placeholderData: [],
  });

  const incidentData = (incidentsByType ?? []).map(
    (item: { type: string; count: number }) => ({
      type: typeLabels[item.type] || item.type,
      count: item.count,
    }),
  );

  const siteRiskData = (siteRiskDistribution ?? []).map(
    (item: { riskLevel: string; count: number }) => ({
      name: `${item.riskLevel.charAt(0)}${item.riskLevel.slice(1).toLowerCase()} Risk`,
      riskScore: item.count * 25,
      guards: item.count * 10,
      incidents: item.count * 2,
    }),
  );

  // Daily breakdown for time-series chart
  const dailyBreakdownData = (incidentMetrics?.dailyBreakdown ?? []).map(
    (d: { date: string; count: number }) => ({
      day: new Date(d.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      Incidents: d.count,
    }),
  );

  const metrics = incidentMetrics ?? {
    total: 0,
    daily: 0,
    weekly: 0,
    open: 0,
    resolved: 0,
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Advanced Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Deep dive into operational metrics and performance trends.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time period dropdown */}
          <select
            value={selectedPeriod.label}
            onChange={(e) => {
              const period = TIME_PERIODS.find((p) => p.label === e.target.value);
              if (period) setSelectedPeriod(period);
            }}
            className="flex items-center gap-2 bg-secondary rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground cursor-pointer hover:bg-secondary/80 transition-colors"
          >
            <Calendar className="h-4 w-4 inline text-muted-foreground mr-1" />
            {TIME_PERIODS.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Incident type filter */}
          <select
            value={incidentTypeFilter}
            onChange={(e) => setIncidentTypeFilter(e.target.value)}
            className="flex items-center gap-2 bg-secondary rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground cursor-pointer hover:bg-secondary/80 transition-colors"
          >
            <Filter className="h-4 w-4 inline text-muted-foreground mr-1" />
            <option value="">All Incident Types</option>
            {INCIDENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {typeLabels[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Incident Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Incidents", value: metrics.total, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Today", value: metrics.daily, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Open", value: metrics.open, icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10" },
          { label: "Resolved", value: metrics.resolved, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
        ].map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.bg}`}>
                <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Distribution */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-4">
            Incidents by Type
          </h3>
          {incidentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={incidentData}
                margin={{ top: 5, right: 0, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(215, 27.9%, 16.9%)"
                />
                <XAxis
                  dataKey="type"
                  tick={{ fill: "#64748b", fontSize: 12 }}
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
                  }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              No incident data available
            </div>
          )}
        </div>

        {/* Incident Daily Trend (filtered) */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-4">
            Incident Trend ({selectedPeriod.label})
          </h3>
          {dailyBreakdownData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={dailyBreakdownData}
                margin={{ top: 5, right: 0, left: -20, bottom: 5 }}
              >
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
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(224, 71%, 4%)",
                    border: "1px solid hsl(215, 27.9%, 16.9%)",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Incidents"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              No incident trend data available
            </div>
          )}
        </div>

        {/* Attendance Trend */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-4">
            Attendance Rate Trend
          </h3>
          {attendanceTrend && attendanceTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={attendanceTrend}
                margin={{ top: 5, right: 0, left: -20, bottom: 5 }}
              >
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
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="Attendance %"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              No attendance data available
            </div>
          )}
        </div>

        {/* Site Risk Distribution */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-4">
            Site Risk Distribution
          </h3>
          {siteRiskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={siteRiskData}
                margin={{ top: 5, right: 0, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(215, 27.9%, 16.9%)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748b", fontSize: 12 }}
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
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="riskScore"
                  name="Risk Score"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.15}
                />
                <Area
                  type="monotone"
                  dataKey="guards"
                  name="Guards"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              No site risk data available
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
