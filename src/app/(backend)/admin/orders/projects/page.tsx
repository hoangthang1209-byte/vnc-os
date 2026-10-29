import Link from "next/link";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { isOwnerLikeSession } from "@/features/auth/admin-permissions";
import OrderProjectManager from "@/components/admin/orders/projects/OrderProjectManager";

export default async function OrderProjectsPage() {
  const session = await getAdminSessionFromCookies();
  if (!isOwnerLikeSession(session)) return <main><h1>Dự án đơn hàng</h1><p>Chỉ Owner được truy cập màn hình này trong giai đoạn đầu.</p><Link href="/admin/orders">Quay lại Đơn hàng</Link></main>;
  return <OrderProjectManager />;
}
