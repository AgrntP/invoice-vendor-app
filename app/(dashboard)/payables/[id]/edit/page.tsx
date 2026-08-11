"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InvoiceStatus } from "@/types/invoice";
import { useInvoices } from "@/lib/invoice-store";
import { PdfImportZone, type ExtractedInvoiceData } from "@/components/create-invoice/pdf-import-zone";

/**
 * Trang chỉnh sửa invoice: /payables/[id]/edit
 *
 * Layout Side-by-Side (2 cột song song trên Desktop):
 * - Cột trái: Import tài liệu (PDF/Ảnh/TXT) & Xem trước
 * - Cột phải: Form chỉnh sửa hóa đơn
 */
export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { getInvoice, updateInvoice } = useInvoices();
  const invoice = getInvoice(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});

  const [form, setForm] = useState({
    vendorName: "",
    invoiceNumber: "",
    invoiceDate: "",
    dueDate: "",
    amount: "",
    status: "draft" as InvoiceStatus,
    description: "",
  });

  // Handler khi trích xuất tài liệu AI bên cột trái
  const handleDataExtracted = (extracted: ExtractedInvoiceData) => {
    setForm((prev) => ({
      ...prev,
      vendorName: extracted.vendorName || prev.vendorName,
      invoiceNumber: extracted.invoiceNumber || prev.invoiceNumber,
      invoiceDate: extracted.invoiceDate || prev.invoiceDate,
      dueDate: extracted.dueDate || prev.dueDate,
      amount: extracted.amount > 0 ? String(extracted.amount) : prev.amount,
      description: extracted.description || prev.description,
    }));
  };

  // Load invoice data vào form
  useEffect(() => {
    if (!invoice) {
      setNotFound(true);
      return;
    }
    setForm({
      vendorName: invoice.vendorName,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      amount: String(invoice.amount),
      status: invoice.status,
      description: invoice.description ?? "",
    });
  }, [invoice]);

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};
    if (!form.vendorName.trim()) newErrors.vendorName = "Required";
    if (!form.invoiceNumber.trim()) newErrors.invoiceNumber = "Required";
    if (!form.invoiceDate) newErrors.invoiceDate = "Required";
    if (!form.dueDate) newErrors.dueDate = "Required";
    if (form.dueDate && form.invoiceDate && form.dueDate < form.invoiceDate)
      newErrors.dueDate = "Must be after invoice date";
    if (!form.amount || Number(form.amount) <= 0)
      newErrors.amount = "Must be a positive number";
    setErrors(newErrors);
    setTouched(Object.fromEntries(Object.keys(newErrors).map((k) => [k, true])));
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (key: string) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));

    updateInvoice(id, {
      vendorName: form.vendorName.trim(),
      invoiceNumber: form.invoiceNumber.trim(),
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate,
      amount: Number(form.amount),
      status: form.status,
      description: form.description.trim() || undefined,
    });

    router.push("/payables");
  };

  const inputClass = (key: string) =>
    cn(
      "w-full h-9 rounded-lg border px-3 text-sm text-text-primary bg-white",
      "placeholder:text-text-muted outline-none transition-colors duration-150",
      "focus:border-bill-green focus:ring-2 focus:ring-bill-green/20",
      touched[key] && errors[key]
        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
        : "border-border-default hover:border-gray-300"
    );

  const labelClass = "block text-sm font-medium text-text-primary mb-1.5";
  const errorClass = "mt-1 text-xs text-red-500";

  // Invoice không tìm thấy
  if (notFound) {
    return (
      <div className="max-w-3xl space-y-6 animate-fade-in">
        <div>
          <div className="flex items-center gap-1.5 text-sm text-text-muted mb-1">
            <span>Payables</span>
            <span>/</span>
            <span className="text-text-primary font-medium">Edit Invoice</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Invoice Not Found
          </h1>
        </div>
        <div className="rounded-xl border border-border-default bg-white shadow-[var(--shadow-card)] p-8 text-center">
          <p className="text-text-secondary text-sm mb-4">
            The invoice you are looking for does not exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/payables")}>
            Back to Payables
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      {/* Breadcrumb + Title */}
      <div>
        <div className="flex items-center gap-1.5 text-sm text-text-muted mb-1">
          <span>Payables</span>
          <span>/</span>
          <span className="text-text-primary font-medium">Edit Invoice</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Edit Invoice
        </h1>
        {invoice && (
          <p className="text-sm text-text-secondary mt-0.5">
            {invoice.invoiceNumber} · {invoice.vendorName}
          </p>
        )}
      </div>

      {/* 2-Column Side-by-Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Cột trái: Import Document & Live Preview */}
        <div className="rounded-xl border border-border-default bg-white shadow-[var(--shadow-card)] p-6 space-y-4 lg:sticky lg:top-20">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              Import / Document Preview
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Upload a document to extract/update details side-by-side.
            </p>
          </div>
          <PdfImportZone onDataExtracted={handleDataExtracted} />
        </div>

        {/* Cột phải: Form Card */}
        <div className="rounded-xl border border-border-default bg-white shadow-[var(--shadow-card)] p-6">
          <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5">
            {/* Row 1: Vendor Name + Invoice Number */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-vendorName" className={labelClass}>
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-vendorName"
                  type="text"
                  value={form.vendorName}
                  onChange={(e) => setField("vendorName", e.target.value)}
                  onBlur={() => handleBlur("vendorName")}
                  className={inputClass("vendorName")}
                />
                {touched.vendorName && errors.vendorName && (
                  <p className={errorClass}>{errors.vendorName}</p>
                )}
              </div>
              <div>
                <label htmlFor="edit-invoiceNumber" className={labelClass}>
                  Invoice Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-invoiceNumber"
                  type="text"
                  value={form.invoiceNumber}
                  onChange={(e) => setField("invoiceNumber", e.target.value)}
                  onBlur={() => handleBlur("invoiceNumber")}
                  className={inputClass("invoiceNumber")}
                />
                {touched.invoiceNumber && errors.invoiceNumber && (
                  <p className={errorClass}>{errors.invoiceNumber}</p>
                )}
              </div>
            </div>

            {/* Row 2: Invoice Date + Due Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-invoiceDate" className={labelClass}>
                  Invoice Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-invoiceDate"
                  type="date"
                  value={form.invoiceDate}
                  onChange={(e) => setField("invoiceDate", e.target.value)}
                  onBlur={() => handleBlur("invoiceDate")}
                  className={inputClass("invoiceDate")}
                />
                {touched.invoiceDate && errors.invoiceDate && (
                  <p className={errorClass}>{errors.invoiceDate}</p>
                )}
              </div>
              <div>
                <label htmlFor="edit-dueDate" className={labelClass}>
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-dueDate"
                  type="date"
                  value={form.dueDate}
                  min={form.invoiceDate}
                  onChange={(e) => setField("dueDate", e.target.value)}
                  onBlur={() => handleBlur("dueDate")}
                  className={inputClass("dueDate")}
                />
                {touched.dueDate && errors.dueDate && (
                  <p className={errorClass}>{errors.dueDate}</p>
                )}
              </div>
            </div>

            {/* Row 3: Amount + Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-amount" className={labelClass}>
                  Amount (USD) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                    $
                  </span>
                  <input
                    id="edit-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setField("amount", e.target.value)}
                    onBlur={() => handleBlur("amount")}
                    className={cn(inputClass("amount"), "pl-7")}
                  />
                </div>
                {touched.amount && errors.amount && (
                  <p className={errorClass}>{errors.amount}</p>
                )}
              </div>
              <div>
                <label htmlFor="edit-status" className={labelClass}>
                  Status
                </label>
                <select
                  id="edit-status"
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                  className={cn(inputClass("status"), "cursor-pointer")}
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            {/* Row 4: Description */}
            <div>
              <label htmlFor="edit-description" className={labelClass}>
                Description{" "}
                <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <textarea
                id="edit-description"
                rows={3}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                className={cn(
                  "w-full rounded-lg border border-border-default px-3 py-2 text-sm text-text-primary bg-white",
                  "placeholder:text-text-muted outline-none resize-none transition-colors duration-150",
                  "focus:border-bill-green focus:ring-2 focus:ring-bill-green/20 hover:border-gray-300"
                )}
              />
            </div>

            <div className="border-t border-border-light" />

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/payables")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}
