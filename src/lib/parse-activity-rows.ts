import type {
  ActivityCategory,
  ActivityUnit,
  RawActivityRecord,
} from "./types";

export const REQUIRED_ACTIVITY_FIELDS = [
  "category",
  "activityAmount",
  "unit",
  "period",
] as const;

const HEADER_ALIASES: Record<string, keyof RawActivityRecord | "activityAmount"> =
  {
    id: "id",
    category: "category",
    activity_category: "category",
    카테고리: "category",
    activityamount: "activityAmount",
    activity_amount: "activityAmount",
    amount: "activityAmount",
    활동데이터량: "activityAmount",
    활동량: "activityAmount",
    unit: "unit",
    단위: "unit",
    period: "period",
    기간: "period",
    productid: "productId",
    product_id: "productId",
    제품: "productId",
    제품id: "productId",
  };

const CATEGORY_ALIASES: Record<string, ActivityCategory> = {
  electricity: "electricity",
  전기: "electricity",
  plastic_raw_1: "plastic_raw_1",
  "원소재 플라스틱 1": "plastic_raw_1",
  "플라스틱 1": "plastic_raw_1",
  plastic_raw_2: "plastic_raw_2",
  "원소재 플라스틱 2": "plastic_raw_2",
  "플라스틱 2": "plastic_raw_2",
  transport_truck: "transport_truck",
  "운송 트럭": "transport_truck",
  운송: "transport_truck",
};

const VALID_UNITS: ActivityUnit[] = ["kWh", "kg", "ton-km"];

const CATEGORY_DEFAULT_UNIT: Record<ActivityCategory, ActivityUnit> = {
  electricity: "kWh",
  plastic_raw_1: "kg",
  plastic_raw_2: "kg",
  transport_truck: "ton-km",
};

/** CSV·엑셀 공통 파싱 오류 */
export class ActivityParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActivityParseError";
  }
}

/** @deprecated ActivityParseError alias — 기존 테스트·UI 호환 */
export { ActivityParseError as CsvParseError };

/**
 * 2차원 문자열 행 배열 → RawActivityRecord[]
 * (첫 행 = 헤더, 이후 = 데이터)
 */
export function parseActivityRows(rows: string[][]): RawActivityRecord[] {
  const nonEmptyRows = rows
    .map((row) => row.map((cell) => String(cell ?? "").trim()))
    .filter((row) => row.some((cell) => cell.length > 0));

  if (nonEmptyRows.length < 2) {
    throw new ActivityParseError(
      "헤더 행과 데이터 행이 최소 1줄 이상 필요합니다.",
    );
  }

  const headerRow = nonEmptyRows[0].map(normalizeHeaderCell);
  const columnIndex = buildColumnIndex(headerRow);

  for (const field of REQUIRED_ACTIVITY_FIELDS) {
    if (columnIndex[field] === undefined) {
      throw new ActivityParseError(
        `필수 열이 없습니다: ${field} (헤더 예: category, activityAmount, unit, period)`,
      );
    }
  }

  const dataRows = nonEmptyRows.slice(1);
  const stamp = Date.now();
  const records: RawActivityRecord[] = [];

  dataRows.forEach((row, rowIndex) => {
    const lineNo = rowIndex + 2;
    try {
      records.push(parseDataRow(row, columnIndex, stamp, rowIndex));
    } catch (err) {
      const detail =
        err instanceof ActivityParseError
          ? err.message
          : "알 수 없는 형식 오류입니다.";
      throw new ActivityParseError(`${lineNo}행: ${detail}`);
    }
  });

  return records;
}

function parseDataRow(
  row: string[],
  columnIndex: Record<string, number>,
  stamp: number,
  rowIndex: number,
): RawActivityRecord {
  const get = (key: string) => {
    const idx = columnIndex[key];
    return idx === undefined ? "" : (row[idx] ?? "").trim();
  };

  const categoryRaw = get("category");
  const category = resolveCategory(categoryRaw);
  if (!category) {
    throw new ActivityParseError(
      `카테고리 값이 올바르지 않습니다 (${categoryRaw || "빈 값"}). electricity, plastic_raw_1, plastic_raw_2, transport_truck 또는 한글 라벨을 사용하세요.`,
    );
  }

  const amountRaw = get("activityAmount");
  const activityAmount = Number(amountRaw.replace(/,/g, ""));
  if (!Number.isFinite(activityAmount) || activityAmount < 0) {
    throw new ActivityParseError(
      `활동 데이터량은 0 이상의 숫자여야 합니다 (${amountRaw || "빈 값"}).`,
    );
  }

  const unitRaw = get("unit");
  const unit = resolveUnit(unitRaw, category);

  const period = get("period");
  if (!period) {
    throw new ActivityParseError("기간(period) 값이 필요합니다.");
  }

  const idRaw = get("id");
  const id = idRaw || `upload-${stamp}-${rowIndex + 1}`;

  const productIdRaw = get("productId");
  const record: RawActivityRecord = {
    id,
    category,
    activityAmount,
    unit,
    period,
  };

  if (productIdRaw) {
    record.productId = productIdRaw;
  }

  return record;
}

function resolveCategory(raw: string): ActivityCategory | null {
  const key = raw.trim().toLowerCase();
  if (CATEGORY_ALIASES[key]) {
    return CATEGORY_ALIASES[key];
  }
  return CATEGORY_ALIASES[raw.trim()] ?? null;
}

function resolveUnit(raw: string, category: ActivityCategory): ActivityUnit {
  const expected = CATEGORY_DEFAULT_UNIT[category];
  if (!raw) {
    return expected;
  }
  const normalized = raw.trim() as ActivityUnit;
  if (!VALID_UNITS.includes(normalized)) {
    throw new ActivityParseError(
      `단위는 kWh, kg, ton-km 중 하나여야 합니다 (${raw}).`,
    );
  }
  if (normalized !== expected) {
    throw new ActivityParseError(
      `카테고리 ${category}의 기본 단위는 ${expected}입니다 (입력: ${raw}).`,
    );
  }
  return normalized;
}

function normalizeHeaderCell(cell: string): string {
  return cell.trim().toLowerCase().replace(/\s+/g, "");
}

function buildColumnIndex(headerRow: string[]): Record<string, number> {
  const index: Record<string, number> = {};

  headerRow.forEach((cell, i) => {
    const normalized = normalizeHeaderCell(cell);
    const field = HEADER_ALIASES[normalized];
    if (field) {
      index[field] = i;
    }
  });

  return index;
}
