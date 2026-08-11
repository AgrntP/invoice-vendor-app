'use client'
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowUp, ArrowDown, Building2, Plus, X, CreditCard,
  Landmark, User, Loader2, ChevronRight, DollarSign,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

interface Vendor {
  id: string;
  name: string;
  email?: string;
  created_at: string;
  bank_name?: string | null;
  account_number?: string | null;
  account_holder?: string | null;
}

interface VendorWithBalance extends Vendor {
  amountDue: number;
}

type SortOrder = 'asc' | 'desc';

/* ── Create Vendor Modal ────────────────────────────────────── */
function CreateVendorModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (v: Vendor) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    bank_name: '',
    account_number: '',
    account_holder: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Vendor name is required.'); return; }
    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      bank_name: form.bank_name.trim() || null,
      account_number: form.account_number.trim() || null,
      account_holder: form.account_holder.trim() || null,
    };

    const { data, error: dbErr } = await supabase
      .from('vendors')
      .insert(payload)
      .select()
      .single();

    setSaving(false);
    if (dbErr) { setError(dbErr.message); return; }
    if (data) onCreated(data);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[3px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <form
          onSubmit={handleSubmit}
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md animate-fade-in"
          style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-bill-green-light rounded-lg">
                <Building2 className="w-4 h-4 text-bill-green" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Add New Vendor</h2>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition cursor-pointer">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Name — required */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                id="create-vendor-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Casio Electronics Ltd."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-bill-green focus:ring-2 focus:ring-bill-green/20 focus:bg-white transition"
                autoFocus
              />
              {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
            </div>

            {/* Email — optional */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Email <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="billing@vendor.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-bill-green focus:ring-2 focus:ring-bill-green/20 focus:bg-white transition"
              />
            </div>

            {/* Payment Details — optional */}
            <div className="pt-1">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-3.5 h-3.5 text-bill-green" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Payment Details <span className="font-normal normal-case text-gray-400">(optional)</span>
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={form.account_holder}
                  onChange={(e) => setForm({ ...form, account_holder: e.target.value })}
                  placeholder="Account holder name"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-bill-green focus:ring-2 focus:ring-bill-green/20 focus:bg-white transition"
                />
                <input
                  type="text"
                  value={form.bank_name}
                  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  placeholder="Bank name (e.g. Vietcombank)"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-bill-green focus:ring-2 focus:ring-bill-green/20 focus:bg-white transition"
                />
                <input
                  type="text"
                  value={form.account_number}
                  onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                  placeholder="Account number"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-bill-green focus:ring-2 focus:ring-bill-green/20 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition cursor-pointer">
              Cancel
            </button>
            <button
              id="create-vendor-submit"
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-bill-green text-white text-sm font-semibold hover:bg-bill-green-dark transition shadow-sm disabled:opacity-60 flex items-center gap-2 cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {saving ? 'Creating...' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function VendorExplorerList() {
  const [vendors, setVendors] = useState<VendorWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const sortedVendors = useMemo(() => {
    return [...vendors].sort((a, b) => {
      const comparison = (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [vendors, sortOrder]);

  const toggleSortOrder = () => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));

  async function loadVendors() {
    setLoading(true);

    // Fetch vendors
    const { data: vendorData } = await supabase
      .from('vendors')
      .select('*')
      .order('name', { ascending: true });

    if (!vendorData) { setLoading(false); return; }

    // Fetch all unpaid invoice totals in one query
    const vendorIds = vendorData.map((v) => v.id);
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('vendor_id, total')
      .in('vendor_id', vendorIds)
      .eq('status', 'unpaid')
      .is('deleted_at', null);

    // Sum unpaid totals per vendor
    const balanceMap: Record<string, number> = {};
    (invoiceData || []).forEach((inv) => {
      balanceMap[inv.vendor_id] = (balanceMap[inv.vendor_id] || 0) + (inv.total || 0);
    });

    const enriched: VendorWithBalance[] = vendorData.map((v) => ({
      ...v,
      amountDue: balanceMap[v.id] || 0,
    }));
    setVendors(enriched);
    setLoading(false);
  }

  useEffect(() => { loadVendors(); }, [sortOrder]);

  const handleVendorCreated = (v: Vendor) => {
    setVendors((prev) => [...prev, { ...v, amountDue: 0 }]);
    setShowCreateModal(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3 font-sans">

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Vendors</h1>
        <button
          id="create-vendor-btn"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-bill-green text-white rounded-xl text-sm font-semibold hover:bg-bill-green-dark transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
        <button
          onClick={toggleSortOrder}
          className="col-span-6 flex items-center gap-1.5 hover:text-gray-900 transition-colors focus:outline-none group text-left"
        >
          <span>Vendor Name</span>
          <span className="text-gray-400 group-hover:text-gray-700">
            {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          </span>
        </button>
        <div className="col-span-3 text-center">Currency</div>
        <div className="col-span-3 text-right">Amount Due</div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-8 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading vendors...
        </div>
      ) : sortedVendors.length === 0 ? (
        <div className="py-12 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No vendors yet.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-3 text-sm text-bill-green font-semibold hover:underline cursor-pointer"
          >
            Add your first vendor →
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {sortedVendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.id}`}
              className="grid grid-cols-12 gap-4 items-center px-4 py-3.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
            >
              {/* Name */}
              <div className="col-span-6 flex items-center gap-3 min-w-0">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-md group-hover:bg-blue-100 transition-colors shrink-0">
                  <Building2 size={18} />
                </div>
                <span className="font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                  {vendor.name}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Currency */}
              <div className="col-span-3 flex items-center justify-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-semibold">
                  <DollarSign className="w-3 h-3" />
                  USD
                </span>
              </div>

              {/* Amount Due */}
              <div className="col-span-3 text-right">
                <span className={`text-sm font-bold ${vendor.amountDue > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                  {vendor.amountDue > 0
                    ? `$${vendor.amountDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '—'
                  }
                </span>
                {vendor.amountDue > 0 && (
                  <p className="text-[10px] text-amber-500 font-medium mt-0.5">unpaid</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create vendor modal */}
      {showCreateModal && (
        <CreateVendorModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleVendorCreated}
        />
      )}
    </div>
  );
}