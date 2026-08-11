'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Building2,
  RefreshCw,
  ArrowLeft,
  FileText,
  CheckCircle,
  Clock,
  X,
  Check,
  Trash2,
  Undo2,
  CreditCard,
  ShoppingCart,
  Landmark,
  User,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

interface Vendor {
  id: string;
  name: string;
  bank_name?: string | null;
  account_number?: string | null;
  account_holder?: string | null;
}

/* ── Payment Details Card — editable ─────────────────────── */
function PaymentDetailsCard({
  vendor,
  onClose,
  onSaved,
}: {
  vendor: Vendor;
  onClose: () => void;
  onSaved: (updated: Vendor) => void;
}) {
  const [form, setForm] = useState({
    account_holder: vendor.account_holder || '',
    bank_name: vendor.bank_name || '',
    account_number: vendor.account_number || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty =
    form.account_holder !== (vendor.account_holder || '') ||
    form.bank_name !== (vendor.bank_name || '') ||
    form.account_number !== (vendor.account_number || '');

  async function handleSave() {
    setSaving(true);
    const { data, error } = await supabase
      .from('vendors')
      .update({
        account_holder: form.account_holder.trim() || null,
        bank_name: form.bank_name.trim() || null,
        account_number: form.account_number.trim() || null,
      })
      .eq('id', vendor.id)
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      onSaved(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-bill-green focus:ring-2 focus:ring-bill-green/20 focus:bg-white transition';

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="fixed z-50 inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm animate-fade-in"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-bill-green-light rounded-lg">
                <CreditCard className="w-4 h-4 text-bill-green" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Payment Details</h3>
                <p className="text-[11px] text-gray-500">{vendor.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition cursor-pointer">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Editable fields */}
          <div className="px-6 py-5 space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3 h-3" /> Account Holder
              </label>
              <input
                type="text"
                value={form.account_holder}
                onChange={(e) => setForm({ ...form, account_holder: e.target.value })}
                placeholder="Account holder name"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Landmark className="w-3 h-3" /> Bank Name
              </label>
              <input
                type="text"
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                placeholder="e.g. Vietcombank"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3 h-3" /> Account Number
              </label>
              <input
                type="text"
                value={form.account_number}
                onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                placeholder="Account number"
                className={inputCls}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-bill-green" />
              Payment info linked to this vendor
            </div>
            <button
              id="save-payment-info-btn"
              onClick={handleSave}
              disabled={!isDirty || saving}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                saved
                  ? 'bg-bill-green-light text-bill-green border border-bill-green/25'
                  : isDirty && !saving
                  ? 'bg-bill-green text-white hover:bg-bill-green-dark shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...</>
              ) : saved ? (
                <><Check className="w-3.5 h-3.5" /> Saved!</>
              ) : (
                <><Check className="w-3.5 h-3.5" /> Save</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

interface Invoice {
  id: string;
  file_name: string;
  file_path: string;
  status: 'unprocessed' | 'pending_review' | 'unpaid' | 'paid';
  invoice_number?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
  description?: string | null;
}

type FormData = {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  total: number;
  description: string;
};

function formDataFromInvoice(inv: Invoice): FormData {
  return {
    invoice_number: inv.invoice_number || '',
    invoice_date: inv.invoice_date || '',
    due_date: inv.due_date || '',
    subtotal: inv.subtotal || 0,
    tax: inv.tax || 0,
    total: inv.total || 0,
    description: inv.description || '',
  };
}

function formDataEqual(a: FormData, b: FormData): boolean {
  return (
    a.invoice_number === b.invoice_number &&
    a.invoice_date === b.invoice_date &&
    a.due_date === b.due_date &&
    Number(a.subtotal) === Number(b.subtotal) &&
    Number(a.tax) === Number(b.tax) &&
    Number(a.total) === Number(b.total) &&
    a.description === b.description
  );
}

export default function VendorDashboardPage() {
  const params = useParams();
  const vendorId = params?.id as string;
  const router = useRouter();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid');
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);

  // Multi-select (checkboxes)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Single invoice detail modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    invoice_number: '',
    invoice_date: '',
    due_date: '',
    subtotal: 0,
    tax: 0,
    total: 0,
    description: '',
  });

  // Track original formData for dirty detection
  const [originalFormData, setOriginalFormData] = useState<FormData | null>(null);

  const isDirty = useMemo(() => {
    if (!originalFormData) return false;
    return !formDataEqual(formData, originalFormData);
  }, [formData, originalFormData]);

  // ─── Data loading ───────────────────────────────────────────
  useEffect(() => {
    if (vendorId) loadVendorData();
  }, [vendorId]);

  useEffect(() => {
    if (selectedInvoice) {
      const fd = formDataFromInvoice(selectedInvoice);
      setFormData(fd);
      setOriginalFormData(fd);
      loadDocumentPreview(selectedInvoice.file_path);
    } else {
      setPreviewUrl(null);
      setTextContent(null);
      setOriginalFormData(null);
    }
  }, [selectedInvoice]);

  // Clear selection when switching tabs
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

  async function loadVendorData() {
    setLoading(true);
    const { data: vendorData } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();
    if (vendorData) setVendor(vendorData);

    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('*')
      .eq('vendor_id', vendorId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (invoiceData) setInvoices(invoiceData);
    setLoading(false);
  }

  async function loadDocumentPreview(filePath: string) {
    setPreviewUrl(null);
    setTextContent(null);
    const cleanPath = filePath.startsWith('invoices/')
      ? filePath.replace('invoices/', '')
      : filePath;
    const { data, error } = await supabase.storage
      .from('invoices')
      .createSignedUrl(cleanPath, 3600);

    if (error || !data?.signedUrl) {
      setTextContent(`Unable to load file preview: ${error?.message || 'File not found'}`);
      return;
    }
    if (cleanPath.toLowerCase().endsWith('.txt')) {
      try {
        const res = await fetch(data.signedUrl);
        setTextContent(await res.text());
      } catch {
        setTextContent('Error reading text content from storage.');
      }
    } else {
      setPreviewUrl(data.signedUrl);
    }
  }

  // ─── Actions ───────────────────────────────────────────────
  async function handleSaveInvoice() {
    if (!selectedInvoice || !isDirty) return;
    setSaving(true);
    const payload = {
      invoice_number: formData.invoice_number || null,
      invoice_date: formData.invoice_date || null,
      due_date: formData.due_date || null,
      subtotal: isNaN(Number(formData.subtotal)) ? 0 : Number(formData.subtotal),
      tax: isNaN(Number(formData.tax)) ? 0 : Number(formData.tax),
      total: isNaN(Number(formData.total)) ? 0 : Number(formData.total),
      description: formData.description || null,
    };
    const { data, error } = await supabase
      .from('invoices')
      .update(payload)
      .eq('id', selectedInvoice.id)
      .select()
      .single();
    if (error) {
      alert(`Error saving invoice: ${error.message}`);
    } else if (data) {
      setSelectedInvoice(data);
      setOriginalFormData(formDataFromInvoice(data));
      setInvoices((prev) => prev.map((inv) => (inv.id === data.id ? data : inv)));
    }
    setSaving(false);
  }

  async function handleMarkUnpaid(invoiceId: string) {
    setUpdatingId(invoiceId);
    const { data, error } = await supabase
      .from('invoices')
      .update({ status: 'unpaid' })
      .eq('id', invoiceId)
      .select()
      .single();
    if (!error && data) {
      setInvoices((prev) => prev.map((inv) => (inv.id === invoiceId ? data : inv)));
      if (selectedInvoice?.id === invoiceId) setSelectedInvoice(data);
    }
    setUpdatingId(null);
  }

  async function handleMoveToInbox(invoiceId: string) {
    if (!confirm('Move this bill back to the inbox and reset status to unprocessed?')) return;
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'unprocessed', deleted_at: null, vendor_id: null })
      .eq('id', invoiceId);
    if (error) {
      alert(`Error moving to inbox: ${error.message}`);
    } else {
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
      setSelectedInvoice(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(invoiceId);
        return next;
      });
    }
  }

  // Navigate to checkout with selected invoice IDs
  const handlePayNow = useCallback(
    (ids: string[]) => {
      const query = new URLSearchParams({
        ids: ids.join(','),
        vendorId,
      });
      router.push(`/payables/checkout?${query.toString()}`);
    },
    [router, vendorId]
  );

  // ─── Checkbox helpers ──────────────────────────────────────
  const toggleCheckbox = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (list: Invoice[]) => {
    const allSelected = list.every((inv) => selectedIds.has(inv.id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        list.forEach((inv) => next.delete(inv.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        list.forEach((inv) => next.add(inv.id));
        return next;
      });
    }
  };

  // ─── Derived data ──────────────────────────────────────────
  const unpaidInvoices = invoices.filter((inv) => inv.status === 'unpaid');
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
  const dueBalance = unpaidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const activeList = activeTab === 'unpaid' ? unpaidInvoices : paidInvoices;
  const activeSelectedIds = [...selectedIds].filter((id) =>
    activeList.some((inv) => inv.id === id)
  );

  // ─── Loading / Not found ───────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-xs text-slate-500 gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" /> Loading vendor dashboard...
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center text-xs text-slate-500 gap-3">
        <p>Vendor not found.</p>
        <button
          onClick={() => router.push('/vendors')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl"
        >
          Back to Vendors
        </button>
      </div>
    );
  }

  const allActiveChecked =
    activeList.length > 0 && activeList.every((inv) => selectedIds.has(inv.id));
  const someActiveChecked = activeList.some((inv) => selectedIds.has(inv.id));

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 p-6 font-sans">
      <div className="max-w-6xl mx-auto w-full space-y-6">

        {/* Back + Header */}
        <div>
          <button
            onClick={() => router.push('/vendors')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Vendors List
          </button>

          <div className="flex items-center justify-between gap-3 bg-white border border-slate-300 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-slate-900 truncate">{vendor.name}</h1>
                <p className="text-xs text-slate-500">Supplier Financial &amp; Bills Control Dashboard</p>
              </div>
            </div>
            {/* Payment Info button — same row as vendor name */}
            <button
              id="vendor-payment-info-btn"
              onClick={() => setShowPaymentInfo(true)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
                vendor.bank_name || vendor.account_number
                  ? 'bg-bill-green-light text-bill-green hover:bg-bill-green/20 border border-bill-green/25'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Payment Info
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 shadow-sm">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">Due Balance</span>
            <span className="text-xl font-bold text-amber-900 mt-1 block">${dueBalance.toFixed(2)}</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-2xl p-5 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Unpaid Bills</span>
            <span className="text-xl font-bold text-slate-800 mt-1 block">{unpaidInvoices.length}</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-2xl p-5 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Paid Bills</span>
            <span className="text-xl font-bold text-emerald-700 mt-1 block">{paidInvoices.length}</span>
          </div>
        </div>

        {/* Invoice table card */}
        <div className="bg-white border border-slate-300 rounded-2xl shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-2">
            <button
              onClick={() => setActiveTab('unpaid')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'unpaid'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Unpaid Bills ({unpaidInvoices.length})
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'paid'
                  ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Paid Bills ({paidInvoices.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'unpaid' ? (
              unpaidInvoices.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 italic">No unpaid bills found for this vendor.</div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        {/* Select-all checkbox */}
                        <th className="p-3.5 w-9">
                          <input
                            type="checkbox"
                            id="select-all-unpaid"
                            checked={allActiveChecked}
                            ref={(el) => { if (el) el.indeterminate = !allActiveChecked && someActiveChecked; }}
                            onChange={() => toggleAll(unpaidInvoices)}
                            className="w-3.5 h-3.5 cursor-pointer accent-indigo-600"
                          />
                        </th>
                        <th className="p-3.5">File Name</th>
                        <th className="p-3.5">Invoice Date</th>
                        <th className="p-3.5">Due Date</th>
                        <th className="p-3.5 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {unpaidInvoices.map((inv) => (
                        <tr
                          key={inv.id}
                          className={`hover:bg-slate-50/80 transition cursor-pointer ${
                            selectedIds.has(inv.id) ? 'bg-indigo-50/60' : ''
                          }`}
                          onClick={() => toggleCheckbox(inv.id)}
                        >
                          <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(inv.id)}
                              onChange={() => toggleCheckbox(inv.id)}
                              className="w-3.5 h-3.5 cursor-pointer accent-indigo-600"
                            />
                          </td>
                          <td
                            className="p-3.5 font-medium text-slate-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoice(inv);
                            }}
                          >
                            <span className="flex items-center gap-2 hover:text-indigo-700 transition">
                              <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                              <span className="underline underline-offset-2 decoration-slate-300">
                                {inv.file_name}
                              </span>
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600">{inv.invoice_date || '-'}</td>
                          <td className="p-3.5 text-slate-600">{inv.due_date || '-'}</td>
                          <td className="p-3.5 text-right font-bold text-slate-900">
                            ${(inv.total || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              paidInvoices.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 italic">No paid bills found for this vendor.</div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="p-3.5 w-9">
                          <input
                            type="checkbox"
                            id="select-all-paid"
                            checked={allActiveChecked}
                            ref={(el) => { if (el) el.indeterminate = !allActiveChecked && someActiveChecked; }}
                            onChange={() => toggleAll(paidInvoices)}
                            className="w-3.5 h-3.5 cursor-pointer accent-indigo-600"
                          />
                        </th>
                        <th className="p-3.5">File Name</th>
                        <th className="p-3.5">Invoice Date</th>
                        <th className="p-3.5 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {paidInvoices.map((inv) => (
                        <tr
                          key={inv.id}
                          className={`hover:bg-slate-50/80 transition cursor-pointer ${
                            selectedIds.has(inv.id) ? 'bg-indigo-50/60' : ''
                          }`}
                          onClick={() => toggleCheckbox(inv.id)}
                        >
                          <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(inv.id)}
                              onChange={() => toggleCheckbox(inv.id)}
                              className="w-3.5 h-3.5 cursor-pointer accent-indigo-600"
                            />
                          </td>
                          <td
                            className="p-3.5 font-medium text-slate-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoice(inv);
                            }}
                          >
                            <span className="flex items-center gap-2 hover:text-emerald-700 transition">
                              <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="underline underline-offset-2 decoration-slate-300">
                                {inv.file_name}
                              </span>
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600">{inv.invoice_date || '-'}</td>
                          <td className="p-3.5 text-right font-bold text-slate-900">
                            ${(inv.total || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>

      </div>

      {/* ── Floating multi-select action bar ─────────────────── */}
      {activeSelectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
          <div className="flex items-center gap-3 bg-slate-900 text-white rounded-2xl px-5 py-3.5 shadow-2xl border border-slate-700">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-[11px] font-bold">
                {activeSelectedIds.length}
              </div>
              <span className="text-xs font-medium text-slate-200">
                {activeSelectedIds.length === 1 ? 'invoice' : 'invoices'} selected
              </span>
            </div>

            <div className="w-px h-5 bg-slate-600" />

            {activeTab === 'unpaid' && (
              <button
                id="floating-pay-now-btn"
                onClick={() => handlePayNow(activeSelectedIds)}
                className="flex items-center gap-2 bg-bill-green hover:bg-bill-green-dark text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Pay Now
                <span className="text-[10px] font-normal opacity-80">
                  (${unpaidInvoices
                    .filter((inv) => activeSelectedIds.includes(inv.id))
                    .reduce((s, inv) => s + (inv.total || 0), 0)
                    .toFixed(2)})
                </span>
              </button>
            )}

            <button
              id="floating-clear-btn"
              onClick={() => setSelectedIds(new Set())}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Invoice detail modal ──────────────────────────────── */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white border border-slate-300 w-full max-w-6xl h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">

            {/* Modal header */}
            <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-semibold text-xs text-slate-900">{selectedInvoice.file_name}</h2>
                  <p className="text-[10px] text-slate-400 font-mono">{selectedInvoice.file_path}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">

              {/* Left: document preview */}
              <div className="bg-slate-100 p-4 border-r border-slate-200 flex flex-col justify-center items-center overflow-hidden">
                {textContent !== null ? (
                  <div className="w-full h-full bg-white border border-slate-300 rounded-xl p-4 font-mono text-xs text-slate-800 overflow-y-auto whitespace-pre-wrap shadow-inner">
                    {textContent}
                  </div>
                ) : previewUrl ? (
                  selectedInvoice.file_path.match(/\.(png|jpe?g|webp|gif|svg)$/i) ? (
                    <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="Document"
                        className="max-h-full max-w-full object-contain rounded-xl shadow-md border border-slate-200"
                      />
                    </div>
                  ) : (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full rounded-xl border border-slate-300 bg-white shadow-sm"
                      title="Preview"
                    />
                  )
                ) : (
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" /> Fetching document preview...
                  </div>
                )}
              </div>

              {/* Right: form + actions */}
              <div className="flex flex-col bg-white overflow-y-auto">
                {/* Action toolbar */}
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2.5 bg-slate-50 flex-wrap">
                  <div className="flex items-center gap-2">
                    {/* Pay Now / Mark as Unpaid depending on status */}
                    {selectedInvoice.status === 'paid' ? (
                      <button
                        id="modal-mark-unpaid-btn"
                        onClick={() => handleMarkUnpaid(selectedInvoice.id)}
                        disabled={updatingId === selectedInvoice.id || saving}
                        className="py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        <Undo2 className="w-3.5 h-3.5" /> Mark as Unpaid
                      </button>
                    ) : (
                      <button
                        id="modal-pay-now-btn"
                        onClick={() => handlePayNow([selectedInvoice.id])}
                        disabled={updatingId === selectedInvoice.id || saving}
                        className="py-2 px-3 bg-bill-green hover:bg-bill-green-dark text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Pay Now
                      </button>
                    )}

                    <button
                      id="modal-move-inbox-btn"
                      onClick={() => handleMoveToInbox(selectedInvoice.id)}
                      className="py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Move to Inbox
                    </button>
                  </div>

                  {/* Save Changes — enabled only when isDirty */}
                  <button
                    id="modal-save-btn"
                    onClick={handleSaveInvoice}
                    disabled={!isDirty || saving}
                    className={`py-2 px-5 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-sm transition cursor-pointer ${
                      isDirty && !saving
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                {/* Form fields */}
                <div className="p-6 space-y-4 flex-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={formData.invoice_number}
                      onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Invoice Date
                      </label>
                      <input
                        type="date"
                        value={formData.invoice_date}
                        onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-300/80 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Subtotal</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.subtotal}
                        onChange={(e) => setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })}
                        className="w-28 text-right bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Tax</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.tax}
                        onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                        className="w-28 text-right bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                      />
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-900">Total Amount</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.total}
                        onChange={(e) => setFormData({ ...formData, total: parseFloat(e.target.value) || 0 })}
                        className="w-28 text-right bg-white border border-indigo-500 rounded-lg px-2 py-1 text-xs font-bold text-indigo-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  {/* Dirty indicator */}
                  {isDirty && (
                    <div className="flex items-center gap-2 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Unsaved changes — click Save Changes to apply
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Info card (blur overlay, editable) */}
      {showPaymentInfo && vendor && (
        <PaymentDetailsCard
          vendor={vendor}
          onClose={() => setShowPaymentInfo(false)}
          onSaved={(updated) => setVendor(updated)}
        />
      )}
    </div>
  );
}