"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="대시보드 로딩 중">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28 md:col-span-2 xl:col-span-2" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-5">
          <Skeleton className="mb-4 h-5 w-32" />
          <Skeleton className="mb-3 h-10 w-full max-w-xs" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-5">
          <Skeleton className="mb-4 h-5 w-40" />
          <Skeleton className="h-64 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
