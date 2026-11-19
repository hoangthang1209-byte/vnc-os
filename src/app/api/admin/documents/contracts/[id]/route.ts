import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getAdminSessionFromRequest} from "@/lib/admin-auth/get-admin-session";
import {can} from "@/features/auth/admin-permissions";
import {parseContractBody} from "@/features/documents/contract-fields";
import type {Prisma} from "@prisma/client";
type Context={params:Promise<{id:string}>};
export async function GET(req:NextRequest,ctx:Context){
 const session=getAdminSessionFromRequest(req);
 if(!session.authenticated)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!can(session,"orders.view_financials"))return NextResponse.json({error:"Forbidden"},{status:403});
 const {id}=await ctx.params;
 const contract=await prisma.vncCommercialContract.findUnique({where:{id}});
 if(!contract)return NextResponse.json({error:"Not found"},{status:404});
 return NextResponse.json({contract},{headers:{"Cache-Control":"private, no-store"}});
}
export async function PATCH(req:NextRequest,ctx:Context){
 const session=getAdminSessionFromRequest(req);
 if(!session.authenticated)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!can(session,"orders.view_financials")||!can(session,"quotes.create"))return NextResponse.json({error:"Forbidden"},{status:403});
 const {id}=await ctx.params;
 try{
 const previous=await prisma.vncCommercialContract.findUnique({where:{id}});
 if(!previous)return NextResponse.json({error:"Not found"},{status:404});
 if(previous.status!=="DRAFT"||previous.issuedSnapshot)return NextResponse.json({error:"Hợp đồng đã phát hành không thể chỉnh sửa."},{status:409});
 const data=parseContractBody(await req.json());
 if(data.legalEntityId){
 const e=await prisma.vncLegalEntity.findUnique({where:{id:data.legalEntityId}});
 if(!e?.isActive||e.legalName!==data.seller.name)return NextResponse.json({error:"Pháp nhân không hợp lệ."},{status:400});
 }
 if(data.bankAccountId){
  const bank=await prisma.vncBankAccount.findUnique({where:{id:data.bankAccountId}});
  if(!bank?.isActive||bank.legalEntityId!==data.legalEntityId||
     (bank.currency&&bank.currency!==data.currency)||
     bank.accountNo!==data.seller.accountNo||bank.bankName!==data.seller.bankName||
     bank.accountName!==data.seller.accountName)
   return NextResponse.json({error:"Tài khoản ngân hàng không hợp lệ hoặc thông tin nhận tiền bị chỉnh sửa."},{status:400});
 }
 if(data.customerId&&!await prisma.customer.findUnique({where:{id:data.customerId},select:{id:true}}))return NextResponse.json({error:"Khách hàng không hợp lệ."},{status:400});
 if(data.orderId){
  if(!can(session,"orders.view"))return NextResponse.json({error:"Forbidden"},{status:403});
  const order=await prisma.order.findUnique({where:{id:data.orderId},select:{customerId:true}});
  if(!order||(order.customerId&&data.customerId&&order.customerId!==data.customerId))return NextResponse.json({error:"Đơn hàng không hợp lệ."},{status:400});
 }
 const changed=await prisma.vncCommercialContract.updateMany({where:{id,status:"DRAFT",issuedSnapshot:null},data:{
 language:data.language,title:data.title,currency:data.currency,customerId:data.customerId,orderId:data.orderId,
 legalEntityId:data.legalEntityId,bankAccountId:data.bankAccountId,
 seller:data.seller as unknown as Prisma.InputJsonValue,buyer:data.buyer as unknown as Prisma.InputJsonValue,
 goods:data.goods as unknown as Prisma.InputJsonValue,clauses:data.clauses as unknown as Prisma.InputJsonValue,
 paymentTerms:data.paymentTerms as unknown as Prisma.InputJsonValue,subtotal:data.subtotal,
 taxAmount:data.taxAmount,grandTotal:data.grandTotal,signedDate:data.signedDate,
 effectiveDate:data.effectiveDate,deliveryDate:data.deliveryDate,deliveryAddress:data.deliveryAddress,notes:data.notes
 }});
 if(changed.count!==1)return NextResponse.json({error:"Bản nháp đã được phát hành."},{status:409});
 return NextResponse.json({id,contractNo:previous.contractNo,status:"DRAFT"});
 }catch(error){
 if(error instanceof Error&&/không hợp lệ|Thiếu|Cần|tỷ lệ|Ngày|điều khoản|Tổng/.test(error.message))return NextResponse.json({error:error.message},{status:400});
 console.error("[contract update]",error);return NextResponse.json({error:"Không thể cập nhật hợp đồng."},{status:500});
 }
}
