"use client";

import { Suspense, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInvoices } from "@/lib/invoice-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STATUS_CONFIG } from "@/types/invoice";

type PaymentType = "ach" | "card" | "wire";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { invoices, payInvoices } = useInvoices();

  // Lấy danh sách ID từ URL query parameter (VD: ?ids=inv_1,inv_2)
  const idsParam = searchParams.get("ids") ?? "";
  const selectedIds = useMemo(
    () => (idsParam ? idsParam.split(",").filter(Boolean) : []),
    [idsParam]
  );

  // Filter các invoice được chọn
  const selectedInvoices = useMemo(
    () => invoices.filter((inv) => selectedIds.includes(inv.id)),
    [invoices, selectedIds]
  );

  // Tính tổng tiền
  const totalAmount = useMemo(
    () => selectedInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    [selectedInvoices]
  );

  // Payment Method States
  const [paymentMethod, setPaymentMethod] = useState<PaymentType>("ach");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ACH Details
  const [achDetails, setAchDetails] = useState({
    bankName: "JPMorgan Chase Bank",
    accountType: "checking",
    routingNumber: "122400724",
    accountNumber: "9876543210",
    accountHolder: "Acme Business LLC",
  });

  // Card Details
  const [cardDetails, setCardDetails] = useState({
    cardholderName: "John Doe",
    cardNumber: "4532 •••• •••• 8892",
    expiry: "12/28",
    cvv: "888",
  });

  // Wire/Check Details
  const [wireDetails, setWireDetails] = useState({
    referenceNumber: `REF-${Date.now().toString().slice(-6)}`,
    memo: "Payment for monthly vendor invoices",
  });

  // Validate form chi tiết phương thức thanh toán
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (paymentMethod === "ach") {
      if (!achDetails.bankName.trim()) errs.bankName = "Bank name is required";
      if (!achDetails.routingNumber.trim()) errs.routingNumber = "Routing number is required";
      if (!achDetails.accountNumber.trim()) errs.accountNumber = "Account number is required";
      if (!achDetails.accountHolder.trim()) errs.accountHolder = "Account holder is required";
    } else if (paymentMethod === "card") {
      if (!cardDetails.cardholderName.trim()) errs.cardholderName = "Cardholder name is required";
      if (!cardDetails.cardNumber.trim()) errs.cardNumber = "Card number is required";
      if (!cardDetails.expiry.trim()) errs.expiry = "Expiry is required";
      if (!cardDetails.cvv.trim()) errs.cvv = "CVV is required";
    } else if (paymentMethod === "wire") {
      if (!wireDetails.referenceNumber.trim()) errs.referenceNumber = "Reference number is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Confirm payment submit
  const handleConfirmPayment = async () => {
    if (selectedInvoices.length === 0) return;
    if (!validateForm()) return;

    setIsProcessing(true);
    // Giả lập thời gian xử lý giao dịch ngân hàng (1.2s)
    await new Promise((r) => setTimeout(r, 1200));

    setIsProcessing(false);
    setIsSuccess(true);

    // Cập nhật trạng thái paid trong context
    payInvoices(selectedIds);

    // Sau 1.5s redirect về trang /payables
    setTimeout(() => {
      router.push("/payables");
    }, 1500);
  };

  const inputClass = (key: string) =>
    `w-full h-9 rounded-lg border px-3 text-sm text-text-primary bg-white outline-none transition-colors ${
      errors[key]
        ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-border-default focus:border-bill-green focus:ring-2 focus:ring-bill-green/20"
    }`;

  const labelClass = "block text-xs font-semibold text-text-primary mb-1 uppercase tracking-wider";

  // State rỗng nếu không chọn invoice nào
  if (selectedInvoices.length === 0) {
    return (
      <div className="max-w-4xl space-y-6 animate-fade-in">
        <div>
          <div className="flex items-center gap-1.5 text-sm text-text-muted mb-1">
            <span>Payables</span>
            <span>/</span>
            <span className="text-text-primary font-medium">Checkout</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Payment Checkout
          </h1>
        </div>

        <div className="rounded-xl border border-border-default bg-white p-8 text-center shadow-[var(--shadow-card)] space-y-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-text-primary">No Invoices Selected</h2>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Please select at least one invoice from the Accounts Payable list to proceed with payment.
          </p>
          <Button onClick={() => router.push("/payables")}>
            Back to Payables List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* BREADCRUMB + TITLE */}
      <div>
        <div className="flex items-center gap-1.5 text-sm text-text-muted mb-1">
          <span>Payables</span>
          <span>/</span>
          <span className="text-text-primary font-medium">Payment Checkout</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Payment Confirmation
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Select payment method, enter details, and confirm payment for {selectedInvoices.length} invoice(s).
        </p>
      </div>

      {/* SUCCESS OVERLAY (khi thanh toán thành công) */}
      {isSuccess ? (
        <div className="rounded-xl border border-bill-green/30 bg-bill-green-light p-10 text-center animate-fade-in space-y-3">
          <div className="w-14 h-14 rounded-full bg-bill-green text-white flex items-center justify-center mx-auto shadow-lg animate-bounce">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-primary">Payment Confirmed!</h2>
          <p className="text-sm text-text-secondary">
            Payment of <span className="font-bold text-bill-green">{formatCurrency(totalAmount)}</span> has been processed successfully.
          </p>
          <p className="text-xs text-text-muted">Redirecting back to Accounts Payable list...</p>
        </div>
      ) : (
        /* 2-COLUMN GRID: PAYMENT METHOD (LEFT) & SUMMARY (RIGHT) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI: CHỌN PHƯƠNG THỨC THANH TOÁN & NHẬP CHI TIẾT (7 CỘT) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Select Payment Method */}
            <div className="rounded-xl border border-border-default bg-white shadow-[var(--shadow-card)] p-6 space-y-4">
              <h2 className="text-base font-semibold text-text-primary">
                1. Select Payment Method
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* ACH / Bank Transfer */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("ach")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === "ach"
                      ? "border-bill-green bg-bill-green-light ring-2 ring-bill-green/20"
                      : "border-border-default bg-white hover:border-bill-green hover:bg-gray-50"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-bill-green-50 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-bill-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-text-primary">ACH / Bank Transfer</span>
                  <span className="text-[10px] text-bill-green font-medium mt-0.5">$0.00 Fee</span>
                </button>

                {/* Credit Card */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === "card"
                      ? "border-bill-green bg-bill-green-light ring-2 ring-bill-green/20"
                      : "border-border-default bg-white hover:border-bill-green hover:bg-gray-50"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-text-primary">Credit / Debit Card</span>
                  <span className="text-[10px] text-text-muted mt-0.5">Instant Pay</span>
                </button>

                {/* Wire Transfer */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("wire")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === "wire"
                      ? "border-bill-green bg-bill-green-light ring-2 ring-bill-green/20"
                      : "border-border-default bg-white hover:border-bill-green hover:bg-gray-50"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-text-primary">Wire / Check</span>
                  <span className="text-[10px] text-text-muted mt-0.5">Reference Memo</span>
                </button>
              </div>
            </div>

            {/* 2. Payment Method Details Form */}
            <div className="rounded-xl border border-border-default bg-white shadow-[var(--shadow-card)] p-6 space-y-4">
              <h2 className="text-base font-semibold text-text-primary">
                2. Enter Payment Details
              </h2>

              {/* ACH FORM */}
              {paymentMethod === "ach" && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className={labelClass}>Bank Name</label>
                    <input
                      type="text"
                      value={achDetails.bankName}
                      onChange={(e) => setAchDetails({ ...achDetails, bankName: e.target.value })}
                      className={inputClass("bankName")}
                    />
                    {errors.bankName && <p className="text-xs text-red-500 mt-1">{errors.bankName}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Routing Number (9 Digits)</label>
                      <input
                        type="text"
                        value={achDetails.routingNumber}
                        onChange={(e) => setAchDetails({ ...achDetails, routingNumber: e.target.value })}
                        className={inputClass("routingNumber")}
                      />
                      {errors.routingNumber && <p className="text-xs text-red-500 mt-1">{errors.routingNumber}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Account Number</label>
                      <input
                        type="text"
                        value={achDetails.accountNumber}
                        onChange={(e) => setAchDetails({ ...achDetails, accountNumber: e.target.value })}
                        className={inputClass("accountNumber")}
                      />
                      {errors.accountNumber && <p className="text-xs text-red-500 mt-1">{errors.accountNumber}</p>}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Account Holder Name</label>
                    <input
                      type="text"
                      value={achDetails.accountHolder}
                      onChange={(e) => setAchDetails({ ...achDetails, accountHolder: e.target.value })}
                      className={inputClass("accountHolder")}
                    />
                    {errors.accountHolder && <p className="text-xs text-red-500 mt-1">{errors.accountHolder}</p>}
                  </div>
                </div>
              )}

              {/* CREDIT CARD FORM */}
              {paymentMethod === "card" && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className={labelClass}>Cardholder Name</label>
                    <input
                      type="text"
                      value={cardDetails.cardholderName}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value })}
                      className={inputClass("cardholderName")}
                    />
                    {errors.cardholderName && <p className="text-xs text-red-500 mt-1">{errors.cardholderName}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>Card Number</label>
                    <input
                      type="text"
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                      className={inputClass("cardNumber")}
                    />
                    {errors.cardNumber && <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                        className={inputClass("expiry")}
                      />
                      {errors.expiry && <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>CVV / CVC</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        className={inputClass("cvv")}
                      />
                      {errors.cvv && <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* WIRE / CHECK FORM */}
              {paymentMethod === "wire" && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className={labelClass}>Reference / Wire Number</label>
                    <input
                      type="text"
                      value={wireDetails.referenceNumber}
                      onChange={(e) => setWireDetails({ ...wireDetails, referenceNumber: e.target.value })}
                      className={inputClass("referenceNumber")}
                    />
                    {errors.referenceNumber && <p className="text-xs text-red-500 mt-1">{errors.referenceNumber}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>Payment Memo / Notes</label>
                    <textarea
                      rows={3}
                      value={wireDetails.memo}
                      onChange={(e) => setWireDetails({ ...wireDetails, memo: e.target.value })}
                      className="w-full rounded-lg border border-border-default px-3 py-2 text-sm text-text-primary bg-white outline-none focus:border-bill-green focus:ring-2 focus:ring-bill-green/20"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: TÓM TẮT HÓA ĐƠN & CONFIRM PAYMENT (5 CỘT) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
            <div className="rounded-xl border border-border-default bg-white shadow-[var(--shadow-card)] p-6 space-y-5">
              <h2 className="text-base font-semibold text-text-primary border-b border-border-light pb-3">
                Order & Invoice Summary ({selectedInvoices.length})
              </h2>

              {/* Danh sách các invoice được chọn */}
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {selectedInvoices.map((inv) => {
                  const statusConfig = STATUS_CONFIG[inv.status];
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border-default bg-gray-50/50 hover:bg-gray-50 transition-colors text-xs"
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <p className="font-semibold text-text-primary truncate">
                          {inv.vendorName}
                        </p>
                        <p className="text-[11px] font-mono text-text-muted">
                          {inv.invoiceNumber} · Due {formatDate(inv.dueDate)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-text-primary">
                          {formatCurrency(inv.amount)}
                        </p>
                        <Badge variant={statusConfig.variant} className="text-[9px] px-1.5 py-0 mt-0.5">
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border-light pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Processing Fee ({paymentMethod.toUpperCase()})</span>
                  <span className="text-bill-green font-medium">$0.00</span>
                </div>
                <div className="border-t border-border-default pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-text-primary text-base">Total Payment</span>
                  <span className="font-bold text-bill-green text-xl">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Confirm & Pay Button */}
              <div className="pt-2">
                <Button
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                  className="w-full h-11 text-base font-bold bg-bill-green text-white hover:bg-bill-green-dark shadow-md"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing Payment...
                    </span>
                  ) : (
                    `Confirm & Pay ${formatCurrency(totalAmount)}`
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 mt-3 text-[11px] text-text-muted">
                  <svg className="w-3.5 h-3.5 text-bill-green" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>256-Bit SSL Encrypted & Secure Payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-sm text-text-muted">
          Loading checkout details...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
