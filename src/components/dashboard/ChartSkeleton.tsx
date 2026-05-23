"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export function ChartSkeleton() {
  return (
    <div
      className="grid min-h-[280px] flex-1 gap-6 lg:grid-cols-2"
      aria-hidden
    >
      <Skeleton className="min-h-[256px] w-full rounded-xl" />
      <Skeleton className="min-h-[256px] w-full rounded-xl" />
    </div>
  );
}
