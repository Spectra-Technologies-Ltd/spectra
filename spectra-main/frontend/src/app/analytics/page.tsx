"use client";

import React from "react";
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
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { Download, Calendar, BarChart3 } from "lucide-react";

const typeLabels: Record<string, string> = {
  THEFT: "Theft",
  TRESPASS: "Trespass",
  ASSAULT: "Assault",
  FIRE: "Fire",
  MEDICAL: "Medical",
  ASSET_DAMAGE: "Asset Damage",
  OTHER: "Other",
};

const riskColors: Record<string, string> = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
  CRITICAL: "#dc2626",
};

export default function AnalyticsPage() {
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
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-secondary rounded-lg border border-border px-3 py-1.5">
            <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
            <span className="text-sm font-medium text-foreground">
              Last 7 Days
            </span>
          </div>
        </div>
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
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-foreground mb-4">
            Site Risk Distribution
          </h3>
          {siteRiskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={siteRiskData}
                margin={{ top: 5, right: 0, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="guardGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                />
                <Area
                  type="monotone"
                  dataKey="riskScore"
                  name="Risk Score"
                  stroke="#ef4444"
                  fill="url(#riskGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="guards"
                  name="Deployed Guards"
                  stroke="#3b82f6"
                  fill="url(#guardGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              No site data available
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
