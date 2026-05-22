"use client";

import { Skeleton } from "@/components/ui/Skeleton";

import { ChartSkeleton } from "@/components/dashboard/ChartSkeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="대시보드 로딩 중">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Skeleton className="mb-3 h-5 w-40" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>

      <Skeleton className="h-28 w-full rounded-2xl" />
      <div>
        <Skeleton className="mb-3 h-4 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>

      <section className="flex min-h-[420px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Skeleton className="mb-4 h-5 w-44" />
        <Skeleton className="mb-2 h-3 w-56" />
        <ChartSkeleton />
      </section>
    </div>
  );
}
