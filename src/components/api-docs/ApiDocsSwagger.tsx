"use client";

import dynamic from "next/dynamic";

import openApiSpec from "../../../docs/openapi.json";

import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      API 명세 UI 로딩 중…
    </div>
  ),
});

export function ApiDocsSwagger() {
  return (
    <SwaggerUI
      spec={openApiSpec}
      docExpansion="list"
      defaultModelsExpandDepth={2}
      displayRequestDuration
      tryItOutEnabled={false}
    />
  );
}
