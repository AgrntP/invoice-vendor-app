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
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

interface ColumnHandlers {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPay: (id: string) => void;
}

/**
 * createColumns — tạo column definitions cho TanStack Table v9
 *
 * Nhận handlers để xử lý Edit/Delete/Pay từ parent component.
 */
export function createColumns({
  onEdit,
  onDelete,
  onPay,
}: ColumnHandlers): ColumnDef<TableFeatures, Invoice>[] {
  return [
    // === 1. Checkbox ===
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
        const isOverdue = row.original.status === "overdue";
        return (
          <span
            className={`text-sm ${isOverdue ? "font-semibold text-status-overdue" : "text-text-secondary"}`}
          >
            {formatDate(row.getValue("dueDate"))}
            {isOverdue && (
              <span className="ml-1 text-[10px] font-bold">!</span>
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

    // === 8. Actions Dropdown ===
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => {
        const invoice = row.original;
        const isPaid = invoice.status === "paid";
        return (
          <DropdownMenu
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          >
            {!isPaid && (
              <DropdownMenuItem onClick={() => onPay(invoice.id)}>
                Pay Now
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit(invoice.id)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onClick={() => {
                if (
                  window.confirm(
                    `Delete invoice "${invoice.invoiceNumber}"?\nThis action cannot be undone.`
                  )
                ) {
                  onDelete(invoice.id);
                }
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      size: 52,
    },
  ];
}

