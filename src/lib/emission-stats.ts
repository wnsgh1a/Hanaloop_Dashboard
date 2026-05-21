import type { ActivityCategory, ActivityEmissionDto } from "./types";

/** 경영진 KPI·차트용 3대 활동 그룹 (전기 / 원소재 / 운송) */
export type ActivityGroup = "electricity" | "materials" | "transport";

export const ACTIVITY_GROUP_LABELS: Record<ActivityGroup, string> = {
  electricity: "전기",
  materials: "원소재",
  transport: "운송",
};

export const ACTIVITY_GROUP_COLORS: Record<ActivityGroup, string> = {
  electricity: "#2563eb",
  materials: "#059669",
  transport: "#d97706",
};

export function toActivityGroup(category: ActivityCategory): ActivityGroup {
  if (category === "electricity") return "electricity";
  if (category === "transport_truck") return "transport";
  return "materials";
}

export type CategoryFilter = "all" | ActivityCategory;
export type PeriodFilter = "all" | string;

export interface EmissionFilters {
  period: PeriodFilter;
  category: CategoryFilter;
}

export function filterEmissions(
  emissions: ActivityEmissionDto[],
  filters: EmissionFilters,
): ActivityEmissionDto[] {
  return emissions.filter((row) => {
    if (filters.period !== "all" && row.period !== filters.period) {
      return false;
    }
    if (filters.category !== "all" && row.category !== filters.category) {
      return false;
    }
    return true;
  });
}

export function getUniquePeriods(emissions: ActivityEmissionDto[]): string[] {
  return Array.from(new Set(emissions.map((e) => e.period))).sort();
}

export interface KpiSummary {
  totalKgCO2e: number;
  byGroup: Record<ActivityGroup, number>;
}

export function computeKpiSummary(emissions: ActivityEmissionDto[]): KpiSummary {
  const byGroup: KpiSummary["byGroup"] = {
    electricity: 0,
    materials: 0,
    transport: 0,
  };

  for (const row of emissions) {
    const group = toActivityGroup(row.category);
    byGroup[group] += row.emissionsKgCO2e;
  }

  const totalKgCO2e = roundKgCO2e(
    byGroup.electricity + byGroup.materials + byGroup.transport,
  );

  return {
    totalKgCO2e,
    byGroup: {
      electricity: roundKgCO2e(byGroup.electricity),
      materials: roundKgCO2e(byGroup.materials),
      transport: roundKgCO2e(byGroup.transport),
    },
  };
}

export interface ChartSlice {
  group: ActivityGroup;
  name: string;
  value: number;
  fill: string;
}

export function computeChartSlices(emissions: ActivityEmissionDto[]): ChartSlice[] {
  const { byGroup } = computeKpiSummary(emissions);

  return (Object.keys(byGroup) as ActivityGroup[])
    .map((group) => ({
      group,
      name: ACTIVITY_GROUP_LABELS[group],
      value: byGroup[group],
      fill: ACTIVITY_GROUP_COLORS[group],
    }))
    .filter((slice) => slice.value > 0);
}

function roundKgCO2e(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatKgCO2e(value: number): string {
  return `${value.toLocaleString("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} kgCO₂e`;
}
