"use client";

import { memo } from "react";

import type { CategoryFilter, PeriodFilter } from "@/lib/emission-stats";
import { formatKgCO2e } from "@/lib/emission-stats";
import type { ActivityEmissionDto } from "@/lib/types";

const CATEGORY_FILTER_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "전체 카테고리" },
  { value: "electricity", label: "전기" },
  { value: "plastic_raw_1", label: "원소재 플라스틱 1" },
  { value: "plastic_raw_2", label: "원소재 플라스틱 2" },
  { value: "transport_truck", label: "운송 트럭" },
];

interface ActivityTableProps {
  rows: ActivityEmissionDto[];
  periods: string[];
  periodFilter: PeriodFilter;
  categoryFilter: CategoryFilter;
  onPeriodChange: (value: PeriodFilter) => void;
  onCategoryChange: (value: CategoryFilter) => void;
}

function ActivityTableComponent({
  rows,
  periods,
  periodFilter,
  categoryFilter,
  onPeriodChange,
  onCategoryChange,
}: ActivityTableProps) {
  return (
    <section
      aria-label="활동 데이터 목록"
      className="flex h-full min-h-[420px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <header className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">활동 데이터</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            기간
            <select
              value={periodFilter}
              onChange={(e) => onPeriodChange(e.target.value as PeriodFilter)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            >
              <option value="all">전체 기간</option>
              {periods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            카테고리
            <select
              value={categoryFilter}
              onChange={(e) =>
                onCategoryChange(e.target.value as CategoryFilter)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            >
              {CATEGORY_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">활동</th>
              <th className="px-4 py-3 font-medium">기간</th>
              <th className="px-4 py-3 font-medium text-right">활동량</th>
              <th className="px-4 py-3 font-medium text-right">배출량</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  필터 조건에 맞는 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{row.label}</p>
                    {row.productId ? (
                      <p className="text-xs text-slate-400">{row.productId}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.period}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {row.activityAmount.toLocaleString("ko-KR")} {row.unit}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-emerald-700">
                    {formatKgCO2e(row.emissionsKgCO2e)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export const ActivityTable = memo(ActivityTableComponent);
