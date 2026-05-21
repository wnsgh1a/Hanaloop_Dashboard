"use client";

interface ErrorBannerProps {
  message: string;
  hasCachedData: boolean;
  isRetrying: boolean;
  onRetry: () => void;
}

export function ErrorBanner({
  message,
  hasCachedData,
  isRetrying,
  onRetry,
}: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-900 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-sm font-semibold">데이터를 불러오지 못했습니다</p>
        <p className="mt-0.5 text-sm text-red-800">{message}</p>
        {hasCachedData ? (
          <p className="mt-1 text-xs text-red-700">
            이전에 불러온 데이터를 계속 표시합니다. 새로고침하려면 다시 시도를
            눌러주세요.
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRetrying ? "재시도 중…" : "다시 시도"}
      </button>
    </div>
  );
}
