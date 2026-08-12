'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle2, 
  QrCode, 
  Building2, 
  FileText, 
  RefreshCw, 
  CreditCard, 
  UserCheck, 
  AlertCircle,
  X 
} from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  bank_name?: string;       // e.g., "VCB", "MB", "TCB", "VietinBank"
  bank_number?: string;    // Account Number

}

interface Invoice {
  id: string;
  file_name: string;
  invoice_number?: string;
  total?: number;
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const vendorId = searchParams.get('vendorId');
  const idsParam = searchParams.get('ids');
  const invoiceIds = idsParam ? idsParam.split(',') : [];

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // UI Modal & Feedback States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (vendorId && invoiceIds.length > 0) {
      loadCheckoutData();
    }
  }, [vendorId, idsParam]);

  async function loadCheckoutData() {
    setLoading(true);

    const { data: vendorData } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();

    if (vendorData) setVendor(vendorData);

    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('id, file_name, invoice_number, total')
      .in('id', invoiceIds);

    if (invoiceData) setInvoices(invoiceData);

    setLoading(false);
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

  // Construct Static VietQR URL
  const bankId = vendor?.bank_name?.trim().toLowerCase() || 'vcb';
  const accountNo = vendor?.bank_number?.trim() || '';
  const accountHolder = vendor?.name || '';
  const paymentDescription = `Pay bills ${invoiceIds.slice(0, 2).join(', ')}`;

  const staticQrUrl = accountNo 
    ? `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(paymentDescription)}&accountName=${encodeURIComponent(accountHolder)}`
    : null;

  async function handleExecutePayment() {
    setShowConfirmModal(false);
    setProcessing(true);
    setErrorMessage(null);

    const { error } = await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .in('id', invoiceIds);

    if (error) {
      setErrorMessage(`Error updating invoices: ${error.message}`);
      setProcessing(false);
    } else {
      setSuccessMessage('Invoices successfully marked as paid!');
      setTimeout(() => {
        router.push(`/vendors/${vendorId}`);
      }, 1200);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-xs text-slate-500 gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" /> Preparing checkout terminal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 p-6 font-sans">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Vendor Dashboard
        </button>

        {/* Feedback Banners */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-700 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-rose-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage} Redirecting...</span>
          </div>
        )}

        <div className="bg-white border border-slate-300 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left Panel: Invoice Details */}
          <div className="w-full md:w-1/2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900">{vendor?.name || 'Vendor Checkout'}</h1>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <CreditCard className="w-3 h-3 text-indigo-600" /> 
                  {vendor?.bank_name ? `${vendor.bank_name.toUpperCase()} - ${vendor.bank_number}` : 'No bank details configured'}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Selected Invoices ({invoices.length})</span>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {invoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between text-xs bg-white border border-slate-200/80 p-2 rounded-lg">
                    <span className="font-medium text-slate-800 flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> {inv.file_name}
                    </span>
                    <span className="font-bold text-slate-900 shrink-0">
                      {totalAmount > 0 ? `${(inv.total || 0).toLocaleString('vi-VN')} ₫` : '$0'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200 px-1">
              <span className="text-xs font-semibold text-slate-600">Total Due Amount</span>
              <span className="text-lg font-bold text-indigo-600">
                {totalAmount.toLocaleString('vi-VN')} ₫
              </span>
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={processing || !!successMessage}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> {processing ? 'Processing...' : 'Confirm Payment & Mark Paid'}
            </button>
          </div>

          {/* Right Panel: Pure Static VietQR Image */}
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
            <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200 inline-block min-w-[260px] min-h-[260px] flex items-center justify-center">
              {staticQrUrl ? (
                <img
                  src={staticQrUrl}
                  alt="VietQR Payment Code"
                  className="w-64 h-64 object-contain rounded-xl"
                />
              ) : (
                <p className="text-xs text-rose-500 p-4">
                  Please configure Vendor's Bank Name and Account Number to display the QR code.
                </p>
              )}
            </div>

            {/* Account Holder Badge */}
            {accountHolder && (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-800 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Account Holder: {accountHolder.toUpperCase()}
              </div>
            )}

            <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-indigo-600" /> Open any banking app to scan & pay
            </p>
          </div>

        </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Confirm Payment</h3>
                <p className="text-xs text-slate-500">Mark selected invoices as paid?</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Invoices Count:</span>
                <span className="font-semibold text-slate-900">{invoices.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold text-emerald-600">{totalAmount.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePayment}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                Yes, Mark as Paid
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}