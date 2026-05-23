"use client";

import { useState } from "react";

import { FileUploader } from "@/components/dashboard/FileUploader";
import { ManualInputForm } from "@/components/dashboard/ManualInputForm";

type ImportTab = "file" | "manual";

export function ActivityImportPanel() {
  const [importTab, setImportTab] = useState<ImportTab>("file");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">
          활동 데이터 임포트
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          파일 업로드 또는 화면에서 직접 입력 — 배출계수가 자동 적용됩니다.
        </p>
      </header>

      <div
        className="mb-4 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1"
        role="tablist"
        aria-label="임포트 방식"
      >
        <button
          type="button"
          role="tab"
          aria-selected={importTab === "file"}
          onClick={() => setImportTab("file")}
          className={[
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            importTab === "file"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900",
          ].join(" ")}
        >
          파일 업로드
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={importTab === "manual"}
          onClick={() => setImportTab("manual")}
          className={[
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            importTab === "manual"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900",
          ].join(" ")}
        >
          수동 입력
        </button>
      </div>

      {importTab === "file" ? (
        <FileUploader variant="full" embedded />
      ) : (
        <ManualInputForm />
      )}
    </section>
  );
}
