"use client";

import { useState } from "react";
import {
  useTable,
  flexRender,
  createSortedRowModel,
  createPaginatedRowModel,
  createFilteredRowModel,
  tableFeatures,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Invoice } from "@/types/invoice";
import { columns } from "./columns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  CheckCircle,
  Download,
} from "lucide-react";

/**
 * Chỉ import 5 features cần thiết (thay vì stockFeatures = 17 features)
 * → Tree-shaking loại bỏ code thừa, giảm bundle size đáng kể
 */
const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

interface InvoiceTableProps {
  data: Invoice[];
  statusFilter: string;
  searchQuery: string;
}

/**
 * InvoiceTable component - Bảng dữ liệu hóa đơn
 *
 * Sử dụng TanStack Table v9 API:
 * - useTable thay vì useReactTable
 * - stockFeatures + createXxxRowModel factories
 * - table.state thay vì table.getState()
 *
 * Tính năng:
 * - Sorting (click header để sắp xếp)
 * - Pagination (phân trang) với rows per page selector
 * - Row selection (checkbox) + bulk action bar
 * - Client-side filtering (status + search)
 * - Striped rows + hover highlight
 */
export function InvoiceTable({
  data,
  statusFilter,
  searchQuery,
}: InvoiceTableProps) {
  // === Table States ===
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // === Filter data trước khi đưa vào table ===
  const filteredData = data.filter((invoice) => {
    // Status filter
    if (statusFilter !== "all" && invoice.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        invoice.vendorName.toLowerCase().includes(query) ||
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.description?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // === TanStack Table v9 instance ===
  const table = useTable({
    features,
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    initialState: {
      pagination: {
        pageSize: 10,
        pageIndex: 0,
      },
    },
  });

  // Số lượng row đang selected
  const selectedCount = Object.keys(rowSelection).length;

  // Lấy pagination state từ table.state (v9 API)
  const paginationState = table.state.pagination;

  return (
    <div className="space-y-3">
      {/* === Bulk Action Bar (hiện khi có rows selected) === */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-bill-green/30 bg-bill-green-light px-4 py-2.5 animate-fade-in">
          <span className="text-sm font-medium text-bill-green">
            {selectedCount} invoice{selectedCount > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" className="gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* === Data Table === */}
      <div className="overflow-hidden rounded-xl border border-border-default bg-white shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-border-default bg-gray-50/80"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left"
                      style={{
                        width: header.getSize() !== 150 ? header.getSize() : undefined,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* Table Body */}
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-border-light transition-colors duration-100",
                      row.getIsSelected()
                        ? "bg-bill-green-50"
                        : index % 2 === 0
                          ? "bg-white"
                          : "bg-gray-50/40",
                      "hover:bg-bill-green-50/50"
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                /* Empty state */
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg
                          className="h-6 w-6 text-text-muted"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-text-secondary">
                        No invoices found
                      </p>
                      <p className="text-xs text-text-muted">
                        Try adjusting your search or filter criteria
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* === Pagination Footer === */}
        <div className="flex items-center justify-between border-t border-border-default bg-gray-50/50 px-4 py-3">
          {/* Left: Result count */}
          <div className="text-sm text-text-secondary">
            Showing{" "}
            <span className="font-medium text-text-primary">
              {paginationState.pageIndex * paginationState.pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-text-primary">
              {Math.min(
                (paginationState.pageIndex + 1) * paginationState.pageSize,
                filteredData.length
              )}
            </span>{" "}
            of{" "}
            <span className="font-medium text-text-primary">
              {filteredData.length}
            </span>{" "}
            results
          </div>

          {/* Center: Rows per page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Rows per page:</span>
            <select
              value={paginationState.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="h-8 rounded-md border border-border-default bg-white px-2 text-sm text-text-primary focus:border-bill-green focus:outline-none cursor-pointer"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          {/* Right: Page navigation */}
          <div className="flex items-center gap-1">
            {/* First page */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Previous page */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page number indicators */}
            <div className="flex items-center gap-1 mx-2">
              {Array.from(
                { length: table.getPageCount() },
                (_, i) => i
              ).map((pageIndex) => (
                <button
                  key={pageIndex}
                  onClick={() => table.setPageIndex(pageIndex)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors cursor-pointer",
                    pageIndex === paginationState.pageIndex
                      ? "bg-bill-green text-white"
                      : "text-text-secondary hover:bg-bg-hover"
                  )}
                >
                  {pageIndex + 1}
                </button>
              ))}
            </div>

            {/* Next page */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last page */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
