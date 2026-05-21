"use client";

import { memo } from "react";

import {
  ACTIVITY_GROUP_LABELS,
  formatKgCO2e,
  type KpiSummary as KpiSummaryData,
} from "@/lib/emission-stats";

interface KpiSummaryProps {
  kpi: KpiSummaryData;
}

function KpiSummaryComponent({ kpi }: KpiSummaryProps) {
  const groupCards = (
    ["electricity", "materials", "transport"] as const
  ).map((group) => ({
    group,
    label: ACTIVITY_GROUP_LABELS[group],
    value: kpi.byGroup[group],
  }));

  return (
    <section aria-label="KPI 요약">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-sm md:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-300">
            총 탄소 배출량
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {formatKgCO2e(kpi.totalKgCO2e)}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            필터 적용 범위 내 활동 데이터 합산 (kgCO₂e)
          </p>
        </article>

        {groupCards.map((card) => (
          <article
            key={card.group}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
              {formatKgCO2e(card.value)}
            </p>
            <p className="mt-1 text-xs text-slate-400">활동 유형별 배출량</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export const KpiSummary = memo(KpiSummaryComponent);
