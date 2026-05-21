"use client";

import { memo, useMemo } from "react";
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

import { formatKgCO2e, type ChartSlice } from "@/lib/emission-stats";

interface EmissionsChartProps {
  slices: ChartSlice[];
}

function EmissionsChartComponent({ slices }: EmissionsChartProps) {
  const hasData = slices.length > 0;

  const tooltipFormatter = useMemo(
    () => (value: number) => formatKgCO2e(value),
    [],
  );

  return (
    <section
      aria-label="활동 유형별 배출량 차트"
      className="flex h-full min-h-[420px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <header className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">
          활동 유형별 배출 비교
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          전기 · 원소재 · 운송 그룹 기준 kgCO₂e 비율
        </p>
      </header>

      {!hasData ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
          표시할 배출 데이터가 없습니다.
        </div>
      ) : (
        <div className="grid flex-1 gap-6 lg:grid-cols-2">
          <div className="h-64 min-h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
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
                >
                  {slices.map((slice) => (
                    <Cell key={slice.group} fill={slice.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => tooltipFormatter(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="h-64 min-h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slices} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => tooltipFormatter(Number(value))} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {slices.map((slice) => (
                    <Cell key={slice.group} fill={slice.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}

export const EmissionsChart = memo(EmissionsChartComponent);
