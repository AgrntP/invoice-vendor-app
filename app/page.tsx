import { redirect } from "next/navigation";

/**
 * Root page - Redirect đến trang Payables
 * Trang chính sẽ tự động chuyển hướng user đến dashboard payables
 */
export default function Home() {
  redirect("/dashboard");
}
