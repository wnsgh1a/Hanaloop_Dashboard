"use client";

import { useCallback, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { ACTIVITY_CSV_TEMPLATE } from "@/lib/parse-activity-csv";
import { ActivityParseError } from "@/lib/parse-activity-rows";
import {
  type CsvUploadMode,
  useEmissionStore,
} from "@/store/useEmissionStore";

const ACCEPTED_EXTENSIONS = [".csv", ".txt", ".xlsx", ".xls"];
const MAX_FILE_SIZE_MB = 5;

interface FileUploaderProps {
  variant?: "full" | "compact";
}

function getParseErrorMessage(err: unknown): string {
  if (err instanceof ActivityParseError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "파일을 처리하는 중 오류가 발생했습니다.";
}

export function FileUploader({ variant = "full" }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<CsvUploadMode>("prepend");
  const [isReading, setIsReading] = useState(false);

  const { uploadCsvData, uploadExcelData } = useEmissionStore(
    useShallow((state) => ({
      uploadCsvData: state.uploadCsvData,
      uploadExcelData: state.uploadExcelData,
    })),
  );

  const processFile = useCallback(
    (file: File) => {
      setParseError(null);
      setSuccessMessage(null);

      const lowerName = file.name.toLowerCase();
      const isExcel =
        lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls");
      const isText =
        lowerName.endsWith(".csv") || lowerName.endsWith(".txt");

      const hasValidExt = ACCEPTED_EXTENSIONS.some((ext) =>
        lowerName.endsWith(ext),
      );
      if (!hasValidExt) {
        setParseError(
          "CSV(.csv), 텍스트(.txt), 엑셀(.xlsx, .xls) 파일만 업로드할 수 있습니다.",
        );
        return;
      }

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setParseError(`파일 크기는 ${MAX_FILE_SIZE_MB}MB 이하여야 합니다.`);
        return;
      }

      setIsReading(true);

      if (isExcel) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const buffer = reader.result;
            if (!(buffer instanceof ArrayBuffer)) {
              throw new ActivityParseError("엑셀 바이너리를 읽지 못했습니다.");
            }
            uploadExcelData(buffer, mode);
            setSuccessMessage(
              `${file.name} (엑셀) — ${mode === "prepend" ? "기존 데이터 앞에 병합" : "전체 교체"} 완료. KPI·차트에 즉시 반영됩니다.`,
            );
          } catch (err) {
            setParseError(getParseErrorMessage(err));
          } finally {
            setIsReading(false);
          }
        };
        reader.onerror = () => {
          setParseError("엑셀 파일을 읽을 수 없습니다. 다시 시도해주세요.");
          setIsReading(false);
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      if (isText) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const rawText =
              typeof reader.result === "string" ? reader.result : "";
            uploadCsvData(rawText, mode);
            setSuccessMessage(
              `${file.name} — ${mode === "prepend" ? "기존 데이터 앞에 병합" : "전체 교체"} 완료. KPI·차트에 즉시 반영됩니다.`,
            );
          } catch (err) {
            setParseError(getParseErrorMessage(err));
          } finally {
            setIsReading(false);
          }
        };
        reader.onerror = () => {
          setParseError("파일을 읽을 수 없습니다. 다시 시도해주세요.");
          setIsReading(false);
        };
        reader.readAsText(file, "UTF-8");
        return;
      }

      setParseError("지원하지 않는 파일 형식입니다.");
      setIsReading(false);
    },
    [mode, uploadCsvData, uploadExcelData],
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile],
  );

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        processFile(file);
      }
      event.target.value = "";
    },
    [processFile],
  );

  const isCompact = variant === "compact";

  return (
    <section
      aria-label="활동 데이터 파일 업로드"
      className={
        isCompact
          ? "px-3 pb-3"
          : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      }
    >
      {!isCompact ? (
        <header className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            활동 데이터 임포트
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            CSV·엑셀(.xlsx, .xls) 과제용 양식을 가공 없이 업로드하면 배출계수가
            자동 적용됩니다.
          </p>
        </header>
      ) : (
        <p className="mb-2 px-2 text-xs font-medium text-slate-400">
          CSV · 엑셀 임포트
        </p>
      )}

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          "cursor-pointer rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors",
          isCompact
            ? "border-slate-700 bg-slate-900/50 py-4"
            : "border-slate-200 bg-slate-50",
          isDragging
            ? isCompact
              ? "border-emerald-400 bg-emerald-950/40"
              : "border-emerald-400 bg-emerald-50"
            : "",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt,.xlsx,.xls,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          onChange={onFileChange}
        />
        <p
          className={
            isCompact
              ? "text-xs text-slate-300"
              : "text-sm font-medium text-slate-700"
          }
        >
          {isReading
            ? "파일 분석 중…"
            : "파일을 드래그하거나 클릭하여 선택"}
        </p>
        <p
          className={
            isCompact
              ? "mt-1 text-[10px] text-slate-500"
              : "mt-1 text-xs text-slate-500"
          }
        >
          CSV · 엑셀(.xlsx, .xls) · 최대 {MAX_FILE_SIZE_MB}MB
        </p>
        {!isCompact ? (
          <p className="mt-2 text-[11px] font-medium text-emerald-700">
            엑셀 파일 지원 — 첫 번째 시트를 자동으로 읽습니다
          </p>
        ) : null}
      </div>

      <div
        className={
          isCompact
            ? "mt-2 space-y-2 px-1"
            : "mt-3 flex flex-wrap items-center gap-3"
        }
      >
        <label
          className={
            isCompact
              ? "flex items-center gap-2 text-[10px] text-slate-400"
              : "flex items-center gap-2 text-xs text-slate-600"
          }
        >
          <input
            type="radio"
            name={`file-mode-${variant}`}
            checked={mode === "prepend"}
            onChange={() => setMode("prepend")}
            className="accent-emerald-600"
          />
          기존 데이터 앞에 추가
        </label>
        <label
          className={
            isCompact
              ? "flex items-center gap-2 text-[10px] text-slate-400"
              : "flex items-center gap-2 text-xs text-slate-600"
          }
        >
          <input
            type="radio"
            name={`file-mode-${variant}`}
            checked={mode === "replace"}
            onChange={() => setMode("replace")}
            className="accent-emerald-600"
          />
          전체 교체
        </label>
      </div>

      {!isCompact ? (
        <details className="mt-3 text-xs text-slate-500">
          <summary className="cursor-pointer font-medium text-slate-600">
            CSV 양식 예시 보기 (엑셀도 동일 열 구조)
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-100 p-3 text-[11px] text-slate-700">
            {ACTIVITY_CSV_TEMPLATE}
          </pre>
        </details>
      ) : null}

      {parseError ? (
        <p
          role="alert"
          className={
            isCompact
              ? "mt-2 rounded-lg bg-red-950/60 px-2 py-2 text-[10px] text-red-300"
              : "mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          }
        >
          {parseError}
        </p>
      ) : null}

      {successMessage ? (
        <p
          className={
            isCompact
              ? "mt-2 rounded-lg bg-emerald-950/50 px-2 py-2 text-[10px] text-emerald-300"
              : "mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          }
        >
          {successMessage}
        </p>
      ) : null}
    </section>
  );
}

/** @deprecated FileUploader 사용 */
export { FileUploader as CsvUploader };
