"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  LinkAuthenticationElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { formatCurrency } from "@/lib/utils";
import { supabase } from '@/lib/supabase';

import { Loader2 } from "lucide-react";


const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

/* -------------------------------------------------------------------------- */
/*                            STRIPE FORM COMPONENT                           */
/* -------------------------------------------------------------------------- */
function CheckoutForm({
  amount,
  vendorId,
  selectedIds,
}: {
  amount: number;
  vendorId: string;
  selectedIds: string[];
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsProcessing(true);
    setErrorMessage(null);

    // 1. Update invoice status in database to 'paid'
    if (selectedIds.length > 0) {
      await supabase
        .from("invoices")
        .update({ status: "paid" })
        .in("id", selectedIds);
    }

    const returnUrl = vendorId
      ? `${window.location.origin}/vendors/${vendorId}?toast=paid_complete`
      : `${window.location.origin}/payables?status=success`;

    // 2. Stripe payment confirmation
    if (stripe && elements) {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message ?? "An unexpected payment error occurred.");
        setIsProcessing(false);
        return;
      }
    }

    // 3. Redirect back to vendor page or payables page
    const targetUrl = vendorId
      ? `/vendors/${vendorId}?toast=paid_complete`
      : `/payables?status=success`;

    window.location.href = targetUrl;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Contact Information
        </label>
        <LinkAuthenticationElement className="rounded-lg border border-gray-200 p-1" />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Payment Details
        </label>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <PaymentElement
            options={{
              layout: "tabs",
            }}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-12 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-white" />
            Processing Payment...
          </span>
        ) : (
          `Pay ${formatCurrency(amount)}`
        )}
      </button>

      <div className="flex items-center justify-center gap-4 text-xs text-gray-400 pt-2">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          256-Bit SSL Encryption
        </span>
        <span>•</span>
        <span>Powered by Stripe</span>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*                            MAIN CHECKOUT CONTENT                           */
/* -------------------------------------------------------------------------- */
function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const idsParam = searchParams.get("ids") ?? "";
  const vendorIdParam = searchParams.get("vendorId") ?? "";

  const selectedIds = useMemo(
    () => (idsParam ? idsParam.split(",").filter(Boolean) : []),
    [idsParam]
  );

  const [invoices, setInvoices] = useState<any[]>([]);
  const [vendor, setVendor] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (vendorIdParam) {
        const { data } = await supabase
          .from("vendors")
          .select("id, name, bank_name, bank_number")
          .eq("id", vendorIdParam)
          .single();
        if (data) setVendor(data);
      }

      if (selectedIds.length > 0) {
        const { data } = await supabase
          .from("invoices")
          .select("id, file_name, total, invoice_number, status")
          .in("id", selectedIds);
        if (data) setInvoices(data);
      }
      setLoading(false);
    }
    loadData();
  }, [idsParam, vendorIdParam]);

  const rawAmount = useMemo(
    () => invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0),
    [invoices]
  );

  const validAmount = rawAmount > 0 ? rawAmount : 50.0;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stripe-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: validAmount, invoiceIds: selectedIds }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else if (data.error) {
          setStripeError(data.error);
        }
      })
      .catch((err) => {
        console.error("Stripe fetch error:", err);
        setStripeError(err?.message || "Failed to initialize Stripe.");
      });
  }, [validAmount, selectedIds]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <p className="text-xs font-medium text-gray-500">Loading invoice details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* TOP BAR / BREADCRUMB */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-5">
          <button
            onClick={() => router.back()}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            ← Back
          </button>
          {vendor && (
            <span className="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
              Vendor: {vendor.name}
            </span>
          )}
        </div>

        {/* TWO-COLUMN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: STRIPE CHECKOUT FORM (7 COLS) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                Complete your payment
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Select your preferred payment method below to settle your balance.
              </p>
            </div>

            {stripeError ? (
              <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700 space-y-1">
                <p className="font-semibold">Stripe Initialization Error</p>
                <p>{stripeError}</p>
              </div>
            ) : clientSecret ? (
              <Elements
                key={clientSecret}
                stripe={stripePromise}
                options={{
                  locale: "en",
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "#059669",
                      borderRadius: "8px",
                    },
                  },
                }}
              >
                <CheckoutForm
                  amount={validAmount}
                  vendorId={vendorIdParam}
                  selectedIds={selectedIds}
                />
              </Elements>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                <p className="text-xs font-medium text-gray-500">
                  Loading secure Stripe checkout...
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY (5 COLS) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">

              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-sm font-bold text-gray-900">
                  Summary ({invoices.length > 0 ? invoices.length : 1})
                </h2>
                <span className="text-xs text-gray-400 font-mono">USD</span>
              </div>

              {/* INVOICE ITEM LIST */}
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/60 text-xs"
                    >
                      <div className="space-y-0.5 truncate pr-2">
                        <p className="font-semibold text-gray-800 truncate">
                          {inv.file_name}
                        </p>
                        <p className="text-[11px] font-mono text-gray-400">
                          {inv.invoice_number ? `#${inv.invoice_number}` : "Bill"}
                        </p>
                      </div>
                      <span className="font-bold text-gray-900 shrink-0">
                        {formatCurrency(inv.total || 0)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-xs text-center space-y-1">
                    <p className="font-semibold text-gray-700">Test Standard Invoice</p>
                    <p className="text-[11px] text-gray-400">Default Test Amount</p>
                    <span className="inline-block font-bold text-gray-900 mt-1">
                      {formatCurrency(validAmount)}
                    </span>
                  </div>
                )}
              </div>

              {/* COST BREAKDOWN */}
              <div className="border-t border-gray-100 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(validAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Processing Fee</span>
                  <span className="text-emerald-600 font-medium">$0.00</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-gray-900 text-sm">Total Due</span>
                  <span className="font-black text-emerald-600 text-xl">
                    {formatCurrency(validAmount)}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function RedesignedCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <p className="text-xs font-medium text-gray-500">Loading checkout...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}