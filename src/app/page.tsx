"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { ActivityTable } from "@/components/dashboard/ActivityTable";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { EmissionsChart } from "@/components/dashboard/EmissionsChart";
import { ErrorBanner } from "@/components/dashboard/ErrorBanner";
import { KpiSummary } from "@/components/dashboard/KpiSummary";
import { Sidebar } from "@/components/dashboard/Sidebar";
import {
  computeChartSlices,
  computeKpiSummary,
  filterEmissions,
  getUniquePeriods,
  type CategoryFilter,
  type PeriodFilter,
} from "@/lib/emission-stats";
import {
  getEmissionErrorMessage,
  useEmissionStore,
} from "@/store/useEmissionStore";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const { emissions, isLoading, error, fetchEmissions } = useEmissionStore(
    useShallow((state) => ({
      emissions: state.emissions,
      isLoading: state.isLoading,
      error: state.error,
      fetchEmissions: state.fetchEmissions,
    })),
  );

  useEffect(() => {
    void fetchEmissions();
  }, [fetchEmissions]);

  const handleRetry = useCallback(() => {
    void fetchEmissions();
  }, [fetchEmissions]);

  const errorMessage = getEmissionErrorMessage(error);
  const hasCachedData = emissions.length > 0;
  const isInitialLoading = isLoading && !hasCachedData;

  const periods = useMemo(() => getUniquePeriods(emissions), [emissions]);

  const filteredEmissions = useMemo(
    () =>
      filterEmissions(emissions, {
        period: periodFilter,
        category: categoryFilter,
      }),
    [emissions, periodFilter, categoryFilter],
  );

  const kpi = useMemo(
    () => computeKpiSummary(filteredEmissions),
    [filteredEmissions],
  );

  const chartSlices = useMemo(
    () => computeChartSlices(filteredEmissions),
    [filteredEmissions],
  );

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="메뉴 열기"
            >
              메뉴
            </button>
            <div>
              <h1 className="text-lg font-semibold">PCF 탄소 배출 대시보드</h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                활동 데이터 × 배출계수 기반 kgCO₂e 분석
              </p>
            </div>
          </div>
          {isLoading && hasCachedData ? (
            <span className="text-xs font-medium text-emerald-700">
              데이터 갱신 중…
            </span>
          ) : null}
        </header>

        <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
          {errorMessage ? (
            <ErrorBanner
              message={errorMessage}
              hasCachedData={hasCachedData}
              isRetrying={isLoading}
              onRetry={handleRetry}
            />
          ) : null}

          {isInitialLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              <KpiSummary kpi={kpi} />

              <div className="grid gap-6 xl:grid-cols-2">
                <ActivityTable
                  rows={filteredEmissions}
                  periods={periods}
                  periodFilter={periodFilter}
                  categoryFilter={categoryFilter}
                  onPeriodChange={setPeriodFilter}
                  onCategoryChange={setCategoryFilter}
                />
                <EmissionsChart slices={chartSlices} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
