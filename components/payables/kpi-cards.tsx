"use client";

import { cn } from "@/lib/utils";
import {
  DollarSign,
  Clock,
  CalendarCheck,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

/**
 * Dữ liệu cho 4 thẻ KPI
 * Mỗi thẻ hiển thị: icon, tiêu đề, giá trị chính, trend (tăng/giảm)
 */
const kpiData = [
  {
    id: "total-unpaid",
    title: "Total Unpaid",
    value: "$125,430.00",
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
    iconBg: "bg-red-50",
    iconColor: "text-status-overdue",
    description: "vs last month",
  },
  {
    id: "pending-approval",
    title: "Pending Approval",
    value: "12",
    change: "-3",
    trend: "down" as const,
    icon: Clock,
    iconBg: "bg-amber-50",
    iconColor: "text-status-pending",
    description: "invoices waiting",
  },
  {
    id: "scheduled-payments",
    title: "Scheduled Payments",
    value: "8",
    change: "+2",
    trend: "up" as const,
    icon: CalendarCheck,
    iconBg: "bg-blue-50",
    iconColor: "text-status-approved",
    description: "upcoming this week",
  },
  {
    id: "paid-this-month",
    title: "Paid This Month",
    value: "$48,230.00",
    change: "+8.3%",
    trend: "up" as const,
    icon: CheckCircle,
    iconBg: "bg-green-50",
    iconColor: "text-status-paid",
    description: "vs last month",
  },
];

/**
 * KPICards component - 4 thẻ tóm tắt KPI
 *
 * Tính năng:
 * - Icon với background màu tương ứng
 * - Giá trị lớn nổi bật
 * - Trend indicator (lên/xuống + phần trăm)
 * - Hover effect: shadow + scale nhẹ
 * - Animation: fade-in staggered
 * - Responsive: 4 col desktop, 2 tablet, 1 mobile
 */
export function KPICards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpiData.map((kpi, index) => (
        <div
          key={kpi.id}
          className="group rounded-xl border border-border-default bg-white p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between">
            {/* Icon */}
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110",
                kpi.iconBg
              )}
            >
              <kpi.icon className={cn("h-5 w-5", kpi.iconColor)} />
            </div>

            {/* Trend indicator */}
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                kpi.trend === "up"
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-500"
              )}
            >
              {kpi.trend === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {kpi.change}
            </div>
          </div>

          {/* Value */}
          <div className="mt-4">
            <p className="text-2xl font-bold tracking-tight text-text-primary animate-count-up">
              {kpi.value}
            </p>
            <p className="mt-1 text-sm text-text-secondary">{kpi.title}</p>
          </div>

          {/* Description */}
          <p className="mt-2 text-xs text-text-muted">{kpi.description}</p>
        </div>
      ))}
    </div>
  );
}
