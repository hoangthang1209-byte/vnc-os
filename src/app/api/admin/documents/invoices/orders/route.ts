import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";

export async function GET(request:NextRequest){
 const session=getAdminSessionFromRequest(request);
 if(!session.authenticated)return NextResponse.json({error:"Bạn cần đăng nhập."},{status:401});
 if(!can(session,"orders.view")||!can(session,"orders.view_financials")){
  return NextResponse.json({error:"Bạn chưa có quyền xem đơn hàng và thông tin tài chính."},{status:403});
 }
 const query=request.nextUrl.searchParams.get("q")?.trim().slice(0,100)??"";
 if(query.length<2)return NextResponse.json({orders:[]});
 try{
  const orders=await prisma.order.findMany({
   where:{OR:[
    {orderNo:{contains:query,mode:"insensitive"}},
    {customerPoNo:{contains:query,mode:"insensitive"}},
    {customerCompanyName:{contains:query,mode:"insensitive"}},
    {customerNameSnapshot:{contains:query,mode:"insensitive"}},
    {customer:{is:{name:{contains:query,mode:"insensitive"}}}},
   ]},
   orderBy:{createdAt:"desc"},take:20,
   select:{id:true,orderNo:true,customerPoNo:true,customerId:true,currency:true,
    customerCompanyName:true,customerNameSnapshot:true,customerLegalNameSnapshot:true,
    customerAddress:true,customerEmailSnapshot:true,
    salesName:true,salesEmployeeId:true,salesEmployee:{select:{fullName:true}},salesRepresentative:{select:{fullName:true,employeeId:true}},
    customer:{select:{id:true,name:true,legalName:true,email:true,address:true}}},
  });
  return NextResponse.json({orders},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){console.error("[invoice order lookup]",error);return NextResponse.json({error:"Không thể tải đơn hàng."},{status:503});}
}
