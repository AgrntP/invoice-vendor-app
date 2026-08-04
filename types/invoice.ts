/**
 * Các trạng thái có thể có của hóa đơn
 * - draft: Bản nháp, chưa gửi
 * - pending: Đang chờ duyệt
 * - approved: Đã được duyệt, chưa thanh toán
 * - paid: Đã thanh toán
 * - overdue: Quá hạn thanh toán
 */
export type InvoiceStatus = "draft" | "pending" | "approved" | "paid" | "overdue";

/**
 * Interface chính cho một hóa đơn phải trả (Accounts Payable)
 */
export interface Invoice {
  id: string;
  vendorName: string;       // Tên nhà cung cấp
  invoiceNumber: string;    // Số hóa đơn (VD: INV-2024-001)
  invoiceDate: string;      // Ngày tạo hóa đơn (ISO string)
  dueDate: string;          // Ngày đến hạn thanh toán (ISO string)
  amount: number;           // Số tiền (USD)
  status: InvoiceStatus;    // Trạng thái hiện tại
  description?: string;     // Mô tả (tùy chọn)
}

/**
 * Cấu hình hiển thị cho từng status badge
 */
export interface StatusConfig {
  label: string;
  variant: "default" | "success" | "warning" | "destructive" | "secondary" | "info";
}

/**
 * Map status -> cấu hình hiển thị
 */
export const STATUS_CONFIG: Record<InvoiceStatus, StatusConfig> = {
  draft:    { label: "Draft",    variant: "secondary" },
  pending:  { label: "Pending",  variant: "warning" },
  approved: { label: "Approved", variant: "info" },
  paid:     { label: "Paid",     variant: "success" },
  overdue:  { label: "Overdue",  variant: "destructive" },
};
