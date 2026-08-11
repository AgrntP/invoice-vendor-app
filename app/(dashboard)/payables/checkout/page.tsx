"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  LinkAuthenticationElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useInvoices } from "@/lib/invoice-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Initialize Stripe outside component render
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_sample_key"
);

/* -------------------------------------------------------------------------- */
/*                            STRIPE FORM COMPONENT                           */
/* -------------------------------------------------------------------------- */
function CheckoutForm({ amount }: { amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payables?status=success`,
      },
    });

    if (error) {
      setErrorMessage(error.message ?? "An unexpected payment error occurred.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stripe Express Link / Express Checkout */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Contact Information
        </label>
        <LinkAuthenticationElement className="rounded-lg border border-gray-200 p-1" />
      </div>

      {/* Stripe Managed Payment Inputs (Cards, ACH, Apple Pay) */}
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

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-12 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all rounded-xl shadow-lg shadow-emerald-600/20"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing Payment...
          </span>
        ) : (
          `Pay ${formatCurrency(amount)}`
        )}
      </Button>

      {/* Footer Guarantees */}
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
/*                            MAIN CHECKOUT PAGE                              */
/* -------------------------------------------------------------------------- */
export default function RedesignedCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { invoices } = useInvoices();

  // Get invoice IDs from query string
  const idsParam = searchParams.get("ids") ?? "";
  const selectedIds = useMemo(
    () => (idsParam ? idsParam.split(",").filter(Boolean) : []),
    [idsParam]
  );

  // Calculate matching invoices & sum
  const selectedInvoices = useMemo(
    () => invoices.filter((inv) => selectedIds.includes(inv.id)),
    [invoices, selectedIds]
  );

  const rawAmount = useMemo(
    () => selectedInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0),
    [selectedInvoices]
  );

  // Fallback to $50.00 for test mode if no invoices are selected
  const validAmount = rawAmount > 0 ? rawAmount : 50.0;

  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Fetch PaymentIntent from Next.js server route
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
        }
      })
      .catch((err) => console.error("Stripe fetch error:", err));
  }, [validAmount, selectedIds]);

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* TOP BAR / BREADCRUMB */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/payables")}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
            >
              ← Back to Payables
            </button>
          </div>
          <span className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-mono font-medium text-amber-700">

</span>
        </div>

        {/* TWO-COLUMN GRID (SHOPIFY / STRIPE STYLE) */}
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

            {/* Mount Stripe Elements only when clientSecret is ready */}
            {clientSecret ? (
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
                <CheckoutForm amount={validAmount} />
              </Elements>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 space-y-3">
                <svg className="animate-spin h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-xs font-medium text-gray-500">
                  Loading secure checkout...
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY (5 COLS) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-sm font-bold text-gray-900">
                  Summary ({selectedInvoices.length > 0 ? selectedInvoices.length : 1})
                </h2>
                <span className="text-xs text-gray-400 font-mono">USD</span>
              </div>

              {/* INVOICE ITEM LIST */}
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {selectedInvoices.length > 0 ? (
                  selectedInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/60 text-xs"
                    >
                      <div className="space-y-0.5 truncate pr-2">
                        <p className="font-semibold text-gray-800 truncate">
                          {inv.vendorName}
                        </p>
                        <p className="text-[11px] font-mono text-gray-400">
                          {inv.invoiceNumber}
                        </p>
                      </div>
                      <span className="font-bold text-gray-900 shrink-0">
                        {formatCurrency(inv.amount)}
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