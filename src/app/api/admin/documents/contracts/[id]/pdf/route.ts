import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getAdminSessionFromRequest} from "@/lib/admin-auth/get-admin-session";
import {can} from "@/features/auth/admin-permissions";
import {renderContractPdf} from "@/features/documents/contract-pdf";
export const runtime="nodejs";
export async function GET(req:NextRequest,ctx:{params:Promise<{id:string}>}){
 const session=getAdminSessionFromRequest(req);
 if(!session.authenticated)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!can(session,"orders.view_financials"))return NextResponse.json({error:"Forbidden"},{status:403});
 const {id}=await ctx.params;
 try{
  const c=await prisma.vncCommercialContract.findUnique({where:{id}});
  if(!c)return NextResponse.json({error:"Not found"},{status:404});
  if(c.status!=="DRAFT"&&c.status!=="ISSUED")return NextResponse.json({error:"Trạng thái không hợp lệ."},{status:409});
  if(c.status==="ISSUED"&&!c.issuedSnapshot)return NextResponse.json({error:"Hợp đồng phát hành thiếu snapshot."},{status:409});
  const data=(c.status==="ISSUED"?c.issuedSnapshot:{
   contractNo:c.contractNo,language:c.language,title:c.title,seller:c.seller,buyer:c.buyer,
   goods:c.goods,clauses:c.clauses,paymentTerms:c.paymentTerms,
   currency:c.currency,subtotal:c.subtotal,taxAmount:c.taxAmount,grandTotal:c.grandTotal,
   signedDate:c.signedDate?.toISOString()??null,effectiveDate:c.effectiveDate?.toISOString()??null,
   deliveryDate:c.deliveryDate?.toISOString()??null,deliveryAddress:c.deliveryAddress,notes:c.notes
  }) as Record<string,unknown>;
  const d=(v:unknown)=>typeof v==="string"&&v?new Date(v):null;
  const pdf=await renderContractPdf({
   contractNo:String(data.contractNo),language:String(data.language),status:c.status,title:String(data.title),
   seller:data.seller,buyer:data.buyer,goods:data.goods,clauses:data.clauses,paymentTerms:data.paymentTerms,
   currency:String(data.currency),subtotal:String(data.subtotal),taxAmount:String(data.taxAmount),grandTotal:String(data.grandTotal),
   signedDate:d(data.signedDate),effectiveDate:d(data.effectiveDate),deliveryDate:d(data.deliveryDate),
   deliveryAddress:typeof data.deliveryAddress==="string"?data.deliveryAddress:null,
   notes:typeof data.notes==="string"?data.notes:null
  });
  const safeNo=c.contractNo.replace(/[^a-zA-Z0-9-]/g,"").slice(0,80);
  return new NextResponse(new Uint8Array(pdf),{headers:{
   "Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${c.status==="DRAFT"?"draft-":""}contract-${safeNo}.pdf"`,
   "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"
  }});
 }catch(error){console.error("[contract pdf]",error);return NextResponse.json({error:"Không thể xuất PDF hợp đồng."},{status:500});}
}
