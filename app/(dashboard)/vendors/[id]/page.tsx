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
  RotateCcw,
  Sparkles,
  DollarSign,
  CalendarCheck,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const BANK_OPTIONS = ['MBBank', 'Vietcombank', 'VietinBank', 'HDBank', 'BIDV'] as const;

interface Vendor {
  id: string;
  name: string;
  currency?: string | null;
  bank_name?: string | null;
  bank_number?: string | null;
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
    name: vendor.name || '',
    bank_name: vendor.bank_name || '',
    bank_number: vendor.bank_number || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Compare against actual values currently saved in the database
  const isDirty =
    form.name.trim() !== (vendor.name || '').trim() ||
    form.bank_name.trim() !== (vendor.bank_name || '').trim() ||
    form.bank_number.trim() !== (vendor.bank_number || '').trim();

  async function handleSave() {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('vendors')
        .update({
          name: form.name.trim(),
          bank_name: form.bank_name.trim() || null,
          bank_number: form.bank_number.trim() || null,
        })
        .eq('id', vendor.id)
        .select()
        .single();

      setSaving(false);
      if (error) {
        console.error('Error updating vendor payment details:', error);
        alert(`Failed to save to database: ${error.message}`);
        return;
      }
      if (data) {
        onSaved(data);
        setSaved(true);
        window.location.reload();
      }
    } catch (err: unknown) {
      setSaving(false);
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Unexpected error updating payment details:', err);
      alert(`Unexpected error: ${errMsg}`);
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
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Account holder name"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Landmark className="w-3 h-3" /> Bank Name
              </label>
              <select
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-bill-green focus:ring-2 focus:ring-bill-green/20 focus:bg-white transition cursor-pointer"
              >
                <option value="">-- Select Bank --</option>
                {BANK_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3 h-3" /> Account Number
              </label>
              <input
                type="text"
                value={form.bank_number}
                onChange={(e) => setForm({ ...form, bank_number: e.target.value })}
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
  currency: 'usd' | 'vnd';
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

  const [showToast, setShowToast] = useState(false);

  // Check for paid complete toast query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('toast') === 'paid_complete' || urlParams.get('status') === 'success') {
        setShowToast(true);
        setActiveTab('unpaid');
        const timer = setTimeout(() => {
          setShowToast(false);
        }, 3500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

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
      window.location.reload();
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
    if (!confirm('Move this bill back to the inbox?')) return;
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'pending_review', deleted_at: null, vendor_id: null })
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

  async function handleSoftDeleteInvoices(ids: string[]) {
    if (ids.length === 0) return;
    if (!confirm(`Move ${ids.length} selected bill(s) to Trash Bin?`)) return;

    setUpdatingId(ids[0]);
    const { error } = await supabase
      .from('invoices')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      alert(`Error moving to Trash Bin: ${error.message}`);
    } else {
      setInvoices((prev) => prev.filter((inv) => !ids.includes(inv.id)));
      if (selectedInvoice && ids.includes(selectedInvoice.id)) {
        setSelectedInvoice(null);
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }
    setUpdatingId(null);
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

  const [deletingVendor, setDeletingVendor] = useState(false);

  async function handleDeleteVendor() {
    if (!vendor) return;
    if (
      !confirm(
        `Are you sure you want to delete vendor "${vendor.name}"? All associated bills will be moved back to Inbox as "pending_review".`
      )
    )
      return;

    setDeletingVendor(true);
    try {
      // 1. Move all invoices for this vendor back to Inbox with pending_review status
      await supabase
        .from('invoices')
        .update({
          vendor_id: null,
          status: 'pending_review',
          deleted_at: null,
        })
        .eq('vendor_id', vendor.id);

      // 2. Delete the vendor
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendor.id);

      if (error) {
        alert(`Failed to delete vendor: ${error.message}`);
        setDeletingVendor(false);
      } else {
        router.push('/vendors');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Error deleting vendor: ${errMsg}`);
      setDeletingVendor(false);
    }
  }

  // ─── Derived data ──────────────────────────────────────────
  const unpaidInvoices = invoices.filter((inv) => inv.status === 'unpaid');
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
  const pendingInvoices = invoices.filter((inv) => inv.status === 'pending_review');
  const dueBalance = unpaidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const paidTotal = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
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
            {/* Header Action Buttons — Payment Info & Delete Vendor */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                id="vendor-payment-info-btn"
                onClick={() => setShowPaymentInfo(true)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
                  vendor.bank_name || vendor.bank_number
                    ? 'bg-bill-green-light text-bill-green hover:bg-bill-green/20 border border-bill-green/25'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Payment Info
              </button>

              <button
                onClick={handleDeleteVendor}
                disabled={deletingVendor}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50 shadow-sm shrink-0"
                title="Delete Vendor"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deletingVendor ? 'Deleting...' : 'Delete Vendor'}
              </button>
            </div>
          </div>
        </div>

        {/* 4 KPI Dashboard Cards (Matching Payables Financial System) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          
          {/* 1. Total Unpaid */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-rose-600 transition-transform duration-200 group-hover:scale-110">
                <DollarSign className="h-5.5 w-5.5" />
              </div>
              <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                <TrendingUp className="h-3 w-3" />
                +12.5%
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {vendor.currency?.toUpperCase() === 'VND'
                  ? `₫${dueBalance.toLocaleString('vi-VN')}`
                  : `$${dueBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">Total Unpaid</p>
            </div>
            <p className="mt-2 text-xs text-slate-400">vs last month</p>
          </div>

          {/* 2. Pending Approval */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform duration-200 group-hover:scale-110">
                <Clock className="h-5.5 w-5.5" />
              </div>
              <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                invoices
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {pendingInvoices.length}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">Pending Approval</p>
            </div>
            <p className="mt-2 text-xs text-slate-400">invoices waiting review</p>
          </div>

          {/* 3. Scheduled Payments */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform duration-200 group-hover:scale-110">
                <CalendarCheck className="h-5.5 w-5.5" />
              </div>
              <div className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                <TrendingUp className="h-3 w-3" />
                +{unpaidInvoices.length}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {unpaidInvoices.length}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">Scheduled Payments</p>
            </div>
            <p className="mt-2 text-xs text-slate-400">upcoming unpaid bills</p>
          </div>

          {/* 4. Paid Total */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform duration-200 group-hover:scale-110">
                <CheckCircle className="h-5.5 w-5.5" />
              </div>
              <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                <TrendingUp className="h-3 w-3" />
                +8.3%
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold tracking-tight text-emerald-700">
                {vendor.currency?.toUpperCase() === 'VND'
                  ? `₫${paidTotal.toLocaleString('vi-VN')}`
                  : `$${paidTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">Paid Total ({paidInvoices.length})</p>
            </div>
            <p className="mt-2 text-xs text-slate-400">vs last month</p>
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
              id="floating-trash-btn"
              onClick={() => handleSoftDeleteInvoices(activeSelectedIds)}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow-sm cursor-pointer"
              title="Move selected bills to Trash Bin on Dashboard"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>

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
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                      title="Move back to Unprocessed Inbox"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Move to Inbox
                    </button>

                    <button
                      id="modal-soft-delete-btn"
                      onClick={() => handleSoftDeleteInvoices([selectedInvoice.id])}
                      className="py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                      title="Delete bill"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
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

      {/* Sliding Large Colorful Toast Notification — Bottom Right */}
      <div
        className={`fixed bottom-8 right-8 z-50 flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white rounded-3xl shadow-[0_15px_45px_rgba(16,185,129,0.55)] border-2 border-emerald-300/50 backdrop-blur-xl transition-all duration-700 cubic-bezier(0.34,1.56,0.64,1) transform ${
          showToast
            ? 'translate-x-0 scale-100 opacity-100'
            : 'translate-x-full scale-90 opacity-0 pointer-events-none'
        }`}
      >
        <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner shrink-0 ring-2 ring-white/40 animate-pulse">
          <CheckCircle className="w-7 h-7 text-white drop-shadow-lg" />
        </div>
        <div className="flex flex-col pr-1">
          <span className="text-base font-black tracking-widest uppercase text-white drop-shadow-md">
            Paid Complete
          </span>
          <span className="text-xs font-semibold text-emerald-100/90">
            Payment confirmed &amp; updated successfully!
          </span>
        </div>
      </div>
    </div>
  );
}