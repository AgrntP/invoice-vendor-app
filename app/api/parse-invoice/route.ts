import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

// Helper to safely parse numeric values from string fields (e.g. "$1,250.50" -> 1250.50)
function parseNumericField(fields: Record<string, any>, possibleKeys: string[]): number | null {
  for (const key of possibleKeys) {
    const val = fields[key]?.value;
    if (val !== undefined && val !== null && val !== '') {
      if (typeof val === 'number') return val;
      const cleaned = String(val).replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return null;
}

// Helper to safely retrieve text/string fields
function parseStringField(fields: Record<string, any>, possibleKeys: string[]): string | null {
  for (const key of possibleKeys) {
    const val = fields[key]?.value;
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim();
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: 'Missing Invoice ID' }, { status: 400 });
    }

    // 1. Fetch current invoice record
    const { data: invoice, error: dbError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (dbError || !invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found in database' }, { status: 404 });
    }

    if (!invoice.file_path) {
      return NextResponse.json({ success: false, error: 'File path missing' }, { status: 400 });
    }

    const cleanPath = invoice.file_path.replace(/^invoices\//, '');

    // 2. Download file from Storage
    const { data: fileBlob, error: storageError } = await supabase.storage
      .from('invoices')
      .download(cleanPath);

    if (storageError || !fileBlob) {
      return NextResponse.json({ success: false, error: `Could not download file (${cleanPath})` }, { status: 404 });
    }

    // 3. Convert to Base64
    const arrayBuffer = await fileBlob.arrayBuffer();
    const pdfBase64 = Buffer.from(arrayBuffer).toString('base64');

    const ext = cleanPath.split('.').pop()?.toLowerCase();
    let mimeType = 'application/pdf';
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'txt') mimeType = 'text/plain';

    const documentData = `data:${mimeType};base64,${pdfBase64}`;

    // 4. Call Base64.ai
    const aiResponse = await fetch("https://base64.ai/api/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `ApiKey ${process.env.BASE64_EMAIL}:${process.env.BASE64_API_KEY}`
      },
      body: JSON.stringify({ document: documentData })
    });

    if (!aiResponse.ok) {
      const aiErrorText = await aiResponse.text();
      console.error("Base64.ai Error:", aiErrorText);
      return NextResponse.json({ success: false, error: `OCR Error (${aiResponse.status})` }, { status: aiResponse.status });
    }

    const aiResult = await aiResponse.json();

    // 5. Extract fields object
    const rawDoc = Array.isArray(aiResult) ? aiResult[0] : aiResult;
    const fields = rawDoc?.fields || rawDoc?.modelOutput || {};

    // 6. Extraction Mapping
    const rawVendorName = parseStringField(fields, [
      'vendorName', 
      'vendor_name', 
      'companyName', 
      'supplierName', 
      'merchantName', 
      'sellerName'
    ]);

    const invoiceNumber = parseStringField(fields, ['invoiceNumber', 'invoiceNo', 'invoice_id', 'documentNumber', 'number']) || invoice.invoice_number;
    const invoiceDate = parseStringField(fields, ['invoiceDate', 'date', 'issueDate', 'documentDate']) || invoice.invoice_date;
    const dueDate = parseStringField(fields, ['dueDate', 'paymentDueDate', 'due_date', 'payByDate']) || invoice.due_date;
    
    const subtotal = parseNumericField(fields, ['subtotal', 'subTotal', 'netAmount', 'sub_total', 'subTotalAmount']) ?? invoice.subtotal;
    const tax = parseNumericField(fields, ['tax', 'taxAmount', 'vat', 'vatAmount', 'totalTax', 'salesTax']) ?? invoice.tax;
    const total = parseNumericField(fields, ['total', 'totalAmount', 'grossAmount', 'amountDue', 'balanceDue']) ?? invoice.total;
    const description = parseStringField(fields, ['summary', 'description', 'lineItems']) || invoice.description;

    // 7. Search `vendors` table for a fuzzy/partial match on vendor name
    let matchedVendorId: string | null = invoice.vendor_id || null;
    let matchedVendorName: string | null = null;

    if (rawVendorName) {
      // Look for a matching vendor by name (case-insensitive)
      const { data: matchedVendor } = await supabase
        .from('vendors')
        .select('id, name')
        .ilike('name', `%${rawVendorName}%`)
        .limit(1)
        .maybeSingle();

      if (matchedVendor) {
        matchedVendorId = matchedVendor.id;
        matchedVendorName = matchedVendor.name;
      }
    }

    // 8. Payload for `invoices` table (Uses vendor_id ONLY)
    const updatedInvoiceData = {
      status: 'pending_review' as const,
      vendor_id: matchedVendorId,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      due_date: dueDate,
      subtotal: subtotal,
      tax: tax,
      total: total,
      description: description
    };

    // 9. Update invoice record
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update(updatedInvoiceData)
      .eq('id', invoiceId)
      .select('*, vendors(id, name)') // Join vendors relation to get latest vendor details
      .single();

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      invoice: updatedInvoice,
      extractedVendorName: rawVendorName,
      matchedVendorName: matchedVendorName
    });

  } catch (err: any) {
    console.error('OCR Processing Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'System error' }, { status: 500 });
  }
}