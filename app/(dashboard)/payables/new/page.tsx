"use client";

import { useState } from "react";
import { PdfImportZone, type ExtractedInvoiceData } from "@/components/create-invoice/pdf-import-zone";
import { InvoiceForm } from "@/components/create-invoice/invoice-form";

/**
 * Trang tạo invoice mới: /payables/new
 *
 * Layout (từ trên xuống):
 * 1. Breadcrumb + Title
 * 2. Card: PDF Import (optional) — drag & drop + AI extraction
 * 3. Card: Invoice Details Form — luôn hiển thị, nhận data từ AI nếu có
 */
export default function NewInvoicePage() {
  // Data từ AI extraction → truyền xuống form để pre-fill
  const [prefillData, setPrefillData] = useState<ExtractedInvoiceData | null>(null);

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      {/* ======================== */}
      {/* BREADCRUMB + TITLE       */}
      {/* ======================== */}
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
          Upload an invoice file to extract data automatically, or fill in the details manually.
        </p>
      </div>

      {/* ======================== */}
      {/* IMPORT (optional)        */}
      {/* ======================== */}
      <div className="rounded-xl border border-border-default bg-white shadow-[var(--shadow-card)] p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-text-primary">
            Import
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">
            Supported files: PNG, JPG, JPEG, WEBP, GIF, PDF, TXT (max 10 MB). AI will extract invoice data and attach your file/image.
          </p>
        </div>
        <PdfImportZone onDataExtracted={(data) => setPrefillData(data)} />
      </div>

      {/* ======================== */}
      {/* INVOICE FORM             */}
      {/* ======================== */}
      <div className="rounded-xl border border-border-default bg-white shadow-[var(--shadow-card)] p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-text-primary">
            Invoice Details
          </h2>
          {prefillData ? (
            <p className="text-sm text-bill-green mt-0.5">
              Fields pre-filled from AI — review and adjust before submitting.
            </p>
          ) : (
            <p className="text-sm text-text-secondary mt-0.5">
              Fill in the invoice information below.
            </p>
          )}
        </div>
        <InvoiceForm prefillData={prefillData} />
      </div>
    </div>
  );
}
