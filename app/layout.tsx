import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/**
 * Font Inter - Font phổ biến nhất cho B2B SaaS dashboards
 * Dễ đọc, chuyên nghiệp, tối ưu cho data-dense UI
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * SEO Metadata cho toàn bộ app
 */
export const metadata: Metadata = {
  title: "BILL - Financial Management",
  description:
    "B2B financial management platform for invoices, payables, and receivables.",
};

/**
 * Root Layout
 * - Chỉ chứa html + body wrapper
 * - Dashboard layout (sidebar + header) nằm ở route group (dashboard)
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
