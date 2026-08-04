"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

/**
 * Dashboard Layout
 *
 * Layout chung cho tất cả trang trong dashboard:
 * - Sidebar bên trái (collapse/expand)
 * - Header cố định phía trên
 * - Main content area ở giữa (scrollable)
 *
 * Lý do dùng "use client":
 * - Cần state để quản lý sidebar collapse
 * - Sidebar toggle là interactive behavior
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // State quản lý sidebar thu gọn/mở rộng
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-full bg-bg-main">
      {/* Sidebar navigation */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main area: Header + Content */}
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          isSidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
        )}
      >
        {/* Fixed header */}
        <Header isSidebarCollapsed={isSidebarCollapsed} />

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto pt-16">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
