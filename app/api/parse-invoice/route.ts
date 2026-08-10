import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY chưa được cấu hình." },
      { status: 503 }
    );
  }

  let body: { pdfBase64?: string; mimeType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const { pdfBase64, mimeType = "application/pdf" } = body;

  if (!pdfBase64) {
    return NextResponse.json({ error: "Thiếu dữ liệu file." }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Xử lý logic ngày tháng ở backend để đưa text tĩnh vào prompt
    const currentDate = new Date();
    const nextMonthDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const formatDateString = (dateObj: Date) => {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      return `${year}/${month}/${day}`;
    };

    const prompt = `You are an expert invoice data extractor.
Analyze this invoice document or image and extract the following information.

Extract these fields:
* vendorName: Company or person name who issued the invoice (string)
* invoiceNumber: Invoice ID (string)
* invoiceDate: Date the invoice was issued (string in YYYY/MM/DD format)
* dueDate: Payment due date (string in YYYY/MM/DD format, if not found use invoiceDate plus 30 days)
* amount: Total amount to pay as a number (number, no currency symbols)
* description: Brief description of goods or services (string, max 100 chars, empty string if not found)

If a field cannot be determined, use these defaults:
* vendorName: ""
* invoiceNumber: ""
* invoiceDate: "${formatDateString(currentDate)}"
* dueDate: "${formatDateString(nextMonthDate)}"
* amount: 0
* description: ""`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: pdfBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text?.trim() ?? "{}";
    const extracted = JSON.parse(rawText);

    // Chuẩn hóa dữ liệu trước khi trả về client
    const result = {
      vendorName: String(extracted.vendorName || "").trim(),
      invoiceNumber: String(extracted.invoiceNumber || "").trim(),
      invoiceDate: String(extracted.invoiceDate || "").trim(),
      dueDate: String(extracted.dueDate || "").trim(),
      amount: Math.max(0, Number(extracted.amount) || 0),
      description: String(extracted.description || "").trim().slice(0, 200),
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Lỗi xử lý API:", error);

    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json(
        { error: "Đã vượt quá giới hạn lượt gọi API miễn phí. Vui lòng thử lại sau." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Không thể trích xuất dữ liệu từ file này." },
      { status: 500 }
    );
  }
}