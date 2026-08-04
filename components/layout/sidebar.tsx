"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ArrowDownToLine,
  FolderOpen,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from "lucide-react";

/**
 * Navigation items cho sidebar
 * Mỗi item có: label, icon, href
 */
const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Payables",
    icon: FileText,
    href: "/payables",
  },
  {
    label: "Receivables",
    icon: ArrowDownToLine,
    href: "/receivables",
  },
  {
    label: "Documents",
    icon: FolderOpen,
    href: "/documents",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

/**
 * Sidebar component - Menu điều hướng bên trái
 *
 * Tính năng:
 * - Thu gọn / mở rộng (collapse/expand)
 * - Active state highlight dựa trên pathname
 * - Tooltip khi thu gọn
 * - Smooth transition animation
 * - Logo BILL ở trên, Help + User avatar ở dưới
 */
export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border-default bg-white transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* === Logo Area === */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-border-default px-4",
          isCollapsed ? "justify-center" : "gap-3"
        )}
      >
        {/* Logo icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bill-green">
          <Receipt className="h-5 w-5 text-white" />
        </div>

        {/* Logo text - chỉ hiện khi mở rộng */}
        {!isCollapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold tracking-tight text-text-primary">
              BILL
            </h1>
            <p className="text-[10px] leading-none text-text-muted">
              Finance Manager
            </p>
          </div>
        )}
      </div>

      {/* === Navigation Links === */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          // Kiểm tra active state: match chính xác hoặc bắt đầu bằng href
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              data-tooltip={isCollapsed ? item.label : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isCollapsed && "justify-center px-0",
                isActive
                  ? "bg-bill-green-light text-bill-green"
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive
                    ? "text-bill-green"
                    : "text-text-muted group-hover:text-text-secondary"
                )}
              />
              {!isCollapsed && (
                <span className="animate-fade-in">{item.label}</span>
              )}

              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 h-8 w-[3px] rounded-r-full bg-bill-green" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* === Bottom Section === */}
      <div className="border-t border-border-default p-3">
        {/* Help link */}
        <Link
          href="/help"
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary",
            isCollapsed && "justify-center px-0"
          )}
        >
          <HelpCircle className="h-5 w-5 shrink-0 text-text-muted group-hover:text-text-secondary" />
          {!isCollapsed && <span className="animate-fade-in">Help & Support</span>}
        </Link>

        {/* Collapse toggle button */}
        <button
          onClick={onToggle}
          className={cn(
            "mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary cursor-pointer",
            isCollapsed && "justify-center px-0"
          )}
          aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 shrink-0" />
              <span className="animate-fade-in">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
