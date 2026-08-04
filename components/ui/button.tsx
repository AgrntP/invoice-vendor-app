"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

/**
 * Button component - Nút bấm với nhiều biến thể
 * Phong cách BILL Green cho primary, outline/ghost cho secondary actions
 */
const buttonVariants = cva(
  /* Base styles */
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bill-green focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        /* Nút chính - BILL Green */
        default:
          "bg-bill-green text-white shadow-sm hover:bg-bill-green-dark active:scale-[0.98]",
        /* Nút viền */
        outline:
          "border border-border-default bg-white text-text-primary hover:bg-bg-hover active:scale-[0.98]",
        /* Nút trong suốt */
        ghost:
          "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
        /* Nút phụ */
        secondary:
          "bg-gray-100 text-text-primary hover:bg-gray-200 active:scale-[0.98]",
        /* Nút nguy hiểm */
        destructive:
          "bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
