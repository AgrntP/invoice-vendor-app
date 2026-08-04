import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * Badge component - Hiển thị status badges với các biến thể màu sắc
 * Sử dụng class-variance-authority (CVA) để quản lý variants
 */
const badgeVariants = cva(
  /* Base styles cho tất cả badges */
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-gray-100 text-gray-700",
        success:
          "bg-status-paid-bg text-status-paid",
        warning:
          "bg-status-pending-bg text-status-pending",
        destructive:
          "bg-status-overdue-bg text-status-overdue",
        secondary:
          "bg-status-draft-bg text-status-draft",
        info:
          "bg-status-approved-bg text-status-approved",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
