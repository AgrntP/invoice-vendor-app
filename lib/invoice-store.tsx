"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { type Invoice, type InvoiceStatus } from "@/types/invoice";
import { mockInvoices as initialData } from "@/data/mock-invoices";

/**
 * Dữ liệu cần thiết để tạo / cập nhật invoice
 * (không có id — được generate khi tạo mới)
 */
export type InvoiceFormData = {
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  description?: string;
};

interface InvoiceContextValue {
  invoices: Invoice[];
  addInvoice: (data: InvoiceFormData) => Invoice;
  updateInvoice: (id: string, data: Partial<InvoiceFormData>) => void;
  deleteInvoice: (id: string) => void;
  payInvoices: (ids: string[]) => void;
  getInvoice: (id: string) => Invoice | undefined;
}

const InvoiceContext = createContext<InvoiceContextValue | null>(null);

/**
 * InvoiceProvider
 *
 * Bọc toàn bộ dashboard — mọi trang con đều truy cập
 * được dữ liệu invoice qua useInvoices() hook.
 *
 * State được giữ in-memory trong session.
 * Khi tích hợp Supabase, thay các hàm CRUD bằng API calls.
 */
export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialData);

  const addInvoice = useCallback((data: InvoiceFormData): Invoice => {
    const newInvoice: Invoice = {
      ...data,
      id: `inv_${Date.now()}`,
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    return newInvoice;
  }, []);

  const updateInvoice = useCallback(
    (id: string, data: Partial<InvoiceFormData>) => {
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, ...data } : inv))
      );
    },
    []
  );

  const deleteInvoice = useCallback((id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  }, []);

  const payInvoices = useCallback((ids: string[]) => {
    setInvoices((prev) =>
      prev.map((inv) => (ids.includes(inv.id) ? { ...inv, status: "paid" } : inv))
    );
  }, []);

  const getInvoice = useCallback(
    (id: string) => invoices.find((inv) => inv.id === id),
    [invoices]
  );

  return (
    <InvoiceContext.Provider
      value={{ invoices, addInvoice, updateInvoice, deleteInvoice, payInvoices, getInvoice }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

/**
 * Hook để dùng Invoice context
 * Phải được gọi bên trong InvoiceProvider
 */
export function useInvoices() {
  const ctx = useContext(InvoiceContext);
  if (!ctx) {
    throw new Error("useInvoices must be used within <InvoiceProvider>");
  }
  return ctx;
}
