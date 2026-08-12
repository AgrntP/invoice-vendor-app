'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  FileText,
  Sparkles,
  RefreshCw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckSquare,
  Square,
  RotateCcw,
  Inbox as InboxIcon
} from 'lucide-react';



interface Invoice {
  id: string;
  file_path: string;
  file_name: string;
  status: 'unprocessed' | 'pending_review' | 'approved' | 'rejected';
  vendor_id?: string | null;
  invoice_number?: string | null;
  invoice_date?: string | null;
  currency?: 'usd' | 'vnd';
  due_date?: string | null;
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
  description?: string | null;
  created_at: string;
  deleted_at?: string | null;
}

const ITEMS_PER_PAGE = 8;

export default function InvoiceInboxGrid() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  
  // View mode: 'inbox' (active items) vs 'trash' (soft-deleted items)
  const [viewMode, setViewMode] = useState<'inbox' | 'trash'>('inbox');

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  // Form State inside Modal
const [formData, setFormData] = useState({
  vendor_id: '' as string | null,
  invoice_number: '',
  invoice_date: '',
  due_date: '',
  currency: 'usd',
  subtotal: 0,
  tax: 0,
  total: 0,
  description: '',
  
});

// 1. Add vendors state
const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);

// 2. Fetch vendors list on component mount
useEffect(() => {
  async function fetchVendors() {
    const { data, error } = await supabase.from('vendors').select('id, name');
    console.log('Vendors fetch result:', { data, error });
    if (data) {
      setVendors(data);
    } else if (error) {
      console.error('Error fetching vendors:', error.message);
    }
  }
  fetchVendors();
}, []);

  useEffect(() => {
    setSelectedIds([]);
    setCurrentPage(1);
    fetchInvoices();
  }, [viewMode]);

  useEffect(() => {
    console.log('Selected Invoice changed:', selectedInvoice?.currency);
  if (selectedInvoice) {
    setFormData({
      vendor_id: selectedInvoice.vendor_id || '',
      invoice_number: selectedInvoice.invoice_number || '',
      invoice_date: selectedInvoice.invoice_date || '',
      due_date: selectedInvoice.due_date || '',
      currency: selectedInvoice.currency?.toLowerCase() as 'usd' | 'vnd' || 'vnd',
      subtotal: selectedInvoice.subtotal || 0,
      tax: selectedInvoice.tax || 0,
      total: selectedInvoice.total || 0,
      description: selectedInvoice.description || ''
    });
    loadDocumentPreview(selectedInvoice.file_path);
    // ... rest of your code

      const isText = selectedInvoice.file_path.toLowerCase().endsWith('.txt');
      if (!isText && selectedInvoice.status === 'unprocessed') {
        handleAIExtract(selectedInvoice.id);
      }
    } else {
      setPreviewUrl(null);
      setTextContent(null);
    }
  }, [selectedInvoice]);

  async function fetchInvoices() {
  setLoading(true);
  let query = supabase.from('invoices').select('*');

  if (viewMode === 'inbox') {
    // Only keep unprocessed or pending_review invoices in the active inbox
    query = query
      .is('deleted_at', null)
      .in('status', ['unprocessed', 'pending_review']);
  } else if (viewMode === 'trash') {
    query = query.not('deleted_at', 'is', null);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (!error && data) setInvoices(data);
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
      console.error("Signed URL error:", error);
      setTextContent(`Unable to load file preview: ${error?.message || 'File not found'}`);
      return;
    }

    if (cleanPath.toLowerCase().endsWith('.txt')) {
      try {
        const res = await fetch(data.signedUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        setTextContent(text);
      } catch (e) {
        setTextContent('Error reading text content from storage.');
      }
    } else {
      setPreviewUrl(data.signedUrl);
    }
  }

  async function handleAIExtract(invoiceId?: string) {
  const targetId = invoiceId || selectedInvoice?.id;
  
  if (!targetId) {
    alert('Invalid Invoice ID');
    return;
  }

  setExtracting(true);

  try {
    const res = await fetch('/api/parse-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: targetId })
    });

    const result = await res.json();

    if (result.success && result.invoice) {
      setSelectedInvoice(result.invoice);
      setInvoices(prev =>
        prev.map(inv => (inv.id === result.invoice.id ? result.invoice : inv))
      );
    } else {
      // Use alert or state instead of console.error to avoid triggering Next.js DevTools overlay
      const errorMessage = result.error || 'Extraction failed';
      console.warn(`Extraction notice: ${errorMessage}`);
      alert(`AI Extraction Error: ${errorMessage}`);
    }
  } catch (err: any) {
    console.warn(`Error running OCR: ${err.message}`);
    alert(`OCR Request Error: ${err.message}`);
  } finally {
    setExtracting(false);
  }
}

  async function handleApproveInvoice() {
    if (!selectedInvoice) return;
    setSaving(true);

    // Sanitize payload to prevent 400 validation errors from Supabase
    const payload = {
      vendor_id: formData.vendor_id || null,
      invoice_number: formData.invoice_number || null,
      invoice_date: formData.invoice_date ? formData.invoice_date : null,
      due_date: formData.due_date ? formData.due_date : null,
      subtotal: isNaN(Number(formData.subtotal)) ? 0 : Number(formData.subtotal),
      tax: isNaN(Number(formData.tax)) ? 0 : Number(formData.tax),
      total: isNaN(Number(formData.total)) ? 0 : Number(formData.total),
      description: formData.description || null,
      status: 'unpaid' as const
    };

    const { data, error } = await supabase
      .from('invoices')
      .update(payload)
      .eq('id', selectedInvoice.id)
      .select()
      .single();

    if (error) {
      console.error("Supabase Update Error Details:", error);
      alert(`Failed to approve: ${error.message} (Code: ${error.code})`);
      setSaving(false);
    } else if (data) {
      setSelectedInvoice(null);
      setSaving(false);
      await fetchInvoices();
      window.location.reload();
    }
  }

  function toggleSelectCard(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  }

  // SOFT DELETE BULK
async function handleSoftDeleteSelected() {
  if (selectedIds.length === 0) return;

  setDeleting(true);
  console.log('Attempting soft delete on IDs:', selectedIds);

  const { data, error } = await supabase
    .from('invoices')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', selectedIds)
    .select(); // .select() forces Supabase to return the modified rows

  console.log('Result:', { data, error });
  console.log('Selected IDs being sent:', selectedIds);
console.log('Sample invoice from state:', invoices[0]);

  if (error) {
    alert(`Supabase Error (${error.code}): ${error.message}\nDetail: ${error.details || 'None'}`);
  } else if (!data || data.length === 0) {
    alert('No rows were modified. Verify that the IDs match the database records exactly.');
  } else {
    // Success: Update UI state
    setInvoices(prev => prev.filter(inv => !selectedIds.includes(inv.id)));
    setSelectedIds([]);
  }

  setDeleting(false);
}

// SOFT DELETE SINGLE (MODAL)
async function handleSoftDeleteSingle(id: string) {
  setDeleting(true);

  const { data, error } = await supabase
    .from('invoices')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select();

  if (error) {
    alert(`Supabase Error (${error.code}): ${error.message}\nDetail: ${error.details || 'None'}`);
  } else if (!data || data.length === 0) {
    alert('No row modified. ID might not exist in database.');
  } else {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    setSelectedIds(prev => prev.filter(item => item !== id));
    setSelectedInvoice(null);
  }

  setDeleting(false);
}

  // RESTORE FROM TRASH
  async function handleRestoreSelected() {
    if (selectedIds.length === 0) return;

    setDeleting(true);
    const { error } = await supabase
      .from('invoices')
      .update({ deleted_at: null })
      .in('id', selectedIds);

    if (!error) {
      setInvoices(prev => prev.filter(inv => !selectedIds.includes(inv.id)));
      setSelectedIds([]);
    } else {
      alert(`Error restoring items: ${error.message}`);
    }
    setDeleting(false);
  }

  // PERMANENT DELETE (from Trash Bin)
  async function handlePermanentDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.length} invoice(s)? This cannot be undone.`)) return;

    setDeleting(true);
    const { error } = await supabase
      .from('invoices')
      .delete()
      .in('id', selectedIds);

    if (!error) {
      setInvoices(prev => prev.filter(inv => !selectedIds.includes(inv.id)));
      setSelectedIds([]);
    } else {
      alert(`Error permanently deleting items: ${error.message}`);
    }
    setDeleting(false);
  }

  // RESTORE SINGLE ITEM FROM TRASH
  async function handleRestoreSingle(id: string) {
    setDeleting(true);
    const { error } = await supabase
      .from('invoices')
      .update({ deleted_at: null })
      .eq('id', id);

    if (!error) {
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      setSelectedIds(prev => prev.filter(item => item !== id));
      setSelectedInvoice(null);
    } else {
      alert(`Error restoring item: ${error.message}`);
    }
    setDeleting(false);
  }

  // PERMANENT DELETE SINGLE ITEM FROM TRASH
  async function handlePermanentDeleteSingle(id: string) {
    if (!confirm('Permanently delete this invoice? This cannot be undone.')) return;
    setDeleting(true);
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (!error) {
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      setSelectedIds(prev => prev.filter(item => item !== id));
      setSelectedInvoice(null);
    } else {
      alert(`Error deleting item: ${error.message}`);
    }
    setDeleting(false);
  }

  // Pagination Calculations
  const totalPages = Math.ceil(invoices.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedInvoices = invoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 p-6 font-sans">
      
      {/* HEADER & VIEW TOGGLE */}
      <div className="max-w-7xl mx-auto w-full mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">
          {viewMode === 'inbox' ? 'Invoice Inbox' : 'Trash Bin'}
        </h1>

        <div className="flex bg-slate-200/80 p-1 rounded-xl gap-1 border border-slate-300/80">
          <button
            onClick={() => setViewMode('inbox')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'inbox' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <InboxIcon className="w-3.5 h-3.5" />
            Inbox
          </button>
          <button
            onClick={() => setViewMode('trash')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'trash' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Trash Bin
          </button>
        </div>
      </div>

      {/* BULK ACTION HEADER */}
      {selectedIds.length > 0 && (
        <div className="mb-5 p-3 px-5 bg-white border border-slate-300 rounded-2xl shadow-md flex items-center justify-between max-w-7xl mx-auto w-full transition-all">
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 font-bold">
              {selectedIds.length} Selected
            </span>
            <span>{viewMode === 'inbox' ? 'Manage inbox items' : 'Manage trashed items'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
            >
              Deselect All
            </button>

            {viewMode === 'inbox' ? (
              <button
                onClick={handleSoftDeleteSelected}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-xl shadow-sm transition disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? 'Deleting...' : `Delete (${selectedIds.length})`}
              </button>
            ) : (
              <>
                <button
                  onClick={handleRestoreSelected}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {deleting ? 'Restoring...' : 'Undo Delete'}
                </button>
                <button
                  onClick={handlePermanentDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* UNIFORM INBOX GRID */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" /> Loading...
        </div>
      ) : invoices.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-white text-slate-500 text-xs">
          {viewMode === 'inbox' ? 'No inbound files in your inbox.' : 'Trash bin is empty.'}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto w-full space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {invoices.slice(startIndex, startIndex + ITEMS_PER_PAGE).map((inv) => {
              const isSelected = selectedIds.includes(inv.id);
              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`group relative bg-white border ${
                    isSelected ? 'border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/10' : 'border-slate-300/90 hover:border-indigo-500/80'
                  } rounded-2xl p-4 cursor-pointer transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-0.5 h-[280px] flex flex-col`}
                >
                  {/* Top Checkbox & Header */}
                  <div className="space-y-0.5 mb-2.5 shrink-0 pr-7">
                    <h3 className="font-semibold text-xs text-slate-900 truncate group-hover:text-indigo-600 transition" title={inv.file_name}>
                      {inv.file_name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Checkbox Trigger */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectCard(inv.id);
                    }}
                    className="absolute top-3.5 right-3.5 p-1 rounded-lg hover:bg-slate-100 transition text-slate-400 hover:text-indigo-600"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600 fill-indigo-50" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
                    )}
                  </button>

                  {/* EXPANDED PREVIEW CONTAINER */}
                  <div className="flex-1 w-full rounded-xl border border-slate-200/80 bg-slate-50 p-2.5 overflow-hidden text-[11px] shadow-inner">
                    <GridCardPreview filePath={inv.file_path} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAGINATION CONTROLS */}
          <div className="mt-8 pt-4 border-t border-slate-300/70 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold text-slate-900">{invoices.length === 0 ? 0 : startIndex + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(startIndex + ITEMS_PER_PAGE, invoices.length)}</span> of <span className="font-semibold text-slate-900">{invoices.length}</span> items
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-white border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition text-slate-700 shadow-sm"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3.5 py-1.5 font-medium text-slate-800 bg-white border border-slate-300 rounded-lg shadow-sm">
                Page <span className="font-bold text-indigo-600">{currentPage}</span> of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-white border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition text-slate-700 shadow-sm"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* SIDE-BY-SIDE MODAL PREVIEW & CODING */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white border border-slate-300 w-full max-w-6xl h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
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
                className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
              
              {/* LEFT HALF: Document Viewer */}
<div className="bg-slate-100 p-4 border-r border-slate-200 flex flex-col justify-center items-center overflow-hidden">
  {textContent !== null ? (
    <div className="w-full h-full bg-white border border-slate-300 rounded-xl p-4 font-mono text-xs text-slate-800 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
      {textContent}
    </div>
  ) : previewUrl ? (
    selectedInvoice.file_path.match(/\.(png|jpe?g|webp|gif|svg)$/i) ? (
      // Image Viewer
      <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
        <img
          src={previewUrl}
          alt="Invoice Document"
          className="max-h-full max-w-full object-contain rounded-xl shadow-md border border-slate-200"
        />
      </div>
    ) : (
      // PDF or Other Embedded Documents
      <iframe
        src={previewUrl}
        className="w-full h-full rounded-xl border border-slate-300 bg-white shadow-sm"
        title="Document Preview"
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
                {/* Action Bar */}
                {viewMode === 'trash' ? (
                  <div className="p-4 border-b border-slate-200 flex items-center justify-end gap-2.5 bg-slate-50">
                    <button
                      onClick={() => handleRestoreSingle(selectedInvoice.id)}
                      disabled={deleting}
                      className="py-2 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Undo Delete
                    </button>

                    <button
                      onClick={() => handlePermanentDeleteSingle(selectedInvoice.id)}
                      disabled={deleting}
                      className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-2.5 bg-slate-50">
                    {extracting ? (
                      <div className="flex-1 py-2 px-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700 font-medium flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        Auto-Extracting data with Base64.ai...
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAIExtract()}
                        className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Re-run AI Extraction
                      </button>
                    )}

                    {/* Soft Delete in Modal */}
                    <button
                      onClick={() => handleSoftDeleteSingle(selectedInvoice.id)}
                      disabled={deleting}
                      className="py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>

                    <button
                      onClick={handleApproveInvoice}
                      disabled={saving}
                      className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {saving ? 'Saving...' : 'Approve'}
                    </button>
                  </div>
                )}

                {/* Form Fields */}
<div className="p-6 space-y-4 flex-1">
  {/* VENDOR SELECTION DROPDOWN */}
  <div>
    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
      Vendor
    </label>
    <select
      value={formData.vendor_id || ''}
      onChange={e => setFormData({ ...formData, vendor_id: e.target.value || null })}
      className="w-full bg-white !border !border-indigo-400 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium appearance-none focus:!outline-none focus:!border-indigo-600 focus:!ring-2 focus:!ring-indigo-500/20 transition"
    >
      <option value="">-- Select Vendor --</option>
      {vendors.map(v => (
        <option key={v.id} value={v.id}>
          {v.name}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
      Invoice Number
    </label>
    <input
      type="text"
      value={formData.invoice_number}
      onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
      placeholder="e.g. INV-2026-001"
      className="w-full bg-white !border !border-indigo-400 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:!outline-none focus:!border-indigo-600 focus:!ring-2 focus:!ring-indigo-500/20 transition"
    />
  </div>

  <div className="grid grid-cols-2 gap-3">
    <div>
      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
        Invoice Date
      </label>
      <input
        type="date"
        value={formData.invoice_date}
        onChange={e => setFormData({ ...formData, invoice_date: e.target.value })}
        className="w-full bg-white !border !border-indigo-400 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:!outline-none focus:!border-indigo-600 focus:!ring-2 focus:!ring-indigo-500/20 transition"
      />
    </div>
    <div>
      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
        Due Date
      </label>
      <input
        type="date"
        value={formData.due_date}
        onChange={e => setFormData({ ...formData, due_date: e.target.value })}
        className="w-full bg-white !border !border-indigo-400 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:!outline-none focus:!border-indigo-600 focus:!ring-2 focus:!ring-indigo-500/20 transition"
      />
    </div>
  </div>

  {/* Accounting Amounts Block */}
  <div className="bg-indigo-50/20 !border !border-indigo-300 rounded-xl p-4 space-y-3">
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-700 font-bold">Currency</span>
      <select
        value={formData.currency}
        onChange={e => setFormData({ ...formData, currency: e.target.value as 'usd' | 'vnd' })}
        className="w-28 bg-white !border !border-indigo-400 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold focus:!outline-none focus:!border-indigo-600 focus:!ring-2 focus:!ring-indigo-500/20"
      >
        <option value="usd">USD</option>
        <option value="vnd">VND</option>
      </select>
    </div>

    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-700 font-bold">Subtotal</span>
      <input
        type="number"
        step="0.01"
        value={formData.subtotal}
        onChange={e => setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })}
        className="w-28 text-right bg-white !border !border-indigo-400 rounded-lg px-2 py-1 text-xs text-slate-900 font-medium focus:!outline-none focus:!border-indigo-600 focus:!ring-2 focus:!ring-indigo-500/20"
      />
    </div>

    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-700 font-bold">Tax</span>
      <input
        type="number"
        step="0.01"
        value={formData.tax}
        onChange={e => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
        className="w-28 text-right bg-white !border !border-indigo-400 rounded-lg px-2 py-1 text-xs text-slate-900 font-medium focus:!outline-none focus:!border-indigo-600 focus:!ring-2 focus:!ring-indigo-500/20"
      />
    </div>

    <div className="pt-3 !border-t !border-indigo-300 flex items-center justify-between text-xs font-bold">
      <span className="text-slate-900">Total Amount</span>
      <input
        type="number"
        step="0.01"
        value={formData.total}
        onChange={e => setFormData({ ...formData, total: parseFloat(e.target.value) || 0 })}
        className="w-28 text-right bg-white !border-2 !border-indigo-500 rounded-lg px-2 py-1 text-xs text-indigo-900 font-extrabold focus:!outline-none focus:!border-indigo-700 focus:!ring-2 focus:!ring-indigo-500/20"
      />
    </div>
  </div>

  <div>
    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
      Description / Line Items
    </label>
    <textarea
      rows={4}
      value={formData.description}
      onChange={e => setFormData({ ...formData, description: e.target.value })}
      placeholder="Summary of billed items..."
      className="w-full bg-white !border !border-indigo-400 rounded-xl p-3 text-xs text-slate-900 font-medium focus:!outline-none focus:!border-indigo-600 focus:!ring-2 focus:!ring-indigo-500/20 transition"
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

function GridCardPreview({ filePath }: { filePath: string }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [snippet, setSnippet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const cleanPath = filePath.startsWith('invoices/')
    ? filePath.replace('invoices/', '')
    : filePath;

  const ext = cleanPath.split('.').pop()?.toLowerCase() || '';

  const isText = ext === 'txt';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
  const isPdf = ext === 'pdf';

  useEffect(() => {
    let isMounted = true;

    async function loadPreview() {
      setLoading(true);
      try {
        const { data, error } = await supabase.storage
          .from('invoices')
          .createSignedUrl(cleanPath, 3600);

        if (!error && data?.signedUrl) {
          if (isMounted) setSignedUrl(data.signedUrl);

          // If text file, fetch content preview
          if (isText) {
            const res = await fetch(data.signedUrl);
            if (res.ok) {
              const fullText = await res.text();
              if (isMounted) setSnippet(fullText.slice(0, 500));
            }
          }
        }
      } catch (err) {
        console.error("Preview error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPreview();
    return () => { isMounted = false; };
  }, [filePath, cleanPath, isText]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-400">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
      </div>
    );
  }

  // 1. Text File Snippet
  if (isText) {
    return (
      <div className="h-full w-full font-mono text-[10px] text-slate-700 overflow-hidden leading-snug whitespace-pre-wrap select-none">
        {snippet || <span className="text-slate-400 italic">Empty text file</span>}
      </div>
    );
  }

  // 2. Image Preview (PNG, JPG, WEBP, GIF, SVG)
  if (isImage && signedUrl) {
    return (
      <div className="h-full w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-100/50">
        <img
          src={signedUrl}
          alt="Invoice Image Preview"
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
    );
  }

  // 3. PDF Interactive Frame
  if (isPdf && signedUrl) {
    return (
      <div className="h-full w-full overflow-hidden rounded-lg pointer-events-none">
        <iframe
          src={`${signedUrl}#toolbar=0&navpanes=0&scrollbar=0`}
          className="w-full h-full border-0"
          title="PDF Preview"
        />
      </div>
    );
  }

  // 4. Fallback for non-previewable formats (.docx, .xlsx, .zip, etc.)
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-slate-400 bg-white/60 rounded-lg">
      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
        <FileText className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
        {ext ? `${ext} File` : 'Document'}
      </span>
    </div>
  );
}