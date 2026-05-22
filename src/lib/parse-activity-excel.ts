import * as XLSX from "xlsx";

import {
  ActivityParseError,
  parseActivityRows,
  resolveCategoryFromActivityAndDescription,
} from "./parse-activity-rows";
import type { RawActivityRecord } from "./types";

const HEADER_KEYWORDS = [
  "활동 유형",
  "일자(원본)",
  "량",
  "단위",
  "설명",
  "카테고리",
  "활동량",
  "activity",
  "amount",
  "unit",
] as const;

const MIN_HEADER_KEYWORD_MATCHES = 2;

const REFERENCE_TABLE_MARKERS = [
  "배출계수",
  "지원자 참고",
  "참고용",
  "항목",
  "계수",
] as const;

const EXCEL_HEADER_TO_CANONICAL: Record<string, string> = {
  활동유형: "activityType",
  카테고리: "category",
  category: "category",
  activitycategory: "category",
  일자원본: "period",
  기간: "period",
  period: "period",
  량: "activityAmount",
  활동량: "activityAmount",
  활동데이터량: "activityAmount",
  activityamount: "activityAmount",
  activity_amount: "activityAmount",
  amount: "activityAmount",
  activity: "activityAmount",
  단위: "unit",
  unit: "unit",
  설명: "description",
  productid: "productId",
  product_id: "productId",
  id: "id",
};

const CANONICAL_HEADERS = [
  "category",
  "activityAmount",
  "unit",
  "period",
  "id",
  "productId",
] as const;

export function parseActivityExcel(data: ArrayBuffer): RawActivityRecord[] {
  if (!data || data.byteLength === 0) {
    throw new ActivityParseError("엑셀 파일이 비어 있습니다.");
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: "array", cellDates: false });
  } catch {
    throw new ActivityParseError(
      "엑셀 파일을 읽을 수 없습니다. 손상되었거나 지원하지 않는 형식일 수 있습니다.",
    );
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new ActivityParseError("엑셀 파일에 시트가 없습니다.");
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  const stringRows = matrix.map((row) => {
    const cells = Array.isArray(row) ? row : [row];
    return cells.map((cell) => cellToString(cell));
  });

  const headerRowIndex = findHeaderRowIndex(stringRows);
  const headerEndCol = findHeaderEndColumn(stringRows[headerRowIndex] ?? []);
  const records = sheetRowsToObjects(
    stringRows,
    headerRowIndex,
    headerEndCol,
  );
  const parseRows = objectsToCanonicalRows(records);

  return parseActivityRows(parseRows);
}

export function findHeaderRowIndex(rows: string[][]): number {
  for (let i = 0; i < rows.length; i += 1) {
    if (scoreHeaderRow(rows[i]) >= MIN_HEADER_KEYWORD_MATCHES) {
      return i;
    }
  }
  throw new ActivityParseError(
    "엑셀에서 헤더 행을 찾을 수 없습니다. 상단 설명 행 아래에 과제용 헤더(활동 유형, 단위, 활동량 등)가 있는지 확인해주세요.",
  );
}

export function scoreHeaderRow(row: string[]): number {
  let score = 0;
  for (const keyword of HEADER_KEYWORDS) {
    if (row.some((cell) => cellMatchesKeyword(cell, keyword))) {
      score += 1;
    }
  }
  return score;
}

function findHeaderEndColumn(headerRow: string[]): number {
  let lastIndex = -1;
  headerRow.forEach((cell, index) => {
    if (cell.trim()) {
      lastIndex = index;
    }
  });
  return lastIndex >= 0 ? lastIndex : headerRow.length - 1;
}

export function sheetRowsToObjects(
  rows: string[][],
  headerRowIndex: number,
  headerEndCol: number,
): Record<string, unknown>[] {
  const headerCells = (rows[headerRowIndex] ?? []).slice(0, headerEndCol + 1);
  const objects: Record<string, unknown>[] = [];

  for (let r = headerRowIndex + 1; r < rows.length; r += 1) {
    const row = (rows[r] ?? []).slice(0, headerEndCol + 1);
    if (!row.some((cell) => cell.trim().length > 0)) {
      continue;
    }

    const record: Record<string, unknown> = {};
    headerCells.forEach((headerCell, colIndex) => {
      const key = headerCell.trim();
      if (!key) {
        return;
      }
      record[key] = cellToString(row[colIndex]);
    });

    if (isReferenceTableRow(record) || isEmptyDataRow(record)) {
      continue;
    }

    objects.push(record);
  }

  if (objects.length === 0) {
    throw new ActivityParseError("가져올 데이터 행이 없습니다.");
  }

  return objects;
}

function isReferenceTableRow(record: Record<string, unknown>): boolean {
  const values = Object.values(record).map((v) => cellToString(v));
  const joined = values.join(" ");
  return REFERENCE_TABLE_MARKERS.some((marker) => joined.includes(marker));
}

function isEmptyDataRow(record: Record<string, unknown>): boolean {
  const amount = getRecordValue(record, ["량", "활동량", "activityAmount", "amount"]);
  const activityType = getRecordValue(record, [
    "활동 유형",
    "활동유형",
    "카테고리",
    "category",
  ]);
  return !amount.trim() && !activityType.trim();
}

function objectsToCanonicalRows(
  records: Record<string, unknown>[],
): string[][] {
  const headerKeys = Object.keys(records[0] ?? {});
  const columnMap = buildColumnMap(headerKeys);
  const output: string[][] = [[...CANONICAL_HEADERS]];

  for (const record of records) {
    const activityType = columnMap.activityType
      ? cellToString(record[columnMap.activityType])
      : columnMap.category
        ? cellToString(record[columnMap.category])
        : "";

    const description = columnMap.description
      ? cellToString(record[columnMap.description])
      : "";

    const category =
      resolveCategoryFromActivityAndDescription(activityType, description) ??
      resolveCategoryFromActivityAndDescription(description, activityType);

    if (!category) {
      const hint = [activityType, description].filter(Boolean).join(" / ");
      throw new ActivityParseError(
        `카테고리를 판별할 수 없습니다 (${hint || "빈 값"}). 활동 유형·설명(예: 전기, 원소재+플라스틱 1)을 확인해주세요.`,
      );
    }

    const activityAmountKey = columnMap.activityAmount;
    const unitKey = columnMap.unit;
    const periodKey = columnMap.period;

    output.push([
      category,
      activityAmountKey ? cellToString(record[activityAmountKey]) : "",
      unitKey ? cellToString(record[unitKey]) : "",
      periodKey ? cellToString(record[periodKey]) : "",
      columnMap.id ? cellToString(record[columnMap.id]) : "",
      description || (columnMap.productId ? cellToString(record[columnMap.productId]) : ""),
    ]);
  }

  return output;
}

function buildColumnMap(headerKeys: string[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const key of headerKeys) {
    const canonical = EXCEL_HEADER_TO_CANONICAL[normalizeHeaderKey(key)];
    if (canonical && !map[canonical]) {
      map[canonical] = key;
    }
  }

  return map;
}

function getRecordValue(
  record: Record<string, unknown>,
  candidateHeaders: string[],
): string {
  for (const header of candidateHeaders) {
    if (record[header] !== undefined) {
      return cellToString(record[header]);
    }
    const normalized = normalizeHeaderKey(header);
    for (const key of Object.keys(record)) {
      if (normalizeHeaderKey(key) === normalized) {
        return cellToString(record[key]);
      }
    }
  }
  return "";
}

function normalizeHeaderKey(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s()（）]/g, "");
}

function normalizeMatch(value: string): string {
  return value.trim().toLowerCase();
}

function cellMatchesKeyword(cell: string, keyword: string): boolean {
  const c = normalizeMatch(cell);
  const k = normalizeMatch(keyword);
  if (!c || !k) {
    return false;
  }
  return c === k || c.includes(k) || k.includes(c);
}

function cellToString(cell: unknown): string {
  if (cell == null) {
    return "";
  }
  if (typeof cell === "number") {
    return String(cell);
  }
  if (typeof cell === "boolean") {
    return cell ? "true" : "false";
  }
  if (cell instanceof Date) {
    return cell.toISOString().slice(0, 10);
  }
  return String(cell).trim();
}
