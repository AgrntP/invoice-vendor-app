"use client";

import { cn } from "@/lib/utils";
import {
  Search,
  Bell,
  ChevronDown,
  User,
  Loader2,
  X,
  FileText,
  Building2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  isSidebarCollapsed: boolean;
}

interface InvoiceSearchResult {
  id: string;
  invoice_number: string;
  total: number;
  currency: string;
  status: string;
  vendors?: { name: string } | null;
}

/**
 * Header component - Fixed header bar with non-clickable live invoice search results
 */
export function Header({ isSidebarCollapsed }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<InvoiceSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Supabase search for invoice numbers
  useEffect(() => {
    const query = searchQuery.trim();

    if (!query) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          id,
          invoice_number,
          total,
          currency,
          status,
          vendors ( name )
        `)
        .ilike("invoice_number", `%${query}%`)
        .is("deleted_at", null)
        .limit(6);

      if (!error && data) {
        const formattedData: InvoiceSearchResult[] = data.map((inv: any) => ({
          ...inv,
          vendors: Array.isArray(inv.vendors) ? inv.vendors[0] : inv.vendors,
        }));
        setResults(formattedData);
      } else {
        setResults([]);
      }
      setIsLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-border-default bg-white px-6 transition-all duration-300",
        isSidebarCollapsed ? "left-[72px]" : "left-[260px]"
      )}
    >
      {/* === Left: Search Bar === */}
      <div ref={searchRef} className="relative w-full max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search invoice number..."
            value={searchQuery}
            onFocus={() => searchQuery.trim() && setIsOpen(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "h-10 w-full rounded-lg border border-border-default bg-bg-main pl-10 pr-9 text-sm text-text-primary placeholder:text-text-muted",
              "transition-all duration-150",
              "focus:border-bill-green focus:outline-none focus:ring-2 focus:ring-bill-green/20"
            )}
          />
          
          {/* Loading spinner or clear button */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={clearSearch}
                className="text-text-muted hover:text-text-primary p-0.5 rounded cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Search Results Overlay (Static / Unclickable) */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl animate-in fade-in-50 slide-in-from-top-2">
            {results.length > 0 ? (
              <div className="py-2">
                <div className="px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted border-b border-gray-100">
                  Matching Invoices ({results.length})
                </div>
                <div className="divide-y divide-gray-100">
                  {results.map((invoice) => {
                    const vendorName = invoice.vendors?.name || "Unknown Vendor";
                    const isVnd = invoice.currency?.toUpperCase() === "VND";
                    const formattedTotal = isVnd
                      ? `₫${(invoice.total || 0).toLocaleString("vi-VN")}`
                      : `$${(invoice.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

                    return (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between px-4 py-2.5 select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">
                              #{invoice.invoice_number}
                            </p>
                            <p className="text-xs text-text-muted truncate flex items-center gap-1">
                              <Building2 className="h-3 w-3 inline" />
                              {vendorName}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-text-primary">
                            {formattedTotal}
                          </p>
                          <span
                            className={cn(
                              "inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase mt-0.5",
                              invoice.status === "paid"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            )}
                          >
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : !isLoading ? (
              <div className="p-6 text-center text-sm text-text-muted">
                No invoices found matching <span className="font-semibold text-text-primary">"{searchQuery}"</span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* === Right: Actions === */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
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
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bill-green text-sm font-semibold text-white">
                H
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-text-primary">
                  Hoang Nguyen
                </p>
                <p className="text-xs text-text-muted">Admin</p>
              </div>
              <ChevronDown className="h-4 w-4 text-text-muted" />
            </div>
          }
        >
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