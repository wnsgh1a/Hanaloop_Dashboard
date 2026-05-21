import { preprocessActivities } from "./preprocess";
import type { ActivityEmissionDto, RawActivityRecord } from "./types";
import { ApiError } from "./types";

/** 엑셀 원본과 동일한 구조의 초기 활동 데이터 (배출량 미포함) */
export const RAW_ACTIVITY_DATA: RawActivityRecord[] = [
  {
    id: "act-001",
    category: "electricity",
    activityAmount: 110,
    unit: "kWh",
    period: "2024-Q1",
    productId: "PCF-A",
  },
  {
    id: "act-002",
    category: "electricity",
    activityAmount: 95,
    unit: "kWh",
    period: "2024-Q2",
    productId: "PCF-A",
  },
  {
    id: "act-003",
    category: "plastic_raw_1",
    activityAmount: 48,
    unit: "kg",
    period: "2024-Q1",
    productId: "PCF-A",
  },
  {
    id: "act-004",
    category: "plastic_raw_2",
    activityAmount: 32,
    unit: "kg",
    period: "2024-Q1",
    productId: "PCF-A",
  },
  {
    id: "act-005",
    category: "transport_truck",
    activityAmount: 12.5,
    unit: "ton-km",
    period: "2024-Q1",
    productId: "PCF-A",
  },
  {
    id: "act-006",
    category: "electricity",
    activityAmount: 78,
    unit: "kWh",
    period: "2024-Q1",
    productId: "PCF-B",
  },
  {
    id: "act-007",
    category: "plastic_raw_1",
    activityAmount: 65,
    unit: "kg",
    period: "2024-Q2",
    productId: "PCF-B",
  },
  {
    id: "act-008",
    category: "transport_truck",
    activityAmount: 8.2,
    unit: "ton-km",
    period: "2024-Q2",
    productId: "PCF-B",
  },
];

const JITTER_MIN_MS = 200;
const JITTER_MAX_MS = 800;
const FAILURE_RATE = 0.15;

/** 200~800ms 사이의 네트워크 지연 시뮬레이션 */
export function jitter(): Promise<void> {
  const delay =
    JITTER_MIN_MS +
    Math.floor(Math.random() * (JITTER_MAX_MS - JITTER_MIN_MS + 1));

  return new Promise((resolve) => setTimeout(resolve, delay));
}

/** 15% 확률로 요청 실패 — 실패 시 ApiError throw */
export function maybeFail(): void {
  if (Math.random() < FAILURE_RATE) {
    throw new ApiError("Mock API: simulated network failure");
  }
}

/** Mock API: 활동 데이터 조회 후 DTO로 정제하여 반환 */
export async function fetchActivityEmissions(): Promise<ActivityEmissionDto[]> {
  await jitter();
  maybeFail();
  return preprocessActivities(RAW_ACTIVITY_DATA);
}

/** Mock API: 원본 활동 데이터만 반환 (업로드·가공 UI 등에서 사용) */
export async function fetchRawActivities(): Promise<RawActivityRecord[]> {
  await jitter();
  maybeFail();
  return [...RAW_ACTIVITY_DATA];
}
