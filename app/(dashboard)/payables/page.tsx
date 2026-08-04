"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { KPICards } from "@/components/payables/kpi-cards";
import { FilterBar } from "@/components/payables/filter-bar";
import { InvoiceTable } from "@/components/payables/invoice-table";
import { mockInvoices } from "@/data/mock-invoices";
import { InvoiceStatus } from "@/types/invoice";
import { Plus, Upload, FileText } from "lucide-react";

/**
 * Trang Accounts Payable List (/payables)
 *
 * Cấu trúc:
 * 1. Top Bar: Breadcrumb + Title + Action buttons
 * 2. KPI Cards: 4 thẻ tóm tắt
 * 3. Filter Bar: Search + Status filters + Date range
 * 4. Data Table: Danh sách hóa đơn với sorting, pagination
 *
 * Tất cả state được quản lý tại đây (lifted state)
 * và truyền xuống các child components qua props.
 */
export default function PayablesPage() {
  // === Filter states ===
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">(
    "all"
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ======================== */}
      {/* 1. TOP BAR               */}
      {/* ======================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Breadcrumb + Title */}
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-text-muted mb-1">
            <FileText className="h-3.5 w-3.5" />
            <span>Invoices</span>
            <span>/</span>
            <span className="text-text-primary font-medium">Payables</span>
          </div>
          {/* Title */}
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Accounts Payable
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage and track all your outstanding invoices
          </p>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Import Button */}
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>

          {/* Create Invoice Button */}
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* ======================== */}
      {/* 2. KPI CARDS              */}
      {/* ======================== */}
      <KPICards />

      {/* ======================== */}
      {/* 3. FILTER BAR             */}
      {/* ======================== */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      {/* ======================== */}
      {/* 4. DATA TABLE             */}
      {/* ======================== */}
      <InvoiceTable
        data={mockInvoices}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
      />
    </div>
  );
}
