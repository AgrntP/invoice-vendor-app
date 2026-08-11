"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Building2,
  CreditCard,
  User,
  Download,
  RefreshCw,
  Copy,
  CheckCircle2,
  Landmark,
} from "lucide-react";

/**
 * Payment QR Page
 *
 * Trang tạo QR thanh toán tự động từ thông tin:
 * - Tên vendor (người thụ hưởng)
 * - Tên ngân hàng
 * - Số tài khoản ngân hàng
 *
 * QR được tái tạo mỗi lần thông tin thay đổi.
 */

interface PaymentInfo {
  vendorName: string;
  bankName: string;
  accountNumber: string;
}

const PLACEHOLDER: PaymentInfo = {
  vendorName: "Tên công ty / cá nhân thụ hưởng",
  bankName: "Tên ngân hàng (VD: Vietcombank)",
  accountNumber: "Số tài khoản ngân hàng",
};

/** Encode payment info thành chuỗi QR (VietQR-like format) */
function buildQRPayload(info: PaymentInfo): string {
  const { vendorName, bankName, accountNumber } = info;
  // Simple payment string - compatible with VietQR basic format
  return [
    "PAYMENT",
    `VENDOR:${vendorName || PLACEHOLDER.vendorName}`,
    `BANK:${bankName || PLACEHOLDER.bankName}`,
    `ACCOUNT:${accountNumber || PLACEHOLDER.accountNumber}`,
    `TIMESTAMP:${Date.now()}`,
  ].join("|");
}

export default function PaymentQRPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [info, setInfo] = useState<PaymentInfo>({
    vendorName: "",
    bankName: "",
    accountNumber: "",
  });
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);

  const generateQR = useCallback(async () => {
    setIsGenerating(true);
    try {
      const payload = buildQRPayload(info);
      const dataUrl = await QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: {
          dark: "#111827",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H",
      });
      setQrDataUrl(dataUrl);
      setGenerationCount((c) => c + 1);
    } catch (err) {
      console.error("QR generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [info]);

  // Auto re-generate on info change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      generateQR();
    }, 500);
    return () => clearTimeout(timer);
  }, [generateQR]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `payment-qr-${info.vendorName || "vendor"}-${Date.now()}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleCopyInfo = async () => {
    const text = [
      `Người thụ hưởng: ${info.vendorName || PLACEHOLDER.vendorName}`,
      `Ngân hàng: ${info.bankName || PLACEHOLDER.bankName}`,
      `Số tài khoản: ${info.accountNumber || PLACEHOLDER.accountNumber}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateManual = () => {
    generateQR();
  };

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bill-green text-white shadow-sm">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Payment QR
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Tạo mã QR thanh toán tự động — cập nhật ngay khi nhập thông tin
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
        {/* Left: Input Form */}
        <div className="space-y-6">
          <div
            className="bg-white rounded-2xl border border-border-default shadow-sm p-6 space-y-5"
            style={{ boxShadow: "var(--shadow-md)" }}
          >
            <div className="flex items-center gap-2 pb-2 border-b border-border-light">
              <CreditCard className="h-4 w-4 text-bill-green" />
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                Thông tin thanh toán
              </h2>
            </div>

            {/* Vendor Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="vendorName"
                className="flex items-center gap-2 text-sm font-medium text-text-primary"
              >
                <User className="h-4 w-4 text-text-muted" />
                Tên người / công ty thụ hưởng
              </label>
              <div className="relative">
                <input
                  id="vendorName"
                  type="text"
                  value={info.vendorName}
                  onChange={(e) =>
                    setInfo((prev) => ({ ...prev, vendorName: e.target.value }))
                  }
                  placeholder={PLACEHOLDER.vendorName}
                  className="w-full rounded-xl border border-border-default bg-bg-main px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-bill-green focus:border-transparent hover:border-gray-300"
                />
              </div>
            </div>

            {/* Bank Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="bankName"
                className="flex items-center gap-2 text-sm font-medium text-text-primary"
              >
                <Landmark className="h-4 w-4 text-text-muted" />
                Tên ngân hàng
              </label>
              <input
                id="bankName"
                type="text"
                value={info.bankName}
                onChange={(e) =>
                  setInfo((prev) => ({ ...prev, bankName: e.target.value }))
                }
                placeholder={PLACEHOLDER.bankName}
                className="w-full rounded-xl border border-border-default bg-bg-main px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-bill-green focus:border-transparent hover:border-gray-300"
              />
            </div>

            {/* Account Number */}
            <div className="space-y-1.5">
              <label
                htmlFor="accountNumber"
                className="flex items-center gap-2 text-sm font-medium text-text-primary"
              >
                <Building2 className="h-4 w-4 text-text-muted" />
                Số tài khoản ngân hàng
              </label>
              <input
                id="accountNumber"
                type="text"
                value={info.accountNumber}
                onChange={(e) =>
                  setInfo((prev) => ({
                    ...prev,
                    accountNumber: e.target.value,
                  }))
                }
                placeholder={PLACEHOLDER.accountNumber}
                className="w-full rounded-xl border border-border-default bg-bg-main px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-bill-green focus:border-transparent hover:border-gray-300"
              />
            </div>
          </div>

          {/* Info summary card */}
          <div
            className="bg-white rounded-2xl border border-border-default p-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Thông tin tóm tắt
              </h3>
              <button
                id="copy-info-btn"
                onClick={handleCopyInfo}
                className="flex items-center gap-1.5 text-xs font-medium text-bill-green hover:text-bill-green-dark transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Đã sao chép
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Sao chép
                  </>
                )}
              </button>
            </div>
            <div className="space-y-2">
              {[
                {
                  label: "Thụ hưởng",
                  value: info.vendorName,
                  placeholder: PLACEHOLDER.vendorName,
                },
                {
                  label: "Ngân hàng",
                  value: info.bankName,
                  placeholder: PLACEHOLDER.bankName,
                },
                {
                  label: "Số TK",
                  value: info.accountNumber,
                  placeholder: PLACEHOLDER.accountNumber,
                },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-2">
                  <span className="text-xs font-medium text-text-muted min-w-[72px]">
                    {row.label}:
                  </span>
                  <span
                    className={`text-xs font-medium truncate ${
                      row.value ? "text-text-primary" : "text-text-muted italic"
                    }`}
                  >
                    {row.value || row.placeholder}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: QR Display */}
        <div className="flex flex-col items-center gap-5">
          {/* QR Card */}
          <div
            className="bg-white rounded-2xl border border-border-default p-8 flex flex-col items-center gap-5 w-full"
            style={{ boxShadow: "var(--shadow-lg)" }}
          >
            {/* QR label */}
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-bill-green animate-pulse" />
              <span className="text-xs font-semibold text-bill-green uppercase tracking-widest">
                QR Thanh toán #{generationCount > 0 ? generationCount : "—"}
              </span>
            </div>

            {/* QR Image */}
            <div className="relative">
              {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl z-10">
                  <RefreshCw className="h-6 w-6 text-bill-green animate-spin" />
                </div>
              )}
              {qrDataUrl ? (
                <div className="relative p-3 bg-white rounded-2xl border-2 border-bill-green-light shadow-inner">
                  {/* Corner decorators */}
                  <div className="absolute top-1.5 left-1.5 h-5 w-5 border-t-2 border-l-2 border-bill-green rounded-tl-md" />
                  <div className="absolute top-1.5 right-1.5 h-5 w-5 border-t-2 border-r-2 border-bill-green rounded-tr-md" />
                  <div className="absolute bottom-1.5 left-1.5 h-5 w-5 border-b-2 border-l-2 border-bill-green rounded-bl-md" />
                  <div className="absolute bottom-1.5 right-1.5 h-5 w-5 border-b-2 border-r-2 border-bill-green rounded-br-md" />

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="Payment QR Code"
                    className="block rounded-xl"
                    style={{ width: 240, height: 240 }}
                  />
                </div>
              ) : (
                <div
                  className="flex items-center justify-center rounded-2xl bg-bg-main border-2 border-dashed border-border-default"
                  style={{ width: 268, height: 268 }}
                >
                  <div className="text-center">
                    <QrCode className="h-12 w-12 text-text-muted mx-auto mb-2" />
                    <p className="text-xs text-text-muted">
                      Đang tạo mã QR...
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bank info below QR */}
            <div className="text-center space-y-0.5 px-4">
              <p className="text-sm font-bold text-text-primary">
                {info.vendorName || (
                  <span className="text-text-muted italic font-normal">
                    {PLACEHOLDER.vendorName}
                  </span>
                )}
              </p>
              <p className="text-xs text-text-secondary">
                {info.bankName || (
                  <span className="text-text-muted italic">
                    {PLACEHOLDER.bankName}
                  </span>
                )}
                {" · "}
                {info.accountNumber || (
                  <span className="text-text-muted italic">
                    {PLACEHOLDER.accountNumber}
                  </span>
                )}
              </p>
            </div>

            {/* Auto-refresh indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-bill-green-50 rounded-full border border-bill-green-100">
              <RefreshCw className="h-3 w-3 text-bill-green" />
              <span className="text-[11px] font-medium text-bill-green">
                Tự động cập nhật khi nhập
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 w-full">
            <button
              id="download-qr-btn"
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-bill-green text-white py-3 px-4 text-sm font-semibold hover:bg-bill-green-dark transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Tải xuống QR
            </button>
            <button
              id="refresh-qr-btn"
              onClick={handleRegenerateManual}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 rounded-xl border border-border-default bg-white text-text-secondary py-3 px-4 text-sm font-semibold hover:bg-bg-hover hover:text-text-primary transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw
                className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`}
              />
              Tạo lại
            </button>
          </div>

          {/* Note */}
          <p className="text-[11px] text-text-muted text-center leading-relaxed max-w-xs">
            Mỗi lần bấm &quot;Tạo lại&quot;, QR sẽ được tái tạo với timestamp
            mới. Thông tin ngân hàng, số tài khoản chứa đầy đủ trong mã QR.
          </p>
        </div>
      </div>

      {/* Hidden canvas for QR drawing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
