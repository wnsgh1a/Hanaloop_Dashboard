import * as XLSX from "xlsx";

import { ActivityParseError, parseActivityRows } from "./parse-activity-rows";
import type { RawActivityRecord } from "./types";

/**
 * 엑셀 바이너리(ArrayBuffer) → 첫 번째 시트 → 2차원 배열 → RawActivityRecord[]
 * 헤더·단위·카테고리 검증은 parseActivityRows와 동일 규칙 적용.
 */
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
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  const stringRows = rawRows.map((row) => {
    const cells = Array.isArray(row) ? row : [row];
    return cells.map((cell) => cellToString(cell));
  });

  return parseActivityRows(stringRows);
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
