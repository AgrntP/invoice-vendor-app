"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

/**
 * DropdownMenu - Menu xổ xuống đơn giản
 * Sử dụng state-driven approach, không cần Radix UI
 * Tự đóng khi click ngoài hoặc nhấn Escape
 */

interface DropdownMenuProps {
  trigger: React.ReactNode;        // Nút trigger (thường là icon 3 chấm)
  children: React.ReactNode;       // Nội dung menu
  align?: "left" | "right";        // Căn chỉnh menu
  className?: string;
}

export function DropdownMenu({
  trigger,
  children,
  align = "right",
  className,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    // Đóng menu khi nhấn Escape
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Trigger button */}
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {/* Dropdown content */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1 min-w-[160px] rounded-lg border border-border-default bg-white py-1 shadow-lg animate-fade-in",
            align === "right" ? "right-0" : "left-0",
            className
          )}
        >
          <div onClick={() => setIsOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  );
}

/**
 * DropdownMenuItem - Một item trong dropdown menu
 */
interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  destructive?: boolean;           // Hiển thị màu đỏ cho action nguy hiểm
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
  destructive = false,
}: DropdownMenuItemProps) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer",
        destructive
          ? "text-red-600 hover:bg-red-50"
          : "text-text-primary hover:bg-bg-hover",
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/**
 * DropdownMenuSeparator - Đường phân cách
 */
export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-border-default" />;
}
