'use client'
import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Adjust your path
import { ArrowUp, ArrowDown, Building2 } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  email?: string;
  created_at: string;
}

type SortOrder = 'asc' | 'desc';

export default function VendorExplorerList() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Option 1: Client-side sorting (Fast for smaller lists < 1,000 items)
  const sortedVendors = useMemo(() => {
    return [...vendors].sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      const comparison = nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [vendors, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  useEffect(() => {
    async function loadVendors() {
      setLoading(true);
      
      // Option 2: Database-level sorting (Recommended for paginated data)
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name', { ascending: sortOrder === 'asc' });

      if (!error && data) {
        setVendors(data);
      }
      setLoading(false);
    }

    loadVendors();
  }, [sortOrder]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-2 font-sans">
      {/* File Explorer Header Bar */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
        <button
          onClick={toggleSortOrder}
          className="col-span-5 flex items-center gap-1.5 hover:text-gray-900 transition-colors focus:outline-none group text-left"
        >
          <span>Name</span>
          <span className="text-gray-400 group-hover:text-gray-700">
            {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          </span>
        </button>

        <div className="col-span-4">Email</div>
        <div className="col-span-3 text-right">Created Date</div>
      </div>

      {/* List of Vendor Cards */}
      {loading ? (
        <div className="py-8 text-center text-sm text-gray-500">Loading vendors...</div>
      ) : sortedVendors.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">No vendors found.</div>
      ) : (
        <div className="space-y-1">
          {sortedVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="grid grid-cols-12 gap-4 items-center px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
            >
              {/* Vendor Icon + Name */}
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-md group-hover:bg-blue-100 transition-colors">
                  <Building2 size={18} />
                </div>
                <span className="font-medium text-gray-900 truncate">
                  {vendor.name}
                </span>
              </div>

              {/* Email */}
              <div className="col-span-4 text-sm text-gray-600 truncate">
                {vendor.email || '—'}
              </div>

              {/* Created Date */}
              <div className="col-span-3 text-sm text-gray-500 text-right">
                {new Date(vendor.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}