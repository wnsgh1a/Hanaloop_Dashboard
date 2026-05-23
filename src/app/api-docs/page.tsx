import type { Metadata } from "next";
import Link from "next/link";

import { ApiDocsSwagger } from "@/components/api-docs/ApiDocsSwagger";

export const metadata: Metadata = {
  title: "API Docs | HanaLoop PCF Dashboard",
  description: "Mock Activity API OpenAPI 3.0 명세 (Swagger UI)",
};

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              OpenAPI 3.0
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              HanaLoop Mock API 명세
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              `src/lib/api.ts` 클라이언트 Mock · 실제 HTTP 엔드포인트 없음
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            ← 대시보드로
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-2 py-4 sm:px-4">
        <ApiDocsSwagger />
      </main>
    </div>
  );
}
