"use client";

import { useState } from "react";
import { PdfImportZone, type ExtractedInvoiceData } from "@/components/create-invoice/pdf-import-zone";
import { InvoiceForm } from "@/components/create-invoice/invoice-form";

/**
 * Trang tạo invoice mới: /payables/new
 *
 * Layout Side-by-Side (2 cột song song trên Desktop):
 * - Cột trái: Import file (PDF/Ảnh/TXT) + Xem trước tài liệu + Nút AI Trích xuất
 * - Cột phải: Form nhập liệu Invoice (Vendor, Invoice #, Date, Amount...)
 *
 * Khi trích xuất AI → Form ở cột bên phải tự động điền ngay lập tức.
 */
export default function NewInvoicePage() {
  // Data từ AI extraction → truyền xuống form ở cột bên phải để pre-fill
  const [prefillData, setPrefillData] = useState<ExtractedInvoiceData | null>(null);

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      {/* BREADCRUMB + TITLE */}
      <div>
        <div className="flex items-center gap-1.5 text-sm text-text-muted mb-1">
          <span>Payables</span>
          <span>/</span>
          <span className="text-text-primary font-medium">New Invoice</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Create Invoice
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Import a file to extract data automatically side-by-side, or fill in the details manually.
        </p>
      </div>

      {/* 2-COLUMN SIDE-BY-SIDE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* CỘT TRÁI: IMPORT & DOCUMENT PREVIEW */}
        <div className="rounded-xl border border-border-default bg-white shadow-[var(--shadow-card)] p-6 space-y-4 lg:sticky lg:top-20">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              Import Document
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Supported files: PNG, JPG, JPEG, WEBP, GIF, PDF, TXT (max 10 MB).
            </p>
          </div>
          <PdfImportZone onDataExtracted={(data) => setPrefillData(data)} />
        </div>

        {/* CỘT PHẢI: FORM DETAILS */}
        <div className="rounded-xl border border-border-default bg-white shadow-[var(--shadow-card)] p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              Invoice Details
            </h2>
            {prefillData ? (
              <p className="text-xs text-bill-green font-medium mt-0.5 flex items-center gap-1">
                <span>✓</span> Data extracted with AI and updated in form
              </p>
            ) : (
              <p className="text-xs text-text-secondary mt-0.5">
                Fill in the invoice information below.
              </p>
            )}
          </div>
          <InvoiceForm prefillData={prefillData} />
        </div>
      </div>
    </div>
  );
}

