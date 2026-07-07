"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Route, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatrolRecord {
  id: string;
  status: string;
  startTime: string;
  endTime: string | null;
  completionPercentage: number;
  guard: { fullName: string };
  route: { name: string; site: { name: string } };
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "IN_PROGRESS":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "COMPLETED":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    default:
      return "bg-slate-500/10 text-slate-500 border-slate-500/20";
  }
}

export default function PatrolsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["patrols", page],
    queryFn: async () => {
      const res = await api.get("/patrols/history", {
        params: { page, limit: 20 },
      });
      return res.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Route className="h-6 w-6 text-primary" /> Patrol Tracking
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Monitor patrol history, completion rates, and guard activity.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Route</th>
                <th className="px-6 py-4 font-medium tracking-wider">Guard</th>
                <th className="px-6 py-4 font-medium tracking-wider">Site</th>
                <th className="px-6 py-4 font-medium tracking-wider">Started At</th>
                <th className="px-6 py-4 font-medium tracking-wider">Ended At</th>
                <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium tracking-wider">Completion %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading patrol data...
                    </div>
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <Route className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No patrol records found.</p>
                  </td>
                </tr>
              ) : (
                data?.data?.map((record: PatrolRecord) => (
                  <tr
                    key={record.id}
                    className="hover:bg-secondary/30 transition-colors group"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      {record.route.name}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {record.guard.fullName}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {record.route.site.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {formatDateTime(record.startTime)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {formatDateTime(record.endTime)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                          getStatusBadge(record.status),
                        )}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden max-w-[80px]">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${record.completionPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {record.completionPercentage}%
                        </span>
                      </div>
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
              Showing{" "}
              <span className="font-medium text-foreground">
                {data.data.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {data.meta.total}
              </span>{" "}
              entries
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
                onClick={() =>
                  setPage((p) => Math.min(data.meta.pages, p + 1))
                }
                disabled={
                  page === data.meta.pages || data.meta.pages === 0
                }
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
