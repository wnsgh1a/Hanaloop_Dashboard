"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { ActivityTable } from "@/components/dashboard/ActivityTable";
import { ActivityImportPanel } from "@/components/dashboard/ActivityImportPanel";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { EmissionsChart } from "@/components/dashboard/EmissionsChart";
import { ErrorBanner } from "@/components/dashboard/ErrorBanner";
import { KpiSummary } from "@/components/dashboard/KpiSummary";
import { Sidebar, type DashboardTab } from "@/components/dashboard/Sidebar";
import {
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

const TAB_HEADERS: Record<
  DashboardTab,
  { title: string; subtitle: string }
> = {
  dashboard: {
    title: "PCF 탄소 배출 대시보드",
    subtitle: "활동 데이터 × 배출계수 기반 kgCO₂e 요약·시각화",
  },
  activities: {
    title: "활동 데이터",
    subtitle: "임포트된 활동량·단위·배출량 레코드 조회 및 필터",
  },
};

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");
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
  const header = TAB_HEADERS[activeTab];

  const periods = useMemo(() => getUniquePeriods(emissions), [emissions]);

  const filteredEmissions = useMemo(
    () =>
      filterEmissions(emissions, {
        period: periodFilter,
        category: categoryFilter,
      }),
    [emissions, periodFilter, categoryFilter],
  );

  const kpi = useMemo(() => computeKpiSummary(emissions), [emissions]);

  return (
    <div className="flex min-h-screen items-start bg-slate-100 text-slate-900">
      <Sidebar
        open={sidebarOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClose={() => setSidebarOpen(false)}
      />

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
              <h1 className="text-lg font-semibold">{header.title}</h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                {header.subtitle}
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
          ) : activeTab === "dashboard" ? (
            <>
              <ActivityImportPanel />
              <KpiSummary kpi={kpi} />
              <EmissionsChart emissions={emissions} isLoading={isLoading} />
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                총{" "}
                <span className="font-semibold text-slate-900">
                  {emissions.length.toLocaleString("ko-KR")}
                </span>
                건 · 필터 적용 시{" "}
                <span className="font-semibold text-slate-900">
                  {filteredEmissions.length.toLocaleString("ko-KR")}
                </span>
                건 표시
              </p>
              <ActivityTable
                rows={filteredEmissions}
                periods={periods}
                periodFilter={periodFilter}
                categoryFilter={categoryFilter}
                onPeriodChange={setPeriodFilter}
                onCategoryChange={setCategoryFilter}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
