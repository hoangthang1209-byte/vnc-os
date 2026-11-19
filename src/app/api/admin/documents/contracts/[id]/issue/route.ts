import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getAdminSessionFromRequest} from "@/lib/admin-auth/get-admin-session";
import {can} from "@/features/auth/admin-permissions";
import type {Prisma} from "@prisma/client";
export async function POST(req:NextRequest,ctx:{params:Promise<{id:string}>}){
 const session=getAdminSessionFromRequest(req);
 if(!session.authenticated)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!can(session,"orders.view_financials")||!can(session,"payments.manage"))return NextResponse.json({error:"Forbidden"},{status:403});
 const {id}=await ctx.params;
 try{
 const result=await prisma.$transaction(async tx=>{
  const c=await tx.vncCommercialContract.findUnique({where:{id}});
  if(!c)return {error:"Không tìm thấy hợp đồng.",status:404};
  if(c.status!=="DRAFT"||c.issuedSnapshot)return {error:"Hợp đồng không còn ở trạng thái bản nháp.",status:409};
  const seller=c.seller as Record<string,unknown>,buyer=c.buyer as Record<string,unknown>;
  if(!seller.name||!buyer.name)return {error:"Thiếu thông tin pháp nhân.",status:400};
  if(!seller.representative||!buyer.representative)return {error:"Cần nhập người đại diện ký hợp đồng của cả hai bên.",status:400};
  if(!c.legalEntityId)return {error:"Cần liên kết pháp nhân VNC trước khi phát hành.",status:400};
  const entity=await tx.vncLegalEntity.findUnique({where:{id:c.legalEntityId}});
  if(!entity?.isActive||seller.name!==entity.legalName)return {error:"Thông tin pháp nhân bên bán không khớp Cấu hình chung.",status:409};
  if(c.bankAccountId){
   const bank=await tx.vncBankAccount.findUnique({where:{id:c.bankAccountId}});
   if(!bank?.isActive||bank.legalEntityId!==entity.id||
      (bank.currency&&bank.currency!==c.currency)||
      bank.accountNo!==seller.accountNo||bank.bankName!==seller.bankName)
     return {error:"Tài khoản thanh toán không hợp lệ.",status:409};
  }
  if(!c.signedDate)return {error:"Cần nhập ngày ký trước khi phát hành.",status:400};
  const issuedAt=new Date();
  const snapshot={
   templateVersion:2,contractNo:c.contractNo,language:c.language,contractType:c.contractType,title:c.title,
   customerId:c.customerId,orderId:c.orderId,legalEntityId:c.legalEntityId,
   bankAccountId:c.bankAccountId,currency:c.currency,seller:c.seller,buyer:c.buyer,
   goods:c.goods,clauses:c.clauses,paymentTerms:c.paymentTerms,
   subtotal:c.subtotal,taxAmount:c.taxAmount,grandTotal:c.grandTotal,
   signedDate:c.signedDate.toISOString(),effectiveDate:c.effectiveDate?.toISOString()??null,
   deliveryDate:c.deliveryDate?.toISOString()??null,deliveryAddress:c.deliveryAddress,
   notes:c.notes,createdByName:c.createdByName,issuedAt:issuedAt.toISOString()
  };
  const updated=await tx.vncCommercialContract.updateMany({
   where:{id,status:"DRAFT"},
   data:{status:"ISSUED",issuedAt,issuedSnapshot:snapshot as Prisma.InputJsonValue}
  });
  if(updated.count!==1)throw new Error("Contract issuance conflict");
  return {id,contractNo:c.contractNo,status:"ISSUED"};
 });
 if("error" in result)return NextResponse.json({error:result.error},{status:typeof result.status==="number"?result.status:409});
 return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){console.error("[contract issue]",error);return NextResponse.json({error:"Không thể phát hành hợp đồng."},{status:500});}
}
