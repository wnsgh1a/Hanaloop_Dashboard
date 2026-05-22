import type { RawActivityRecord } from "./types";
import {
  ActivityParseError,
  CsvParseError,
  parseActivityRows,
} from "./parse-activity-rows";

/** 과제용 CSV 양식 예시 (헤더 + 1행) */
export const ACTIVITY_CSV_TEMPLATE = `id,category,activityAmount,unit,period,productId
upload-001,electricity,50,kWh,2024-Q3,PCF-C`;

export { ActivityParseError, CsvParseError };

/** CSV 텍스트 → RawActivityRecord[] (배출량 계산 전 원본) */
export function parseActivityCsv(rawText: string): RawActivityRecord[] {
  const trimmed = rawText.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    throw new ActivityParseError("파일 내용이 비어 있습니다.");
  }

  const rows = parseCsvRows(trimmed);
  return parseActivityRows(rows);
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
