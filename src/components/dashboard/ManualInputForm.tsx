"use client";

import { useState } from "react";
import { useShallow } from "zustand/react/shallow";

import type { ActivityCategory, ActivityUnit } from "@/lib/types";
import {
  type ImportMode,
  useEmissionStore,
} from "@/store/useEmissionStore";

const CATEGORY_OPTIONS: {
  value: ActivityCategory;
  label: string;
  unit: ActivityUnit;
}[] = [
  { value: "electricity", label: "전기", unit: "kWh" },
  { value: "plastic_raw_1", label: "원소재 플라스틱 1", unit: "kg" },
  { value: "plastic_raw_2", label: "원소재 플라스틱 2", unit: "kg" },
  { value: "transport_truck", label: "운송 트럭", unit: "ton-km" },
];

const VALIDATION_MESSAGE = "모든 필수 필드를 올바르게 입력해주세요.";

export function ManualInputForm() {
  const addManualActivity = useEmissionStore(
    useShallow((state) => state.addManualActivity),
  );

  const [category, setCategory] = useState<ActivityCategory>("electricity");
  const [activityAmount, setActivityAmount] = useState("");
  const [period, setPeriod] = useState("");
  const [productId, setProductId] = useState("");
  const [mode, setMode] = useState<ImportMode>("prepend");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedUnit =
    CATEGORY_OPTIONS.find((opt) => opt.value === category)?.unit ?? "kWh";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const amount = Number(activityAmount);
    const periodTrimmed = period.trim();

    if (
      activityAmount.trim() === "" ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      periodTrimmed === ""
    ) {
      setFormError(VALIDATION_MESSAGE);
      return;
    }

    addManualActivity(
      {
        category,
        activityAmount: amount,
        unit: selectedUnit,
        period: periodTrimmed,
        ...(productId.trim() ? { productId: productId.trim() } : {}),
      },
      mode,
    );

    setActivityAmount("");
    setPeriod("");
    setProductId("");
    setSuccessMessage("활동 데이터가 수동으로 추가되었습니다.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">
            활동 유형 <span className="text-red-500">*</span>
          </span>
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as ActivityCategory)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col justify-end gap-1.5 rounded-lg border border-dashed border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <span className="text-xs text-emerald-800">자동 입력 단위</span>
          <span className="text-sm font-semibold text-emerald-900">
            {selectedUnit}
          </span>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">
            활동량 <span className="text-red-500">*</span>
          </span>
          <input
            type="number"
            min={0}
            step="any"
            value={activityAmount}
            onChange={(e) => setActivityAmount(e.target.value)}
            placeholder="0"
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">
            기간 <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="2024-Q1"
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">제품 식별자</span>
          <input
            type="text"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="PCF-A"
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="radio"
            name="manual-mode"
            checked={mode === "prepend"}
            onChange={() => setMode("prepend")}
            className="accent-emerald-600"
          />
          기존 데이터 앞에 추가
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="radio"
            name="manual-mode"
            checked={mode === "replace"}
            onChange={() => setMode("replace")}
            className="accent-emerald-600"
          />
          전체 교체
        </label>
      </div>

      <button
        type="submit"
        className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
        활동 데이터 등록
      </button>

      {formError ? (
        <p
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          {formError}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {successMessage}
        </p>
      ) : null}
    </form>
  );
}
