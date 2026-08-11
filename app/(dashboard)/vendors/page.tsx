'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Building2, Plus, RefreshCw, X, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

interface Vendor {
  id: string;
  name: string;
  created_at?: string;
}

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    setLoading(true);
    const { data, error } = await supabase.from('vendors').select('*').order('name', { ascending: true });
    if (!error && data) setVendors(data);
    setLoading(false);
  }

  async function handleCreateVendor(e: React.FormEvent) {
    e.preventDefault();
    if (!newVendorName.trim()) return;

    setCreating(true);
    const { data, error } = await supabase
      .from('vendors')
      .insert({ name: newVendorName.trim() })
      .select()
      .single();

    if (error) {
      alert(`Error creating vendor: ${error.message}`);
    } else if (data) {
      setVendors(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewVendorName('');
      setIsCreateOpen(false);
    }
    setCreating(false);
  }

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 p-6 font-sans">
      
      {/* Page Header */}
      <div className="max-w-7xl mx-auto w-full mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Vendor Management</h1>
          <p className="text-xs text-slate-500">Manage your suppliers, track due balances, and view payment histories.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      {/* Vendors Grid */}
      <div className="max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" /> Loading vendors...
          </div>
        ) : vendors.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-white text-slate-500 text-xs">
            No vendors created yet. Click "Add Vendor" to start.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {vendors.map(vendor => (
              <div
                key={vendor.id}
                onClick={() => router.push(`/vendors/${vendor.id}`)}
                className="bg-white border border-slate-300/90 hover:border-indigo-500 rounded-2xl p-5 cursor-pointer transition shadow-sm hover:shadow-md flex flex-col justify-between group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] text-slate-400 group-hover:text-indigo-600 font-medium flex items-center gap-1">
                    Open dashboard <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 truncate">{vendor.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Added {new Date(vendor.created_at || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE VENDOR MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-800">Add New Vendor</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateVendor} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Vendor Name</label>
                <input
                  type="text"
                  required
                  value={newVendorName}
                  onChange={e => setNewVendorName(e.target.value)}
                  placeholder="e.g. Acme Supplies Inc."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="px-4 py-2 text-xs font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}