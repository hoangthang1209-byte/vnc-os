import AdminPageTitle from "@/components/admin/AdminPageTitle";
import QuickOrderForm from "@/components/admin/orders/QuickOrderForm";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";

export default async function QuickOrderPage() {
  const session = await getAdminSessionFromCookies();
  if (!can(session, "orders.create")) return <main className="admin-panel" role="alert"><h1>Không có quyền tạo đơn hàng</h1><p>Tài khoản hiện tại không được phép tạo đơn. Vui lòng liên hệ quản trị viên.</p></main>;
  return (
    <>
      <AdminPageTitle title="Nhập đơn nhanh dạng bảng" />
      <QuickOrderForm />
    </>
  );
}
