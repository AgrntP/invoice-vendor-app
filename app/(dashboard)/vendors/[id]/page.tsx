'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Building2, RefreshCw, ArrowLeft, FileText, CheckCircle, Clock, DollarSign, X, Check, Trash2, Undo2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

interface Vendor {
  id: string;
  name: string;
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

export default function VendorDashboardPage() {
  const params = useParams();
  const vendorId = params?.id as string;
  const router = useRouter();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid');
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_date: '',
    due_date: '',
    subtotal: 0,
    tax: 0,
    total: 0,
    description: ''
  });

  useEffect(() => {
    if (vendorId) {
      loadVendorData();
    }
  }, [vendorId]);

  useEffect(() => {
    if (selectedInvoice) {
      setFormData({
        invoice_number: selectedInvoice.invoice_number || '',
        invoice_date: selectedInvoice.invoice_date || '',
        due_date: selectedInvoice.due_date || '',
        subtotal: selectedInvoice.subtotal || 0,
        tax: selectedInvoice.tax || 0,
        total: selectedInvoice.total || 0,
        description: selectedInvoice.description || ''
      });
      loadDocumentPreview(selectedInvoice.file_path);
    } else {
      setPreviewUrl(null);
      setTextContent(null);
    }
  }, [selectedInvoice]);

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

    const cleanPath = filePath.startsWith('invoices/') ? filePath.replace('invoices/', '') : filePath;
    const { data, error } = await supabase.storage.from('invoices').createSignedUrl(cleanPath, 3600);

    if (error || !data?.signedUrl) {
      setTextContent(`Unable to load file preview: ${error?.message || 'File not found'}`);
      return;
    }

    if (cleanPath.toLowerCase().endsWith('.txt')) {
      try {
        const res = await fetch(data.signedUrl);
        const text = await res.text();
        setTextContent(text);
      } catch (e) {
        setTextContent('Error reading text content from storage.');
      }
    } else {
      setPreviewUrl(data.signedUrl);
    }
  }

  // Combined function that saves form changes AND updates status simultaneously
  async function handleUpdateStatus(invoiceId: string, newStatus: 'unpaid' | 'paid') {
    setUpdatingId(invoiceId);
    setSaving(true);

    const payload = {
      invoice_number: formData.invoice_number || null,
      invoice_date: formData.invoice_date || null,
      due_date: formData.due_date || null,
      subtotal: isNaN(Number(formData.subtotal)) ? 0 : Number(formData.subtotal),
      tax: isNaN(Number(formData.tax)) ? 0 : Number(formData.tax),
      total: isNaN(Number(formData.total)) ? 0 : Number(formData.total),
      description: formData.description || null,
      status: newStatus
    };

    const { data, error } = await supabase
      .from('invoices')
      .update(payload)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) {
      alert(`Error updating bill: ${error.message}`);
    } else if (data) {
      setInvoices(prev =>
        prev.map(inv => (inv.id === invoiceId ? data : inv))
      );
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice(data);
      }
    }
    setUpdatingId(null);
    setSaving(false);
  }

  async function handleSaveInvoice() {
    if (!selectedInvoice) return;
    setSaving(true);

    const payload = {
      invoice_number: formData.invoice_number || null,
      invoice_date: formData.invoice_date || null,
      due_date: formData.due_date || null,
      subtotal: isNaN(Number(formData.subtotal)) ? 0 : Number(formData.subtotal),
      tax: isNaN(Number(formData.tax)) ? 0 : Number(formData.tax),
      total: isNaN(Number(formData.total)) ? 0 : Number(formData.total),
      description: formData.description || null
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
      setInvoices(prev => prev.map(inv => (inv.id === data.id ? data : inv)));
      alert('Changes saved successfully!');
    }
    setSaving(false);
  }

  async function handleMoveToInbox(invoiceId: string) {
    if (!confirm('Move this bill back to the inbox and reset status to unprocessed?')) return;

    const { error } = await supabase
      .from('invoices')
      .update({ 
        status: 'unprocessed',
        deleted_at: null,
        vendor_id: null 
      })
      .eq('id', invoiceId);

    if (error) {
      alert(`Error moving to inbox: ${error.message}`);
    } else {
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      setSelectedInvoice(null);
    }
  }

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
        <button onClick={() => router.push('/vendors')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl">Back to Vendors</button>
      </div>
    );
  }

  const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid');
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const dueBalance = unpaidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 p-6 font-sans">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        
        <div>
          <button
            onClick={() => router.push('/vendors')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Vendors List
          </button>

          <div className="flex items-center gap-3 bg-white border border-slate-300 p-5 rounded-2xl shadow-sm">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">{vendor.name}</h1>
              <p className="text-xs text-slate-500">Supplier Financial & Bills Control Dashboard</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 shadow-sm">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">Due Balance</span>
            <span className="text-xl font-bold text-amber-900 mt-1 block">${dueBalance.toFixed(2)}</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-2xl p-5 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Unpaid Bills Count</span>
            <span className="text-xl font-bold text-slate-800 mt-1 block">{unpaidInvoices.length}</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-2xl p-5 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Paid Bills Count</span>
            <span className="text-xl font-bold text-emerald-700 mt-1 block">{paidInvoices.length}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-300 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-2">
            <button
              onClick={() => setActiveTab('unpaid')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'unpaid' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Unpaid Bills ({unpaidInvoices.length})
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'paid' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
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
                        <th className="p-3.5">File Name</th>
                        <th className="p-3.5">Invoice Date</th>
                        <th className="p-3.5">Due Date</th>
                        <th className="p-3.5 text-right">Total Amount</th>
                        <th className="p-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {unpaidInvoices.map(inv => (
                        <tr 
                          key={inv.id} 
                          onClick={() => setSelectedInvoice(inv)} 
                          className="hover:bg-slate-50/80 transition cursor-pointer"
                        >
                          <td className="p-3.5 font-medium text-slate-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-600" /> {inv.file_name}
                          </td>
                          <td className="p-3.5 text-slate-600">{inv.invoice_date || '-'}</td>
                          <td className="p-3.5 text-slate-600">{inv.due_date || '-'}</td>
                          <td className="p-3.5 text-right font-bold text-slate-900">${(inv.total || 0).toFixed(2)}</td>
                          <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleUpdateStatus(inv.id, 'paid')}
                              disabled={updatingId === inv.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px] transition shadow-sm disabled:opacity-50 flex items-center gap-1 mx-auto"
                            >
                              <DollarSign className="w-3 h-3" /> Mark as Paid
                            </button>
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
                        <th className="p-3.5">File Name</th>
                        <th className="p-3.5">Invoice Date</th>
                        <th className="p-3.5 text-right">Total Amount</th>
                        <th className="p-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {paidInvoices.map(inv => (
                        <tr 
                          key={inv.id} 
                          onClick={() => setSelectedInvoice(inv)}
                          className="hover:bg-slate-50/80 transition cursor-pointer"
                        >
                          <td className="p-3.5 font-medium text-slate-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-600" /> {inv.file_name}
                          </td>
                          <td className="p-3.5 text-slate-600">{inv.invoice_date || '-'}</td>
                          <td className="p-3.5 text-right font-bold text-slate-900">${(inv.total || 0).toFixed(2)}</td>
                          <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleUpdateStatus(inv.id, 'unpaid')}
                              disabled={updatingId === inv.id}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-[11px] transition shadow-sm disabled:opacity-50 flex items-center gap-1 mx-auto"
                            >
                              <Undo2 className="w-3 h-3" /> Mark as Unpaid
                            </button>
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

      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white border border-slate-300 w-full max-w-6xl h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            
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
              <button onClick={() => setSelectedInvoice(null)} className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
              
              <div className="bg-slate-100 p-4 border-r border-slate-200 flex flex-col justify-center items-center overflow-hidden">
                {textContent !== null ? (
                  <div className="w-full h-full bg-white border border-slate-300 rounded-xl p-4 font-mono text-xs text-slate-800 overflow-y-auto whitespace-pre-wrap shadow-inner">
                    {textContent}
                  </div>
                ) : previewUrl ? (
                  selectedInvoice.file_path.match(/\.(png|jpe?g|webp|gif|svg)$/i) ? (
                    <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                      <img src={previewUrl} alt="Document" className="max-h-full max-w-full object-contain rounded-xl shadow-md border border-slate-200" />
                    </div>
                  ) : (
                    <iframe src={previewUrl} className="w-full h-full rounded-xl border border-slate-300 bg-white shadow-sm" title="Preview" />
                  )
                ) : (
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" /> Fetching document preview...
                  </div>
                )}
              </div>

              <div className="flex flex-col bg-white overflow-y-auto">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-2.5 bg-slate-50">
                  <div className="flex items-center gap-2">
                    {selectedInvoice.status === 'paid' ? (
                      <button
                        onClick={() => handleUpdateStatus(selectedInvoice.id, 'unpaid')}
                        disabled={updatingId === selectedInvoice.id || saving}
                        className="py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                      >
                        <Undo2 className="w-3.5 h-3.5" /> Mark as Unpaid
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(selectedInvoice.id, 'paid')}
                        disabled={updatingId === selectedInvoice.id || saving}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Mark as Paid
                      </button>
                    )}

                    <button
                      onClick={() => handleMoveToInbox(selectedInvoice.id)}
                      className="py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Move to Inbox (Reset)
                    </button>
                  </div>

                  <button
                    onClick={handleSaveInvoice}
                    disabled={saving}
                    className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                <div className="p-6 space-y-4 flex-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Invoice Number</label>
                    <input
                      type="text"
                      value={formData.invoice_number}
                      onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Invoice Date</label>
                      <input
                        type="date"
                        value={formData.invoice_date}
                        onChange={e => setFormData({ ...formData, invoice_date: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Due Date</label>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={e => setFormData({ ...formData, due_date: e.target.value })}
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
                        onChange={e => setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })}
                        className="w-28 text-right bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Tax</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.tax}
                        onChange={e => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                        className="w-28 text-right bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                      />
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-900">Total Amount</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.total}
                        onChange={e => setFormData({ ...formData, total: parseFloat(e.target.value) || 0 })}
                        className="w-28 text-right bg-white border border-indigo-500 rounded-lg px-2 py-1 text-xs font-bold text-indigo-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}