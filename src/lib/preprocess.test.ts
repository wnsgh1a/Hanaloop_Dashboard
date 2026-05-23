import { describe, expect, it } from "vitest";

import {
  calculateEmissionsKgCO2e,
  EMISSION_FACTORS,
  preprocessActivities,
  toActivityEmissionDto,
} from "./preprocess";
import type { RawActivityRecord } from "./types";

describe("preprocess — PCF 배출량 계산", () => {
  it("wiki 예시: 110 kWh × 0.456 = 50.16 kgCO2e", () => {
    expect(calculateEmissionsKgCO2e(110, EMISSION_FACTORS.electricity)).toBe(
      50.16,
    );
  });

  it("DTO에 단위·라벨·배출계수가 포함된다", () => {
    const record: RawActivityRecord = {
      id: "t-1",
      category: "electricity",
      activityAmount: 110,
      unit: "kWh",
      period: "2024-Q1",
    };
    const dto = toActivityEmissionDto(record);

    expect(dto.unit).toBe("kWh");
    expect(dto.label).toBe("전기");
    expect(dto.emissionFactor).toBe(0.456);
    expect(dto.emissionsKgCO2e).toBe(50.16);
  });

  it("4개 활동 유형 배출계수가 requirements.md와 일치한다", () => {
    expect(EMISSION_FACTORS.plastic_raw_1).toBe(2.3);
    expect(EMISSION_FACTORS.plastic_raw_2).toBe(3.2);
    expect(EMISSION_FACTORS.transport_truck).toBe(3.5);
  });

  it("preprocessActivities는 배열 길이를 유지한다", () => {
    const records: RawActivityRecord[] = [
      {
        id: "a",
        category: "transport_truck",
        activityAmount: 10,
        unit: "ton-km",
        period: "2024-Q1",
      },
      {
        id: "b",
        category: "plastic_raw_1",
        activityAmount: 20,
        unit: "kg",
        period: "2024-Q1",
      },
    ];
    const result = preprocessActivities(records);
    expect(result).toHaveLength(2);
    expect(result[0].emissionsKgCO2e).toBe(35);
    expect(result[1].emissionsKgCO2e).toBe(46);
  });
});
