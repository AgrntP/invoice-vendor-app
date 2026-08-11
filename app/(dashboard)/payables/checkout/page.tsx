"use client";

import { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import {
  ArrowLeft,
  FileText,
  Building2,
  QrCode,
  CheckCircle2,
  Loader2,
  ShoppingCart,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

/* ── Types ──────────────────────────────────────────────────── */
interface InvoiceRow {
  id: string;
  file_name: string;
  invoice_number?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  total?: number | null;
  status: string;
}

interface VendorRow {
  id: string;
  name: string;
  bank_name?: string | null;
  account_number?: string | null;
  account_holder?: string | null;
}

/* ── QR Card ────────────────────────────────────────────────── */
function QRCard({
  vendor,
  total,
}: {
  vendor: VendorRow | null;
  total: number;
}) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const hasPaymentInfo = !!(vendor?.bank_name || vendor?.account_number);

  const generateQR = useCallback(async () => {
    if (!vendor) return;
    const payload = [
      "PAYMENT",
      `VENDOR:${vendor.name}`,
      `BANK:${vendor.bank_name || "N/A"}`,
      `ACCOUNT:${vendor.account_number || "N/A"}`,
      `AMOUNT:${total.toFixed(2)}`,
      `TS:${Date.now()}`,
    ].join("|");
    try {
      const url = await QRCode.toDataURL(payload, {
        width: 220,
        margin: 2,
        color: { dark: "#111827", light: "#FFFFFF" },
        errorCorrectionLevel: "H",
      });
      setQrDataUrl(url);
    } catch (e) {
      console.error(e);
    }
  }, [vendor, total]);

  useEffect(() => {
    generateQR();
  }, [generateQR]);

  return (
    <div className="rounded-xl border border-border-default bg-white shadow-[var(--shadow-card)] p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <QrCode className="w-4 h-4 text-bill-green" />
          Payment QR
        </h2>
        {hasPaymentInfo && (
          <span className="text-[11px] text-bill-green bg-bill-green-light px-2 py-0.5 rounded-full font-medium border border-bill-green/20">
            Ready to scan
          </span>
        )}
      </div>

      {/* QR image */}
      <div className="flex flex-col items-center gap-4">
        <div className={`relative p-3 bg-white rounded-2xl border-2 ${hasPaymentInfo ? "border-bill-green-light" : "border-gray-100"}`}>
          {/* Corner decorators */}
          {["top-1.5 left-1.5 border-t-2 border-l-2 rounded-tl-md",
            "top-1.5 right-1.5 border-t-2 border-r-2 rounded-tr-md",
            "bottom-1.5 left-1.5 border-b-2 border-l-2 rounded-bl-md",
            "bottom-1.5 right-1.5 border-b-2 border-r-2 rounded-br-md",
          ].map((cls) => (
            <div key={cls} className={`absolute h-5 w-5 border-bill-green ${cls}`} />
          ))}

          {qrDataUrl ? (
            <div className={!hasPaymentInfo ? "opacity-30 blur-[2px]" : ""}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="Payment QR"
                className="block rounded-xl"
                style={{ width: 200, height: 200 }}
              />
            </div>
          ) : (
            <div
              className="flex items-center justify-center rounded-xl bg-gray-50"
              style={{ width: 200, height: 200 }}
            >
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          )}
        </div>


        {/* Vendor info summary */}
        {vendor && (
          <div className="w-full text-center space-y-0.5">
            <p className="text-sm font-bold text-text-primary">{vendor.name}</p>
            {vendor.bank_name && (
              <p className="text-xs text-text-secondary">
                {vendor.bank_name}
                {vendor.account_number && ` · ${vendor.account_number}`}
              </p>
            )}
            <p className="text-sm font-bold text-bill-green mt-1">
              {formatCurrency(total)}
            </p>
          </div>
        )}
      </div>

      {hasPaymentInfo && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
          <div className="w-1.5 h-1.5 rounded-full bg-bill-green animate-pulse" />
          Scan with banking app to pay
        </div>
      )}
    </div>
  );
}

/* ── Main Content ───────────────────────────────────────────── */
function VendorCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const idsParam = searchParams.get("ids") ?? "";
  const vendorId = searchParams.get("vendorId") ?? "";

  const selectedIds = useMemo(
    () => (idsParam ? idsParam.split(",").filter(Boolean) : []),
    [idsParam]
  );

  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [vendor, setVendor] = useState<VendorRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      // Load vendor
      if (vendorId) {
        const { data } = await supabase
          .from("vendors")
          .select("id, name, bank_name, account_number, account_holder")
          .eq("id", vendorId)
          .single();
        if (data) setVendor(data);
      }
      // Load invoices
      if (selectedIds.length > 0) {
        const { data } = await supabase
          .from("invoices")
          .select("id, file_name, invoice_number, invoice_date, due_date, total, status")
          .in("id", selectedIds);
        if (data) setInvoices(data);
      }
      setLoading(false);
    }
    load();
  }, [idsParam, vendorId]); // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = useMemo(
    () => invoices.reduce((s, inv) => s + (inv.total || 0), 0),
    [invoices]
  );

  const handleConfirmPayment = async () => {
    if (invoices.length === 0) return;
    // Mark all selected invoices as paid
    await supabase
      .from("invoices")
      .update({ status: "paid" })
      .in("id", selectedIds);
    setIsSuccess(true);
    setTimeout(() => router.push(`/vendors/${vendorId}`), 1800);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-text-muted">
        <Loader2 className="w-5 h-5 animate-spin text-bill-green" />
        <span className="text-sm">Loading checkout...</span>
      </div>
    );
  }

  /* ── Empty ── */
  if (!loading && invoices.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4 animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
          <ShoppingCart className="w-7 h-7 text-gray-400" />
        </div>
        <h2 className="text-base font-semibold text-text-primary">No Invoices Found</h2>
        <p className="text-sm text-text-secondary">
          The selected invoice IDs could not be found. Please go back and try again.
        </p>
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 bg-bill-green text-white rounded-xl text-sm font-semibold hover:bg-bill-green-dark transition cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  /* ── Success ── */
  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-bill-green flex items-center justify-center mx-auto shadow-lg animate-bounce">
          <CheckCircle2 className="w-9 h-9 text-white" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Payment Confirmed!</h2>
        <p className="text-sm text-text-secondary">
          {invoices.length} invoice(s) marked as paid.{" "}
          <span className="font-bold text-bill-green">{formatCurrency(subtotal)}</span>
        </p>
        <p className="text-xs text-text-muted">Redirecting back...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">

      {/* Breadcrumb + Title */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Payment Checkout
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Review {invoices.length} invoice(s) and confirm payment
          {vendor ? ` to ${vendor.name}` : ""}.
        </p>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT: Invoice Summary ─ 7 cols */}
        <div className="lg:col-span-7 space-y-4">
          {/* Vendor header */}
          {vendor && (
            <div className="flex items-center gap-3 bg-white rounded-xl border border-border-default p-4 shadow-[var(--shadow-card)]">
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Paying to</p>
                <p className="text-base font-bold text-text-primary">{vendor.name}</p>
              </div>
            </div>
          )}

          {/* Invoice list card */}
          <div className="rounded-xl border border-border-default bg-white shadow-[var(--shadow-card)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border-light bg-gray-50/80 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Invoice Summary
                <span className="text-xs text-text-muted font-normal">
                  ({invoices.length})
                </span>
              </h2>
            </div>

            <div className="divide-y divide-border-light">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-1.5 bg-indigo-50 rounded-lg shrink-0 mt-0.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {inv.file_name}
                      </p>
                      <p className="text-xs text-text-muted font-mono mt-0.5">
                        {inv.invoice_number ? `#${inv.invoice_number}` : "No invoice no."}
                        {inv.due_date ? ` · Due ${inv.due_date}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right ml-4">
                    <p className="text-sm font-bold text-text-primary">
                      {formatCurrency(inv.total || 0)}
                    </p>
                    <span className="inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals footer */}
            <div className="px-5 py-4 bg-gray-50/80 border-t border-border-default space-y-2">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Subtotal ({invoices.length} invoice{invoices.length !== 1 ? "s" : ""})</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-baseline border-t border-border-light pt-2">
                <span className="font-bold text-text-primary">Total Payment</span>
                <span className="font-bold text-bill-green text-xl">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Confirm button */}
          <button
            id="confirm-payment-btn"
            onClick={handleConfirmPayment}
            className="w-full h-12 rounded-xl bg-bill-green text-white font-bold text-base hover:bg-bill-green-dark transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            Confirm &amp; Pay {formatCurrency(subtotal)}
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-text-muted">
            <svg className="w-3.5 h-3.5 text-bill-green" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            256-Bit SSL Encrypted &amp; Secure Payment
          </div>

        </div>

        {/* RIGHT: QR Card ─ 5 cols */}
        <div className="lg:col-span-5 lg:sticky lg:top-20">
          <QRCard vendor={vendor} total={subtotal} />
        </div>
      </div>
    </div>
  );
}

export default function VendorCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-sm text-text-muted gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading checkout...
        </div>
      }
    >
      <VendorCheckoutContent />
    </Suspense>
  );
}
