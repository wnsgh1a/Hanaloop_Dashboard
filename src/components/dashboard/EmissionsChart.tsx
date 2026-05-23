"use client";

import { memo, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartSkeleton } from "@/components/dashboard/ChartSkeleton";
import {
  CATEGORY_LABELS,
  computeChartSlices,
  filterEmissions,
  formatKgCO2e,
  getUniqueCategories,
  getUniquePeriods,
  type CategoryFilter,
  type PeriodFilter,
} from "@/lib/emission-stats";
import type { ActivityEmissionDto } from "@/lib/types";

const CHART_PLOT_HEIGHT = 256;
const FILTERED_EMPTY_MESSAGE =
  "선택한 조건에 해당하는 배출량 데이터가 없습니다.";

interface EmissionsChartProps {
  emissions: ActivityEmissionDto[];
  isLoading?: boolean;
}

function EmissionsChartComponent({
  emissions,
  isLoading = false,
}: EmissionsChartProps) {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const periods = useMemo(() => getUniquePeriods(emissions), [emissions]);
  const categories = useMemo(
    () => getUniqueCategories(emissions),
    [emissions],
  );

  const filteredEmissions = useMemo(
    () =>
      filterEmissions(emissions, {
        period: periodFilter,
        category: categoryFilter,
      }),
    [emissions, periodFilter, categoryFilter],
  );

  const slices = useMemo(
    () => computeChartSlices(filteredEmissions),
    [filteredEmissions],
  );

  const hasSourceData = emissions.length > 0;
  const hasFilteredRows = filteredEmissions.length > 0;
  const hasChartData = slices.length > 0;

  const tooltipFormatter = useMemo(
    () => (value: number) => formatKgCO2e(value),
    [],
  );

  const showFilteredEmpty =
    !isLoading && hasSourceData && (!hasFilteredRows || !hasChartData);

  return (
    <section
      aria-label="활동 유형별 배출량 차트"
      aria-busy={isLoading}
      className="relative flex min-h-[420px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <header className="mb-4 shrink-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              활동 유형별 배출 비교
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              전기 · 원소재 · 운송 그룹 기준 kgCO₂e 비율
            </p>
          </div>

          {hasSourceData ? (
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <label className="flex min-w-[9.5rem] flex-col gap-1 text-xs text-slate-500">
                기간
                <select
                  value={periodFilter}
                  onChange={(e) =>
                    setPeriodFilter(e.target.value as PeriodFilter)
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
                  aria-label="차트 기간 필터"
                >
                  <option value="all">전체 기간</option>
                  {periods.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-[9.5rem] flex-col gap-1 text-xs text-slate-500">
                카테고리
                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value as CategoryFilter)
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
                  aria-label="차트 카테고리 필터"
                >
                  <option value="all">전체 카테고리</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
        </div>
      </header>

      <div className="relative min-h-[280px] flex-1">
        {isLoading ? (
          <ChartSkeleton />
        ) : !hasSourceData ? (
          <div
            className="flex items-center justify-center text-sm text-slate-500"
            style={{ minHeight: CHART_PLOT_HEIGHT }}
          >
            표시할 배출 데이터가 없습니다.
          </div>
        ) : showFilteredEmpty ? (
          <div
            className="flex items-center justify-center px-4 text-center text-sm text-slate-500"
            style={{ minHeight: CHART_PLOT_HEIGHT }}
          >
            {FILTERED_EMPTY_MESSAGE}
          </div>
        ) : (
          <div className="grid min-h-[280px] gap-6 lg:grid-cols-2">
            <div
              className="w-full shrink-0"
              style={{ height: CHART_PLOT_HEIGHT, minHeight: CHART_PLOT_HEIGHT }}
            >
              <ResponsiveContainer width="100%" height={CHART_PLOT_HEIGHT}>
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {slices.map((slice) => (
                      <Cell key={slice.group} fill={slice.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => tooltipFormatter(Number(value))}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div
              className="w-full shrink-0"
              style={{ height: CHART_PLOT_HEIGHT, minHeight: CHART_PLOT_HEIGHT }}
            >
              <ResponsiveContainer width="100%" height={CHART_PLOT_HEIGHT}>
                <BarChart
                  data={slices}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => tooltipFormatter(Number(value))}
                  />
                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={false}
                  >
                    {slices.map((slice) => (
                      <Cell key={slice.group} fill={slice.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export const EmissionsChart = memo(EmissionsChartComponent);
