"use client";

import { cn } from "@/lib/utils";
import { Search, Calendar, X } from "lucide-react";
import { InvoiceStatus } from "@/types/invoice";

/**
 * Các tab filter theo status
 */
const statusFilters: { label: string; value: InvoiceStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
];

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: InvoiceStatus | "all";
  onStatusChange: (status: InvoiceStatus | "all") => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
}

/**
 * FilterBar component - Thanh tìm kiếm và lọc
 *
 * Tính năng:
 * - Search input với icon và clear button
 * - Status filter pills (tabs style)
 * - Date range picker (from/to)
 * - Active filter count
 */
export function FilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: FilterBarProps) {
  // Đếm số filter đang active
  const activeFilterCount = [
    statusFilter !== "all",
    searchQuery.length > 0,
    dateFrom.length > 0,
    dateTo.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4 rounded-xl border border-border-default bg-white p-4 shadow-[var(--shadow-card)]">
      {/* Row 1: Search + Date Range */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by vendor name, invoice number..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "h-10 w-full rounded-lg border border-border-default bg-bg-main pl-10 pr-10 text-sm text-text-primary placeholder:text-text-muted",
              "transition-all duration-150",
              "focus:border-bill-green focus:outline-none focus:ring-2 focus:ring-bill-green/20"
            )}
          />
          {/* Nút Clear search */}
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-text-muted" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="h-10 rounded-lg border border-border-default bg-bg-main px-3 text-sm text-text-primary focus:border-bill-green focus:outline-none focus:ring-2 focus:ring-bill-green/20"
            placeholder="From"
          />
          <span className="text-text-muted text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="h-10 rounded-lg border border-border-default bg-bg-main px-3 text-sm text-text-primary focus:border-bill-green focus:outline-none focus:ring-2 focus:ring-bill-green/20"
            placeholder="To"
          />
        </div>
      </div>

      {/* Row 2: Status Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {statusFilters.map((filter) => {
          const isActive = statusFilter === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => onStatusChange(filter.value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 cursor-pointer",
                isActive
                  ? "bg-bill-green text-white shadow-sm"
                  : "bg-bg-main text-text-secondary hover:bg-gray-200 hover:text-text-primary"
              )}
            >
              {filter.label}
            </button>
          );
        })}

        {/* Active filter count badge */}
        {activeFilterCount > 0 && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-text-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bill-green text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
            active filter{activeFilterCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
