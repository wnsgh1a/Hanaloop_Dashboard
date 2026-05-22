"use client";

import { FileUploader } from "@/components/dashboard/FileUploader";

export type DashboardTab = "dashboard" | "activities";

const NAV_ITEMS: { id: DashboardTab; label: string }[] = [
  { id: "dashboard", label: "PCF 대시보드" },
  { id: "activities", label: "활동 데이터" },
];

interface SidebarProps {
  open: boolean;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onClose: () => void;
}

export function Sidebar({
  open,
  activeTab,
  onTabChange,
  onClose,
}: SidebarProps) {
  const handleTabClick = (tab: DashboardTab) => {
    onTabChange(tab);
    onClose();
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="사이드바 닫기"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-slate-950 text-slate-100 transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">
            H
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">HanaLoop</p>
            <p className="text-xs text-slate-400">PCF Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3" aria-label="주 메뉴">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => handleTabClick(item.id)}
                className={[
                  "flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  isActive
                    ? "bg-emerald-600/20 font-medium text-emerald-300"
                    : "text-slate-300 hover:bg-slate-800",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-800">
          <FileUploader variant="compact" />
        </div>

        <p className="px-5 py-3 text-xs text-slate-500">
          제품 탄소 발자국(PCF) 시각화
        </p>
      </aside>
    </>
  );
}
