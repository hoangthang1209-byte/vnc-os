import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";
const str=(x:unknown,max=500)=>typeof x==="string"?x.trim().slice(0,max):"";
const forbidden=(request:NextRequest,write=false)=>{
 const session=getAdminSessionFromRequest(request);
 if(!session.authenticated)return NextResponse.json({error:"Bạn cần đăng nhập."},{status:401});
 if(!can(session,"orders.view_financials")||(write&&!can(session,"payments.manage")))return NextResponse.json({error:"Bạn không có quyền quản lý thông tin pháp nhân và ngân hàng."},{status:403});
 return null;
};
function parse(request:NextRequest){return request.json() as Promise<Record<string,unknown>>;}
const response=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(request:NextRequest){
 const no=forbidden(request);if(no)return no;
 const legalEntities=await prisma.vncLegalEntity.findMany({
  include:{bankAccounts:{orderBy:[{isDefault:"desc"},{createdAt:"asc"}]}},
  orderBy:[{isDefault:"desc"},{createdAt:"asc"}],take:100,
 });
 return response({legalEntities});
}
export async function POST(request:NextRequest){
 const no=forbidden(request,true);if(no)return no;
 let data:Record<string,unknown>;
 try{data=await parse(request);}catch{return response({error:"Dữ liệu không hợp lệ."},400);}
 try{
  if(data.kind==="entity"){
   const legalName=str(data.legalName,250),code=str(data.code,40).toUpperCase();
   if(!legalName||!code)return response({error:"Thiếu mã hoặc tên pháp nhân."},400);
   const entity=await prisma.vncLegalEntity.create({data:{
    code,legalName,address:str(data.address,1500)||null,taxCode:str(data.taxCode,100)||null,
    email:str(data.email,250)||null,phone:str(data.phone,100)||null,
    isActive:true,isDefault:false,
   }});
   return response({entity},201);
  }
  if(data.kind==="bank"){
   const legalEntityId=str(data.legalEntityId,100);
   const legalEntity=await prisma.vncLegalEntity.findUnique({where:{id:legalEntityId},select:{id:true}});
   if(!legalEntity)return response({error:"Pháp nhân không tồn tại."},400);
   const bankName=str(data.bankName,250),accountName=str(data.accountName,350),accountNo=str(data.accountNo,100);
   if(!bankName||!accountName||!accountNo)return response({error:"Thiếu ngân hàng, chủ tài khoản hoặc số tài khoản."},400);
   const swift=str(data.swift,30).toUpperCase();
   if(swift&&!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(swift))return response({error:"SWIFT/BIC không hợp lệ."},400);
   const account=await prisma.vncBankAccount.create({data:{
    legalEntityId,bankName,accountName,accountNo,accountAddress:str(data.accountAddress,1500)||null,
    bankAddress:str(data.bankAddress,1500)||null,branch:str(data.branch,200)||null,
    swift:swift||null,currency:str(data.currency,3).toUpperCase()||null,isActive:true,isDefault:false
   }});
   return response({account},201);
  }
  return response({error:"Loại dữ liệu không hợp lệ."},400);
 }catch(e){const error=e as {code?:string};return response({error:error?.code==="P2002"?"Mã pháp nhân đã tồn tại.":"Không thể tạo dữ liệu; kiểm tra thông tin."},error?.code==="P2002"?409:500);}
}
export async function PATCH(request:NextRequest){
 const no=forbidden(request,true);if(no)return no;
 let data:Record<string,unknown>;
 try{data=await parse(request);}catch{return response({error:"Dữ liệu không hợp lệ."},400);}
 const id=str(data.id,100);if(!id)return response({error:"Thiếu ID."},400);
 try{
  if(data.kind==="entity"){
   const entity=await prisma.vncLegalEntity.update({where:{id},data:{
    legalName:str(data.legalName,250)||undefined,address:str(data.address,1500)||null,
    taxCode:str(data.taxCode,100)||null,email:str(data.email,250)||null,
    phone:str(data.phone,100)||null,isActive:data.isActive!==false,
   }});return response({entity});
  }
  if(data.kind==="bank"){
   const bankName=str(data.bankName,250),accountName=str(data.accountName,350),accountNo=str(data.accountNo,100);
   if(!bankName||!accountName||!accountNo)return response({error:"Thiếu thông tin bắt buộc của tài khoản."},400);
   const swift=str(data.swift,30).toUpperCase();
   if(swift&&!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(swift))return response({error:"SWIFT/BIC không hợp lệ."},400);
   const account=await prisma.vncBankAccount.update({where:{id},data:{
    bankName,accountName,accountNo,accountAddress:str(data.accountAddress,1500)||null,
    bankAddress:str(data.bankAddress,1500)||null,branch:str(data.branch,200)||null,
    currency:str(data.currency,3).toUpperCase()||null,swift:swift||null,isActive:data.isActive!==false,
   }});return response({account});
  }
  return response({error:"Loại dữ liệu không hợp lệ."},400);
 }catch{return response({error:"Không thể cập nhật bản ghi."},500);}
}
