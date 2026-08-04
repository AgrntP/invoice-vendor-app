"use client";

import {
  type ColumnDef,
  type TableFeatures,
} from "@tanstack/react-table";
import { Invoice, STATUS_CONFIG } from "@/types/invoice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Pencil,
  CheckCircle,
  Trash2,
} from "lucide-react";

/**
 * Column definitions cho TanStack Table v9
 *
 * TanStack Table v9 API thay đổi:
 * - ColumnDef giờ yêu cầu TFeatures type param
 * - Sử dụng StockFeatures cho full feature set
 *
 * Các cột:
 * 1. Checkbox - Bulk select
 * 2. Vendor Name - Sortable
 * 3. Invoice # - Sortable
 * 4. Invoice Date - Sortable, formatted
 * 5. Due Date - Sortable, formatted, highlight overdue
 * 6. Amount - Sortable, right-aligned, formatted currency
 * 7. Status - Badge với color coding
 * 8. Actions - Dropdown menu
 */
export const columns: ColumnDef<TableFeatures, Invoice>[] = [
  // === 1. Checkbox Column ===
  {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 accent-bill-green cursor-pointer"
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 accent-bill-green cursor-pointer"
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    size: 40,
  },

  // === 2. Vendor Name ===
  {
    accessorKey: "vendorName",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Vendor Name
        <ArrowUpDown className="h-3.5 w-3.5" />
      </button>
    ),
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-text-primary">
          {row.getValue("vendorName")}
        </p>
        {row.original.description && (
          <p className="text-xs text-text-muted mt-0.5 truncate max-w-[200px]">
            {row.original.description}
          </p>
        )}
      </div>
    ),
  },

  // === 3. Invoice Number ===
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Invoice #
        <ArrowUpDown className="h-3.5 w-3.5" />
      </button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm text-text-secondary">
        {row.getValue("invoiceNumber")}
      </span>
    ),
  },

  // === 4. Invoice Date ===
  {
    accessorKey: "invoiceDate",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Invoice Date
        <ArrowUpDown className="h-3.5 w-3.5" />
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-text-secondary">
        {formatDate(row.getValue("invoiceDate"))}
      </span>
    ),
  },

  // === 5. Due Date ===
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Due Date
        <ArrowUpDown className="h-3.5 w-3.5" />
      </button>
    ),
    cell: ({ row }) => {
      const dueDate = row.getValue("dueDate") as string;
      const isOverdue = row.original.status === "overdue";
      return (
        <span
          className={`text-sm ${isOverdue ? "font-semibold text-status-overdue" : "text-text-secondary"}`}
        >
          {formatDate(dueDate)}
          {isOverdue && (
            <span className="ml-1 text-[10px] font-bold text-status-overdue">
              !
            </span>
          )}
        </span>
      );
    },
  },

  // === 6. Amount ===
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <button
        className="flex w-full items-center justify-end gap-1 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Amount
        <ArrowUpDown className="h-3.5 w-3.5" />
      </button>
    ),
    cell: ({ row }) => (
      <div className="text-right font-semibold text-text-primary">
        {formatCurrency(row.getValue("amount"))}
      </div>
    ),
  },

  // === 7. Status Badge ===
  {
    accessorKey: "status",
    header: () => (
      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
        Status
      </span>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as Invoice["status"];
      const config = STATUS_CONFIG[status];
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },

  // === 8. Actions ===
  {
    id: "actions",
    header: () => (
      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
        Actions
      </span>
    ),
    cell: ({ row }) => {
      const invoice = row.original;
      return (
        <DropdownMenu
          trigger={
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          }
        >
          <DropdownMenuItem onClick={() => alert(`View: ${invoice.invoiceNumber}`)}>
            <Eye className="h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => alert(`Edit: ${invoice.invoiceNumber}`)}>
            <Pencil className="h-4 w-4" />
            Edit Invoice
          </DropdownMenuItem>
          {invoice.status === "pending" && (
            <DropdownMenuItem
              onClick={() => alert(`Approve: ${invoice.invoiceNumber}`)}
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            destructive
            onClick={() => alert(`Delete: ${invoice.invoiceNumber}`)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    size: 60,
  },
];
