import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";
import { createCustomer } from "@/features/crm/services/crm-customer.service";

function guard(request:NextRequest,action:"view"|"create"){
 const session=getAdminSessionFromRequest(request);
 if(!session.authenticated)return NextResponse.json({error:"Bạn cần đăng nhập."},{status:401});
 if(!can(session,"orders.view_financials")||!can(session,action==="view"?"customers.view":"customers.create")){
  return NextResponse.json({error:"Bạn chưa có quyền "+(action==="view"?"xem":"tạo")+" khách hàng CRM."},{status:403});
 }
 return null;
}
const text=(value:unknown,max=250)=>typeof value==="string"?value.trim().slice(0,max):"";

export async function GET(request:NextRequest){
 const forbidden=guard(request,"view");if(forbidden)return forbidden;
 const query=request.nextUrl.searchParams.get("q")?.trim().slice(0,100)??"";
 if(query.length<2)return NextResponse.json({customers:[]});
 const customers=await prisma.customer.findMany({
  where:{OR:[{name:{contains:query,mode:"insensitive"}},{legalName:{contains:query,mode:"insensitive"}},{code:{contains:query,mode:"insensitive"}},{email:{contains:query,mode:"insensitive"}}]},
  select:{id:true,code:true,name:true,legalName:true,address:true,addressLine1:true,addressLine2:true,email:true,taxCode:true},
  orderBy:{name:"asc"},take:15,
 });
 return NextResponse.json({customers},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(request:NextRequest){
 const forbidden=guard(request,"create");if(forbidden)return forbidden;
 let raw:unknown;
 try{raw=await request.json();}catch{return NextResponse.json({error:"JSON không hợp lệ."},{status:400});}
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return NextResponse.json({error:"Thông tin khách hàng không hợp lệ."},{status:400});
 const data=raw as Record<string,unknown>;
 const name=text(data.name);
 if(name.length<2)return NextResponse.json({error:"Tên khách hàng cần tối thiểu 2 ký tự."},{status:400});
 const email=text(data.email);
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return NextResponse.json({error:"Email không hợp lệ."},{status:400});
 try{
  const customer=await createCustomer({name,legalName:text(data.legalName)||null,address:text(data.address,1000)||null,email:email||null,legacyType:"BUSINESS"});
  if(!customer)return NextResponse.json({error:"Không tạo được khách hàng."},{status:500});
  return NextResponse.json({customer:{id:customer.id,code:customer.code,name:customer.name,legalName:customer.legalName,address:customer.address,email:customer.email}},{status:201});
 }catch(error){
  const message=error instanceof Error?error.message:"Không tạo được khách hàng.";
  return NextResponse.json({error:message},{status:/đã tồn tại/.test(message)?409:400});
 }
}
