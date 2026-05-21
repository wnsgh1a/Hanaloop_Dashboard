import type {
  ActivityCategory,
  ActivityEmissionDto,
  RawActivityRecord,
} from "./types";

/** 카테고리별 배출계수 (kgCO2e / 단위) — requirements.md */
export const EMISSION_FACTORS: Record<ActivityCategory, number> = {
  electricity: 0.456,
  plastic_raw_1: 2.3,
  plastic_raw_2: 3.2,
  transport_truck: 3.5,
};

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  electricity: "전기",
  plastic_raw_1: "원소재 플라스틱 1",
  plastic_raw_2: "원소재 플라스틱 2",
  transport_truck: "운송 트럭",
};

/** 활동 데이터량 × 배출계수 = 탄소 배출량(kgCO2e) */
export function calculateEmissionsKgCO2e(
  activityAmount: number,
  emissionFactor: number,
): number {
  return roundKgCO2e(activityAmount * emissionFactor);
}

function roundKgCO2e(value: number): number {
  return Math.round(value * 100) / 100;
}

export function toActivityEmissionDto(
  record: RawActivityRecord,
): ActivityEmissionDto {
  const emissionFactor = EMISSION_FACTORS[record.category];

  return {
    id: record.id,
    category: record.category,
    label: CATEGORY_LABELS[record.category],
    activityAmount: record.activityAmount,
    unit: record.unit,
    emissionFactor,
    emissionsKgCO2e: calculateEmissionsKgCO2e(
      record.activityAmount,
      emissionFactor,
    ),
    period: record.period,
    productId: record.productId,
  };
}

export function preprocessActivities(
  records: RawActivityRecord[],
): ActivityEmissionDto[] {
  return records.map(toActivityEmissionDto);
}
