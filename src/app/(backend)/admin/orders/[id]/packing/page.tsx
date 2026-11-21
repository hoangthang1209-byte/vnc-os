import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { canAccessOrderRecord } from "@/features/auth/order-scope";
import OrderPackingWorkspace from "@/components/admin/orders/OrderPackingWorkspace";

export const dynamic = "force-dynamic";
export default async function OrderPackingPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const session=await getAdminSessionFromCookies();
  const order=await prisma.order.findUnique({where:{id},select:{
    id:true,orderNo:true,salesEmployeeId:true,productionOwnerId:true,deliveryOwnerId:true,
    items:{orderBy:{sortOrder:"asc"},select:{id:true,skuSnapshot:true,productNameSnapshot:true,
      variants:{select:{id:true,sizeValue:true}}}},
  }});
  if(!order || !canAccessOrderRecord(session,order,"orders.view")) {
    return <main className="p-8"><h1>Không có quyền xem Packing của đơn hàng</h1><Link href="/admin/orders">Về danh sách</Link></main>;
  }
  return <main style={{display:"grid",gap:12}}>
    <div><Link href={`/admin/orders/${encodeURIComponent(id)}`} className="admin-link">← Quay lại đơn {order.orderNo}</Link></div>
    <OrderPackingWorkspace orderId={id} items={order.items.map(i=>({
      id:i.id,sku:i.skuSnapshot??i.id,name:i.productNameSnapshot??"Sản phẩm",
      variants:i.variants.map(v=>({id:v.id,size:v.sizeValue??"—"})),
    }))}/>
  </main>;
}
