import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { pdfBase64, mimeType } = await request.json();

    if (!pdfBase64) {
      return NextResponse.json({ error: "Thiếu dữ liệu file" }, { status: 400 });
    }

    // Định dạng chuỗi Base64 theo yêu cầu của Base64.ai
    const documentData = `data:${mimeType};base64,${pdfBase64}`;

    const response = await fetch("https://base64.ai/api/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `ApiKey ${process.env.BASE64_EMAIL}:${process.env.BASE64_API_KEY}`
      },
      body: JSON.stringify({
        document: documentData
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Lỗi khi gọi Base64.ai");
    }

    // Base64.ai trả về một mảng kết quả (thường là 1 phần tử cho 1 file)
    const data = result[0]?.fields;
    
    // Map dữ liệu từ Base64.ai về cấu trúc bạn mong muốn
    const mappedData = {
      vendorName: data?.companyName?.value || "",
      vendorAddress: data?.companyAddress?.value || "",
      invoiceNumber: data?.invoiceNumber?.value || "",
      invoiceDate: data?.date?.value || "",
      dueDate: data?.dueDate?.value || "",
      amount: parseFloat(data?.total?.value || 0),
      tax: data?.tax?.value || "",
      currency: data?.currency?.value || "",
      total: data?.total?.value || "",
      description: "Hóa đơn dịch vụ"
    };

    return NextResponse.json({ data: mappedData });

  } catch (error: any) {
    console.error("Lỗi Base64.ai:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}