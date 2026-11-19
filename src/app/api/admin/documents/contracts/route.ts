import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getAdminSessionFromRequest} from "@/lib/admin-auth/get-admin-session";
import {can} from "@/features/auth/admin-permissions";
import {parseContractBody} from "@/features/documents/contract-fields";
import type {Prisma} from "@prisma/client";
const send=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
function authorize(req:NextRequest,write=false){
 const s=getAdminSessionFromRequest(req);
 if(!s.authenticated)return {error:send({error:"Unauthorized"},401),session:s};
 if(!can(s,"orders.view_financials")||(write&&!can(s,"quotes.create")))return {error:send({error:"Forbidden"},403),session:s};
 return {error:null,session:s};
}
export async function GET(request:NextRequest){
 const a=authorize(request);if(a.error)return a.error;
 try{
 const [contracts,entities,customers]=await Promise.all([
 prisma.vncCommercialContract.findMany({orderBy:{createdAt:"desc"},take:100,
  select:{id:true,contractNo:true,status:true,language:true,title:true,currency:true,grandTotal:true,
   createdAt:true,issuedAt:true,customerId:true,orderId:true,buyer:true}}),
 prisma.vncLegalEntity.findMany({where:{isActive:true},select:{id:true,legalName:true,address:true,taxCode:true},take:100}),
 prisma.customer.findMany({select:{id:true,name:true,legalName:true,address:true,taxCode:true,representativeName:true,representativeTitle:true},take:200,orderBy:{name:"asc"}}),
 ]);
 return send({contracts,entities,customers});
 }catch(error){console.error("[contracts list]",error);return send({error:"Không tải được danh sách hợp đồng."},503);}
}
export async function POST(request:NextRequest){
 const a=authorize(request,true);if(a.error)return a.error;
 try{
 const input=await request.json();
 const parsed=parseContractBody(input);
 if(parsed.legalEntityId){
  const entity=await prisma.vncLegalEntity.findUnique({where:{id:parsed.legalEntityId}});
  if(!entity?.isActive||parsed.seller.name!==entity.legalName) return send({error:"Pháp nhân phát hành không còn hợp lệ."},400);
 }
 if(parsed.customerId&&!await prisma.customer.findUnique({where:{id:parsed.customerId},select:{id:true}}))return send({error:"Khách hàng không tồn tại."},400);
 if(parsed.orderId){
  if(!can(a.session,"orders.view"))return send({error:"Forbidden"},403);
  const order=await prisma.order.findUnique({where:{id:parsed.orderId},select:{customerId:true}});
  if(!order || (order.customerId&&parsed.customerId&&order.customerId!==parsed.customerId))return send({error:"Đơn hàng không tồn tại hoặc sai khách hàng."},400);
 }
 const now=new Date();const y=now.getUTCFullYear(),m=String(now.getUTCMonth()+1).padStart(2,"0");const prefix=`CT-${y}-${m}-`;
 const contract=await prisma.$transaction(async tx=>{
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${"vnc-contract-"+prefix}))`;
  const existing=await tx.vncCommercialContract.findMany({where:{contractNo:{startsWith:prefix}},select:{contractNo:true}});
  const highest=existing.reduce((max,x)=>Math.max(max,Number(x.contractNo.slice(prefix.length))||0),0);
  const contractNo=prefix+String(highest+1).padStart(4,"0");
  return tx.vncCommercialContract.create({data:{
   contractNo,status:"DRAFT",language:parsed.language,contractType:parsed.contractType,title:parsed.title,
   customerId:parsed.customerId,orderId:parsed.orderId,legalEntityId:parsed.legalEntityId,bankAccountId:parsed.bankAccountId,
   currency:parsed.currency,seller:parsed.seller as unknown as Prisma.InputJsonValue,
   buyer:parsed.buyer as unknown as Prisma.InputJsonValue,goods:parsed.goods as unknown as Prisma.InputJsonValue,
   clauses:parsed.clauses as unknown as Prisma.InputJsonValue,paymentTerms:parsed.paymentTerms as unknown as Prisma.InputJsonValue,
   subtotal:parsed.subtotal,taxAmount:parsed.taxAmount,grandTotal:parsed.grandTotal,
   signedDate:parsed.signedDate,effectiveDate:parsed.effectiveDate,deliveryDate:parsed.deliveryDate,
   deliveryAddress:parsed.deliveryAddress,notes:parsed.notes,createdByUserId:a.session.userId,
   createdByName:a.session.username||"VNC Admin"
  }});
 },{maxWait:5000,timeout:15000});
 return send({id:contract.id,contractNo:contract.contractNo,status:"DRAFT"},201);
 }catch(error){
  if(typeof error==="object"&&error&&"code" in error&&error.code==="P2002")return send({error:"Trùng số hợp đồng, vui lòng thử lại."},409);
  if(error instanceof Error&&/không hợp lệ|Thiếu|Cần|tỷ lệ|Ngày|điều khoản|Tổng/.test(error.message))return send({error:error.message},400);
  console.error("[contracts create]",error);return send({error:"Không thể tạo hợp đồng."},500);
 }
}
