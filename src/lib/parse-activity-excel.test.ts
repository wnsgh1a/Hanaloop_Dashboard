import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";

import { ActivityParseError } from "./parse-activity-rows";
import {
  findHeaderRowIndex,
  parseActivityExcel,
  scoreHeaderRow,
  sheetRowsToObjects,
} from "./parse-activity-excel";

function buildSampleWorkbookBuffer(): ArrayBuffer {
  const sheet = XLSX.utils.aoa_to_sheet([
    ["id", "category", "activityAmount", "unit", "period", "productId"],
    ["xl-001", "electricity", 75, "kWh", "2024-Q4", "PCF-X"],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "과제용데이터");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

function buildAssignmentFormatBuffer(): ArrayBuffer {
  const sheet = XLSX.utils.aoa_to_sheet([
    ["과제용 활동 데이터 양식"],
    [""],
    ["일자(원본)", "활동 유형", "설명", "량", "단위"],
    ["2024-Q1", "전기", "한국전력", 110, "kWh"],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "data");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

describe("parse-activity-excel", () => {
  it("첫 번째 시트를 RawActivityRecord로 파싱한다", () => {
    const buffer = buildSampleWorkbookBuffer();
    const records = parseActivityExcel(buffer);

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      id: "xl-001",
      category: "electricity",
      activityAmount: 75,
      unit: "kWh",
      period: "2024-Q4",
      productId: "PCF-X",
    });
  });

  it("상단 빈 행·설명 행 뒤 과제용 헤더를 탐지한다", () => {
    const buffer = buildAssignmentFormatBuffer();
    const records = parseActivityExcel(buffer);

    expect(records).toHaveLength(1);
    expect(records[0].category).toBe("electricity");
    expect(records[0].activityAmount).toBe(110);
    expect(records[0].unit).toBe("kWh");
    expect(records[0].period).toBe("2024-Q1");
    expect(records[0].productId).toBe("한국전력");
  });

  it("scoreHeaderRow — 키워드 2개 이상이면 헤더 후보", () => {
    expect(
      scoreHeaderRow(["활동 유형", "일자(원본)", "량", "단위", "설명"]),
    ).toBeGreaterThanOrEqual(2);
    expect(scoreHeaderRow(["과제용 안내 문구만 있음"])).toBeLessThan(2);
  });

  it("findHeaderRowIndex — 설명 행을 건너뛴다", () => {
    const rows = [
      ["과제용 활동 데이터"],
      [""],
      ["카테고리", "활동량", "단위", "기간"],
      ["전기", 100, "kWh", "2024-Q1"],
    ];
    expect(findHeaderRowIndex(rows)).toBe(2);
  });

  it("sheetRowsToObjects — 헤더 키 기반 객체 배열", () => {
    const rows = [
      ["카테고리", "활동량", "단위"],
      ["전기", 50, "kWh"],
    ];
    const objects = sheetRowsToObjects(rows, 0, 2);
    expect(objects[0]).toEqual({
      카테고리: "전기",
      활동량: "50",
      단위: "kWh",
    });
  });

  it("활동 유형 원소재 + 설명 플라스틱 1/2 조합을 해석한다", () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["안내"],
      ["일자(원본)", "활동 유형", "설명", "량", "단위"],
      ["2025-01-01", "전기", "한국전력", 110, "kWh"],
      ["2025-02-01", "원소재", "플라스틱 1", 48, "kg"],
      ["2025-03-01", "원소재", "플라스틱 2", 32, "kg"],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
    const buffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    }) as ArrayBuffer;

    const records = parseActivityExcel(buffer);
    expect(records).toHaveLength(3);
    expect(records[0].category).toBe("electricity");
    expect(records[1].category).toBe("plastic_raw_1");
    expect(records[2].category).toBe("plastic_raw_2");
  });

  it("한글 헤더 엑셀을 지원한다", () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["카테고리", "활동데이터량", "단위", "기간"],
      ["전기", 100, "kWh", "2024-Q1"],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
    const buffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    }) as ArrayBuffer;

    const records = parseActivityExcel(buffer);
    expect(records[0].category).toBe("electricity");
    expect(records[0].activityAmount).toBe(100);
  });

  it("빈 버퍼는 ActivityParseError를 던진다", () => {
    expect(() => parseActivityExcel(new ArrayBuffer(0))).toThrow(
      ActivityParseError,
    );
  });

  it("단위 불일치 시 행 번호와 함께 오류를 던진다", () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["category", "activityAmount", "unit", "period"],
      ["electricity", 10, "kg", "2024-Q1"],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
    const buffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    }) as ArrayBuffer;

    expect(() => parseActivityExcel(buffer)).toThrow(ActivityParseError);
    expect(() => parseActivityExcel(buffer)).toThrow(/2행/);
  });
});
