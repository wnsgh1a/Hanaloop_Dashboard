import { describe, expect, it } from "vitest";

import {
  CsvParseError,
  parseActivityCsv,
  parseCsvRows,
} from "./parse-activity-csv";

const VALID_CSV = `id,category,activityAmount,unit,period,productId
upload-001,electricity,50,kWh,2024-Q3,PCF-C`;

describe("parse-activity-csv", () => {
  it("유효한 CSV를 RawActivityRecord로 파싱한다", () => {
    const records = parseActivityCsv(VALID_CSV);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      id: "upload-001",
      category: "electricity",
      activityAmount: 50,
      unit: "kWh",
      period: "2024-Q3",
      productId: "PCF-C",
    });
  });

  it("한글 헤더를 지원한다", () => {
    const csv = `id,카테고리,활동데이터량,단위,기간
x-1,전기,100,kWh,2024-Q4`;
    const records = parseActivityCsv(csv);
    expect(records[0].category).toBe("electricity");
    expect(records[0].activityAmount).toBe(100);
  });

  it("빈 파일은 CsvParseError를 던진다", () => {
    expect(() => parseActivityCsv("   ")).toThrow(CsvParseError);
    expect(() => parseActivityCsv("   ")).toThrow(/비어/);
  });

  it("필수 열 누락 시 CsvParseError를 던진다", () => {
    const csv = `id,category,unit,period
a,electricity,kWh,2024-Q1`;
    expect(() => parseActivityCsv(csv)).toThrow(CsvParseError);
    expect(() => parseActivityCsv(csv)).toThrow(/activityAmount/);
  });

  it("잘못된 카테고리는 행 번호와 함께 CsvParseError를 던진다", () => {
    const csv = `category,activityAmount,unit,period
invalid_type,10,kWh,2024-Q1`;
    expect(() => parseActivityCsv(csv)).toThrow(CsvParseError);
    expect(() => parseActivityCsv(csv)).toThrow(/2행/);
  });

  it("카테고리와 맞지 않는 단위는 거부한다", () => {
    const csv = `category,activityAmount,unit,period
electricity,10,kg,2024-Q1`;
    expect(() => parseActivityCsv(csv)).toThrow(CsvParseError);
  });

  it("따옴표 필드에 쉼표가 있어도 파싱한다", () => {
    const rows = parseCsvRows('a,"b,c",d');
    expect(rows[0]).toEqual(["a", "b,c", "d"]);
  });
});
