import { describe, expect, it } from "vitest";

import {
  computeChartSlices,
  computeKpiSummary,
  filterEmissions,
  formatKgCO2e,
} from "./emission-stats";
import { preprocessActivities } from "./preprocess";
import type { RawActivityRecord } from "./types";

const SAMPLE_RAW: RawActivityRecord[] = [
  {
    id: "1",
    category: "electricity",
    activityAmount: 110,
    unit: "kWh",
    period: "2024-Q1",
  },
  {
    id: "2",
    category: "plastic_raw_1",
    activityAmount: 10,
    unit: "kg",
    period: "2024-Q2",
  },
  {
    id: "3",
    category: "transport_truck",
    activityAmount: 5,
    unit: "ton-km",
    period: "2024-Q1",
  },
];

describe("emission-stats — KPI·필터·표시", () => {
  const emissions = preprocessActivities(SAMPLE_RAW);

  it("formatKgCO2e에 kgCO₂e 단위가 포함된다", () => {
    expect(formatKgCO2e(50.16)).toContain("kgCO");
  });

  it("computeKpiSummary 총합이 그룹 합과 일치한다", () => {
    const kpi = computeKpiSummary(emissions);
    const groupSum =
      kpi.byGroup.electricity +
      kpi.byGroup.materials +
      kpi.byGroup.transport;
    expect(kpi.totalKgCO2e).toBe(
      Math.round(groupSum * 100) / 100,
    );
    expect(kpi.byGroup.electricity).toBe(50.16);
    expect(kpi.byGroup.materials).toBe(23);
    expect(kpi.byGroup.transport).toBe(17.5);
  });

  it("filterEmissions — 기간 필터가 동작한다", () => {
    const filtered = filterEmissions(emissions, {
      period: "2024-Q1",
      category: "all",
    });
    expect(filtered).toHaveLength(2);
  });

  it("computeChartSlices — 0인 그룹은 제외한다", () => {
    const single = preprocessActivities([SAMPLE_RAW[0]]);
    const slices = computeChartSlices(single);
    expect(slices).toHaveLength(1);
    expect(slices[0].name).toBe("전기");
  });
});
