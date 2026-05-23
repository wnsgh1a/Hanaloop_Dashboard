import * as XLSX from "xlsx";
import { beforeEach, describe, expect, it } from "vitest";

import { ACTIVITY_CSV_TEMPLATE } from "@/lib/parse-activity-csv";
import { preprocessActivities } from "@/lib/preprocess";
import { RAW_ACTIVITY_DATA } from "@/lib/api";

import { useEmissionStore } from "./useEmissionStore";

function buildExcelBuffer(): ArrayBuffer {
  const sheet = XLSX.utils.aoa_to_sheet([
    ["category", "activityAmount", "unit", "period"],
    ["plastic_raw_2", 10, "kg", "2024-Q3"],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "data");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

describe("useEmissionStore — CSV 임포트", () => {
  beforeEach(() => {
    useEmissionStore.setState({
      emissions: preprocessActivities(RAW_ACTIVITY_DATA),
      isLoading: false,
      error: null,
    });
  });

  it("uploadCsvData prepend — 업로드 행이 배열 앞에 온다", () => {
    const beforeLen = useEmissionStore.getState().emissions.length;
    useEmissionStore.getState().uploadCsvData(ACTIVITY_CSV_TEMPLATE, "prepend");
    const after = useEmissionStore.getState().emissions;

    expect(after).toHaveLength(beforeLen + 1);
    expect(after[0].id).toBe("upload-001");
    expect(after[0].emissionsKgCO2e).toBe(22.8);
  });

  it("uploadCsvData replace — 기존 데이터를 교체한다", () => {
    useEmissionStore.getState().uploadCsvData(ACTIVITY_CSV_TEMPLATE, "replace");
    const after = useEmissionStore.getState().emissions;

    expect(after).toHaveLength(1);
    expect(after[0].category).toBe("electricity");
  });

  it("addManualActivity prepend — 수동 입력이 배열 앞에 온다", () => {
    const beforeLen = useEmissionStore.getState().emissions.length;
    useEmissionStore.getState().addManualActivity(
      {
        category: "electricity",
        activityAmount: 25,
        unit: "kWh",
        period: "2024-Q4",
        productId: "PCF-M",
      },
      "prepend",
    );
    const after = useEmissionStore.getState().emissions;

    expect(after).toHaveLength(beforeLen + 1);
    expect(after[0].id).toMatch(/^manual-/);
    expect(after[0].emissionsKgCO2e).toBe(11.4);
    expect(after[0].productId).toBe("PCF-M");
  });

  it("uploadExcelData prepend — 엑셀 행이 배열 앞에 온다", () => {
    const beforeLen = useEmissionStore.getState().emissions.length;
    useEmissionStore.getState().uploadExcelData(buildExcelBuffer(), "prepend");
    const after = useEmissionStore.getState().emissions;

    expect(after).toHaveLength(beforeLen + 1);
    expect(after[0].category).toBe("plastic_raw_2");
    expect(after[0].emissionsKgCO2e).toBe(32);
  });

  it("잘못된 CSV는 예외를 던지고 emissions를 변경하지 않는다", () => {
    const before = useEmissionStore.getState().emissions;
    expect(() =>
      useEmissionStore.getState().uploadCsvData("bad,data\nonly,one"),
    ).toThrow();
    expect(useEmissionStore.getState().emissions).toEqual(before);
  });
});
