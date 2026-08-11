"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InvoiceStatus } from "@/types/invoice";
import { useInvoices } from "@/lib/invoice-store";
import type { ExtractedInvoiceData } from "./pdf-import-zone";

/**
 * Dữ liệu form
 */
interface FormData {
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: string;  // string để input số dễ xử lý
  status: InvoiceStatus;
  description: string;
}

/**
 * Lỗi validation cho từng field
 */
type FormErrors = Partial<Record<keyof FormData, string>>;

interface InvoiceFormProps {
  /** Dữ liệu pre-fill từ AI (khi user nhấn Apply to form) */
  prefillData?: ExtractedInvoiceData | null;
}

/**
 * Auto-generate invoice number dạng INV-YYYY-NNN
 */
function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 900) + 100; // 100–999
  return `INV-${year}-${num}`;
}

/**
 * InvoiceForm — Form tạo invoice thủ công
 *
 * - Nhận prefillData từ AI extraction (optional)
 * - Validation real-time khi blur
 * - Submit → thêm vào list + redirect về /payables
 */
export function InvoiceForm({ prefillData }: InvoiceFormProps) {
  const router = useRouter();
  const { addInvoice } = useInvoices();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});

  const [form, setForm] = useState<FormData>({
    vendorName: "",
    invoiceNumber: generateInvoiceNumber(),
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    amount: "",
    status: "draft",
    description: "",
  });

  // Khi AI trả về data → fill vào form
  useEffect(() => {
    if (!prefillData) return;
    setForm((prev) => ({
      ...prev,
      vendorName: prefillData.vendorName || prev.vendorName,
      invoiceNumber: prefillData.invoiceNumber || prev.invoiceNumber,
      invoiceDate: prefillData.invoiceDate || prev.invoiceDate,
      dueDate: prefillData.dueDate || prev.dueDate,
      amount: prefillData.amount > 0 ? String(prefillData.amount) : prev.amount,
      description: prefillData.description || prev.description,
    }));
    // Reset errors khi fill mới
    setErrors({});
  }, [prefillData]);

  // Update field
  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error khi user đang gõ
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  // Validate một field
  const validateField = (key: keyof FormData, value: string): string => {
    switch (key) {
      case "vendorName":
        if (!value.trim()) return "Vendor name is required";
        if (value.trim().length < 2) return "At least 2 characters";
        break;
      case "invoiceNumber":
        if (!value.trim()) return "Invoice number is required";
        break;
      case "invoiceDate":
        if (!value) return "Invoice date is required";
        break;
      case "dueDate":
        if (!value) return "Due date is required";
        if (form.invoiceDate && value < form.invoiceDate)
          return "Due date must be after invoice date";
        break;
      case "amount":
        if (!value) return "Amount is required";
        if (isNaN(Number(value)) || Number(value) <= 0)
          return "Amount must be a positive number";
        break;
    }
    return "";
  };

  // Validate tất cả fields
  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};
    const requiredFields: (keyof FormData)[] = [
      "vendorName", "invoiceNumber", "invoiceDate", "dueDate", "amount"
    ];
    for (const key of requiredFields) {
      const err = validateField(key, form[key] as string);
      if (err) newErrors[key] = err;
    }
    setErrors(newErrors);
    // Mark all as touched
    setTouched(Object.fromEntries(requiredFields.map((k) => [k, true])));
    return Object.keys(newErrors).length === 0;
  };

  // Blur handler
  const handleBlur = (key: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const err = validateField(key, form[key] as string);
    setErrors((prev) => ({ ...prev, [key]: err || undefined }));
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));

    // Thêm vào shared InvoiceContext
    addInvoice({
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

  // Helper: class cho input
  const inputClass = (key: keyof FormData) =>
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

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">
        {/* Row 1: Vendor Name + Invoice Number */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Vendor Name */}
          <div>
            <label htmlFor="vendorName" className={labelClass}>
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <input
              id="vendorName"
              type="text"
              placeholder="e.g. Acme Corporation"
              value={form.vendorName}
              onChange={(e) => setField("vendorName", e.target.value)}
              onBlur={() => handleBlur("vendorName")}
              className={inputClass("vendorName")}
            />
            {touched.vendorName && errors.vendorName && (
              <p className={errorClass}>{errors.vendorName}</p>
            )}
          </div>

          {/* Invoice Number */}
          <div>
            <label htmlFor="invoiceNumber" className={labelClass}>
              Invoice Number <span className="text-red-500">*</span>
            </label>
            <input
              id="invoiceNumber"
              type="text"
              placeholder="INV-2024-001"
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
          {/* Invoice Date */}
          <div>
            <label htmlFor="invoiceDate" className={labelClass}>
              Invoice Date <span className="text-red-500">*</span>
            </label>
            <input
              id="invoiceDate"
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

          {/* Due Date */}
          <div>
            <label htmlFor="dueDate" className={labelClass}>
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              id="dueDate"
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
          {/* Amount */}
          <div>
            <label htmlFor="amount" className={labelClass}>
              Amount (USD) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                $
              </span>
              <input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
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

          {/* Status */}
          <div>
            <label htmlFor="status" className={labelClass}>
              Status
            </label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => setField("status", e.target.value as InvoiceStatus)}
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
          <label htmlFor="description" className={labelClass}>
            Description{" "}
            <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            rows={3}
            placeholder="Brief description of goods or services..."
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            className={cn(
              "w-full rounded-lg border border-border-default px-3 py-2 text-sm text-text-primary bg-white",
              "placeholder:text-text-muted outline-none resize-none transition-colors duration-150",
              "focus:border-bill-green focus:ring-2 focus:ring-bill-green/20 hover:border-gray-300"
            )}
          />
        </div>

        {/* Divider */}
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
                Creating...
              </span>
            ) : (
              "Create Invoice"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}


// // Inside your Invoice Coding Drawer / Review Form Component
// export function InvoiceCodingForm({ invoice, vendors }: { invoice: Invoice, vendors: Vendor[] }) {
//   // 1. Try to exact match raw_vendor_name to an existing vendor name
//   const autoMatchedVendor = vendors.find(
//     (v) => v.name.toLowerCase() === invoice.raw_vendor_name?.toLowerCase()
//   );

//   // 2. Default state: Use existing vendor_id OR auto-matched ID OR empty string
//   const [selectedVendorId, setSelectedVendorId] = useState<string>(
//     invoice.vendor_id || autoMatchedVendor?.id || ""
//   );

//   return (
//     <div className="space-y-4">
//       {/* OCR Detected Text Badge */}
//       {invoice.raw_vendor_name && (
//         <div className="text-xs text-gray-500">
//           OCR Detected Vendor: <span className="font-semibold">{invoice.raw_vendor_name}</span>
//         </div>
//       )}

//       {/* Vendor Selector */}
//       <label className="block text-sm font-medium">Assign Master Vendor</label>
//       <select 
//         value={selectedVendorId} 
//         onChange={(e) => setSelectedVendorId(e.target.value)}
//         className="w-full border rounded-lg p-2 text-sm"
//       >
//         <option value="">-- Select Vendor --</option>
//         {vendors.map((vendor) => (
//           <option key={vendor.id} value={vendor.id}>
//             {vendor.name}
//           </option>
//         ))}
//       </select>

//       {/* Create Vendor Option */}
//       {!selectedVendorId && (
//         <button 
//           type="button" 
//           onClick={() => handleCreateVendor(invoice.raw_vendor_name)}
//           className="text-xs text-blue-600 hover:underline"
//         >
//           + Add "{invoice.raw_vendor_name}" as a new vendor
//         </button>
//       )}
//     </div>
//   );
// }