import { create } from "zustand";

import { fetchActivityEmissions } from "@/lib/api";
import { parseActivityCsv } from "@/lib/parse-activity-csv";
import { parseActivityExcel } from "@/lib/parse-activity-excel";
import { preprocessActivities } from "@/lib/preprocess";
import type { ActivityEmissionDto, RawActivityRecord } from "@/lib/types";
import { ApiError } from "@/lib/types";

export type ImportMode = "prepend" | "replace";

/** @deprecated ImportMode 사용 */
export type CsvUploadMode = ImportMode;

export type ManualActivityInput = Omit<RawActivityRecord, "id">;

function createManualId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `manual-${crypto.randomUUID()}`;
  }
  return `manual-${Date.now()}`;
}

function applyImportedRecords(
  set: (partial: Partial<EmissionState>) => void,
  get: () => EmissionState,
  records: RawActivityRecord[],
  mode: ImportMode,
) {
  const imported = preprocessActivities(records);
  const current = get().emissions;

  set({
    emissions: mode === "replace" ? imported : [...imported, ...current],
    error: null,
  });
}

interface EmissionState {
  emissions: ActivityEmissionDto[];
  isLoading: boolean;
  error: string | ApiError | null;
  fetchEmissions: () => Promise<void>;
  uploadCsvData: (rawText: string, mode?: ImportMode) => void;
  uploadExcelData: (data: ArrayBuffer, mode?: ImportMode) => void;
  addManualActivity: (record: ManualActivityInput, mode?: ImportMode) => void;
}

function toStoreError(err: unknown): string | ApiError {
  if (err instanceof ApiError) {
    return err;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
}

/** Error UI에서 메시지 문자열 추출 */
export function getEmissionErrorMessage(
  error: EmissionState["error"],
): string | null {
  if (error == null) {
    return null;
  }
  if (typeof error === "string") {
    return error;
  }
  return error.message;
}

export const useEmissionStore = create<EmissionState>((set, get) => ({
  emissions: [],
  isLoading: false,
  error: null,

  fetchEmissions: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await fetchActivityEmissions();
      set({
        emissions: data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const storeError = toStoreError(err);
      const hasCachedEmissions = get().emissions.length > 0;

      set({
        isLoading: false,
        error: storeError,
        // 이전에 성공한 데이터가 있으면 emissions는 그대로 유지 (stale-while-revalidate)
        ...(hasCachedEmissions ? {} : { emissions: [] }),
      });
    }
  },

  uploadCsvData: (rawText, mode = "prepend") => {
    const records = parseActivityCsv(rawText);
    applyImportedRecords(set, get, records, mode);
  },

  uploadExcelData: (data, mode = "prepend") => {
    const records = parseActivityExcel(data);
    applyImportedRecords(set, get, records, mode);
  },

  addManualActivity: (record, mode = "prepend") => {
    const fullRecord: RawActivityRecord = {
      ...record,
      id: createManualId(),
    };
    applyImportedRecords(set, get, [fullRecord], mode);
  },
}));
