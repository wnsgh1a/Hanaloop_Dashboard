import type {
  ActivityCategory,
  ActivityUnit,
  RawActivityRecord,
} from "./types";

/** 과제용 CSV 양식 예시 (헤더 + 1행) */
export const ACTIVITY_CSV_TEMPLATE = `id,category,activityAmount,unit,period,productId
upload-001,electricity,50,kWh,2024-Q3,PCF-C`;

const REQUIRED_FIELDS = ["category", "activityAmount", "unit", "period"] as const;

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

export class CsvParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsvParseError";
  }
}

/** CSV 텍스트 → RawActivityRecord[] (배출량 계산 전 원본) */
export function parseActivityCsv(rawText: string): RawActivityRecord[] {
  const trimmed = rawText.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    throw new CsvParseError("파일 내용이 비어 있습니다.");
  }

  const rows = parseCsvRows(trimmed);
  if (rows.length < 2) {
    throw new CsvParseError(
      "헤더 행과 데이터 행이 최소 1줄 이상 필요합니다.",
    );
  }

  const headerRow = rows[0].map(normalizeHeaderCell);
  const columnIndex = buildColumnIndex(headerRow);

  for (const field of REQUIRED_FIELDS) {
    if (columnIndex[field] === undefined) {
      throw new CsvParseError(
        `필수 열이 없습니다: ${field} (헤더 예: category, activityAmount, unit, period)`,
      );
    }
  }

  const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell.trim()));
  if (dataRows.length === 0) {
    throw new CsvParseError("가져올 데이터 행이 없습니다.");
  }

  const stamp = Date.now();
  const records: RawActivityRecord[] = [];

  dataRows.forEach((row, rowIndex) => {
    const lineNo = rowIndex + 2;
    try {
      records.push(parseDataRow(row, columnIndex, stamp, rowIndex));
    } catch (err) {
      const detail =
        err instanceof CsvParseError
          ? err.message
          : "알 수 없는 형식 오류입니다.";
      throw new CsvParseError(`${lineNo}행: ${detail}`);
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
    throw new CsvParseError(
      `카테고리 값이 올바르지 않습니다 (${categoryRaw || "빈 값"}). electricity, plastic_raw_1, plastic_raw_2, transport_truck 또는 한글 라벨을 사용하세요.`,
    );
  }

  const amountRaw = get("activityAmount");
  const activityAmount = Number(amountRaw.replace(/,/g, ""));
  if (!Number.isFinite(activityAmount) || activityAmount < 0) {
    throw new CsvParseError(
      `활동 데이터량은 0 이상의 숫자여야 합니다 (${amountRaw || "빈 값"}).`,
    );
  }

  const unitRaw = get("unit");
  const unit = resolveUnit(unitRaw, category);

  const period = get("period");
  if (!period) {
    throw new CsvParseError("기간(period) 값이 필요합니다.");
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
    throw new CsvParseError(
      `단위는 kWh, kg, ton-km 중 하나여야 합니다 (${raw}).`,
    );
  }
  if (normalized !== expected) {
    throw new CsvParseError(
      `카테고리 ${category}의 기본 단위는 ${expected}입니다 (입력: ${raw}).`,
    );
  }
  return normalized;
}

function normalizeHeaderCell(cell: string): string {
  return cell.trim().toLowerCase().replace(/\s+/g, "");
}

function buildColumnIndex(
  headerRow: string[],
): Record<string, number> {
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

/** 따옴표·쉼표를 지원하는 단순 CSV 파서 */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || (char === "\r" && next === "\n")) {
      row.push(cell);
      if (row.some((c) => c.trim())) {
        rows.push(row);
      }
      row = [];
      cell = "";
      if (char === "\r") {
        i += 1;
      }
    } else if (char !== "\r") {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((c) => c.trim())) {
    rows.push(row);
  }

  return rows;
}
