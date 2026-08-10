"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";

/**
 * Dữ liệu AI trích xuất từ PDF
 */
export interface ExtractedInvoiceData {
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  description: string;
}

interface PdfImportZoneProps {
  onDataExtracted: (data: ExtractedInvoiceData) => void;
}

/**
 * PdfImportZone - Khu vực drag & drop PDF / Ảnh + AI extraction
 */
export function PdfImportZone({ onDataExtracted }: PdfImportZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "extracting" | "done" | "error">("idle");
  const [extracted, setExtracted] = useState<ExtractedInvoiceData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format currency cho preview
  const formatAmount = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  // Xử lý file được chọn
  const handleFile = useCallback((f: File) => {
    const isPdf = f.type === "application/pdf" || f.name.endsWith(".pdf");
    const isTxt = f.type === "text/plain" || f.name.endsWith(".txt");
    const isImage = f.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(f.name);

    if (!isPdf && !isTxt && !isImage) {
      setErrorMessage("File không hỗ trợ. Chỉ chấp nhận các file ảnh (PNG, JPG, JPEG, WEBP, GIF), PDF hoặc TXT.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMessage("File quá lớn. Tối đa 10 MB.");
      return;
    }
    setFile(f);

    if (isImage) {
      const url = URL.createObjectURL(f);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }

    setStatus("idle");
    setExtracted(null);
    setErrorMessage("");
  }, []);

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  // File input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  // Gọi AI API
  const handleExtract = async () => {
    if (!file) return;

    setStatus("extracting");
    setErrorMessage("");

    try {
      let mimeType = file.type;
      if (!mimeType) {
        if (file.name.endsWith(".pdf")) mimeType = "application/pdf";
        else if (file.name.endsWith(".txt")) mimeType = "text/plain";
        else if (/\.(png|jpe?g|webp|gif)$/i.test(file.name)) mimeType = "image/png";
        else mimeType = "application/pdf";
      }

      // Đọc file thành dataURL và raw base64
      const { base64 } = await new Promise<{ base64: string; dataUrl: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve({
            dataUrl: result,
            base64: result.includes(",") ? result.split(",")[1] : btoa(result),
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Gọi server API
      const response = await fetch("/api/parse-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64: base64, mimeType }),
      });

      const json = await response.json();

      if (!response.ok || json.error) {
        setErrorMessage(json.error || "Không thể đọc file này.");
        setStatus("error");
        return;
      }

      setExtracted(json.data);
      setStatus("done");
      // Tự động cập nhật ngay lập tức sang form bên cạnh
      onDataExtracted(json.data);
    } catch {
      setErrorMessage("Lỗi kết nối. Vui lòng thử lại.");
      setStatus("error");
    }
  };

  const handleApply = () => {
    if (extracted) onDataExtracted(extracted);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFilePreviewUrl(null);
    setStatus("idle");
    setExtracted(null);
    setErrorMessage("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!file) {
            inputRef.current?.click();
          }
        }}
        className={[
          "relative rounded-xl border-2 border-dashed transition-all duration-150",
          isDragging
            ? "border-bill-green bg-bill-green-light scale-[1.01]"
            : file
              ? "border-border-default bg-gray-50/50 cursor-default"
              : "border-border-default bg-white hover:border-bill-green hover:bg-bill-green-50 cursor-pointer",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.png,.jpg,.jpeg,.webp,.gif,application/pdf,text/plain,image/*"
          className="hidden"
          onChange={handleInputChange}
        />

        <div className="px-8 py-8 pointer-events-none">
          {!file ? (
            /* Empty state */
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Drag & drop an invoice file here
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  or click to browse · Supported files: PNG, JPG, JPEG, WEBP, GIF, PDF, TXT · max 10 MB
                </p>
              </div>
            </div>
          ) : (
            /* File selected state */
            <div className="flex items-center justify-between gap-4 pointer-events-auto">
              {/* File info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
                  <p className="text-xs text-text-muted">{formatSize(file.size)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="text-xs text-text-muted hover:text-red-500 transition-colors px-2 py-1 rounded"
                >
                  Remove
                </button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExtract();
                  }}
                  disabled={status === "extracting"}
                  size="sm"
                  className="min-w-[130px]"
                >
                  {status === "extracting" ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Extracting...
                    </span>
                  ) : (
                    "Extract with AI"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      {/* AI Suggestions card */}
      {status === "done" && extracted && (
        <div className="rounded-xl border border-bill-green/30 bg-bill-green-light px-5 py-4 animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-bill-green">
                AI Suggestions
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {extracted.vendorName && (
                  <span className="text-sm text-text-primary">
                    <span className="text-text-muted">Vendor:</span> {extracted.vendorName}
                  </span>
                )}
                {extracted.invoiceNumber && (
                  <span className="text-sm text-text-primary">
                    <span className="text-text-muted">No:</span> {extracted.invoiceNumber}
                  </span>
                )}
                {extracted.amount > 0 && (
                  <span className="text-sm text-text-primary">
                    <span className="text-text-muted">Amount:</span> {formatAmount(extracted.amount)}
                  </span>
                )}
                {extracted.invoiceDate && (
                  <span className="text-sm text-text-primary">
                    <span className="text-text-muted">Date:</span> {extracted.invoiceDate}
                  </span>
                )}
                {extracted.dueDate && (
                  <span className="text-sm text-text-primary">
                    <span className="text-text-muted">Due:</span> {extracted.dueDate}
                  </span>
                )}
              </div>
              {extracted.description && (
                <p className="text-xs text-text-muted truncate max-w-md">
                  {extracted.description}
                </p>
              )}
            </div>
            <Button size="sm" onClick={handleApply} className="shrink-0">
              Apply to form
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
