import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn() - Kết hợp clsx + tailwind-merge
 * Cho phép merge Tailwind classes thông minh, tránh conflict
 * Ví dụ: cn("px-4 py-2", conditional && "bg-green-500", "px-6") => "py-2 px-6 bg-green-500"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format số tiền theo USD currency
 * Ví dụ: formatCurrency(1234.5) => "$1,234.50"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format ngày tháng theo dạng "MMM dd, yyyy"
 * Ví dụ: formatDate("2024-01-15") => "Jan 15, 2024"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Kiểm tra ngày có quá hạn không
 */
export function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}
