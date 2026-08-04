"use client";

import { cn } from "@/lib/utils";
import { Search, Bell, ChevronDown, User } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  isSidebarCollapsed: boolean;
}

/**
 * Header component - Thanh header cố định phía trên
 *
 * Tính năng:
 * - Global search bar
 * - Notification bell với badge count
 * - User profile dropdown
 * - Responsive theo trạng thái sidebar
 */
export function Header({ isSidebarCollapsed }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-border-default bg-white px-6 transition-all duration-300",
        isSidebarCollapsed ? "left-[72px]" : "left-[260px]"
      )}
    >
      {/* === Left: Search Bar === */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search invoices, vendors, payments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "h-10 w-full rounded-lg border border-border-default bg-bg-main pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted",
            "transition-all duration-150",
            "focus:border-bill-green focus:outline-none focus:ring-2 focus:ring-bill-green/20"
          )}
        />
      </div>

      {/* === Right: Actions === */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {/* Badge count */}
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-status-overdue text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* Divider */}
        <div className="mx-2 h-8 w-px bg-border-default" />

        {/* User Profile Dropdown */}
        <DropdownMenu
          trigger={
            <div className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg-hover cursor-pointer">
              {/* Avatar */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bill-green text-sm font-semibold text-white">
                JD
              </div>
              {/* User info */}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-text-primary">
                  John Doe
                </p>
                <p className="text-xs text-text-muted">Admin</p>
              </div>
              <ChevronDown className="h-4 w-4 text-text-muted" />
            </div>
          }
        >
          {/* Dropdown content */}
          <div className="px-3 py-2 border-b border-border-default">
            <p className="text-sm font-medium text-text-primary">John Doe</p>
            <p className="text-xs text-text-muted">john@company.com</p>
          </div>
          <DropdownMenuItem>
            <User className="h-4 w-4" />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="h-4 w-4" />
            Preferences
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive>Log out</DropdownMenuItem>
        </DropdownMenu>
      </div>
    </header>
  );
}
