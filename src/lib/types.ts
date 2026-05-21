/** 활동 유형 — requirements.md 배출계수 명세와 1:1 대응 */
export type ActivityCategory =
  | "electricity"
  | "plastic_raw_1"
  | "plastic_raw_2"
  | "transport_truck";

export type ActivityUnit = "kWh" | "kg" | "ton-km";

/** Mock DB / 엑셀 원본에 해당하는 활동 데이터 (배출량 미계산) */
export interface RawActivityRecord {
  id: string;
  category: ActivityCategory;
  /** 활동 데이터량 */
  activityAmount: number;
  unit: ActivityUnit;
  /** 보고 기간 (예: 2024-Q1) */
  period: string;
  /** 제품/공정 식별자 (선택) */
  productId?: string;
}

/** 차트·비즈니스 로직에서 사용하는 정제된 DTO */
export interface ActivityEmissionDto {
  id: string;
  category: ActivityCategory;
  label: string;
  activityAmount: number;
  unit: ActivityUnit;
  emissionFactor: number;
  emissionsKgCO2e: number;
  period: string;
  productId?: string;
}

export class ApiError extends Error {
  constructor(message = "Mock API request failed") {
    super(message);
    this.name = "ApiError";
  }
}
