import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";

export async function GET(request:NextRequest){
 const session=getAdminSessionFromRequest(request);
 if(!session.authenticated)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!can(session,"orders.view_financials")||!can(session,"quotes.create"))return NextResponse.json({error:"Forbidden"},{status:403});
 try{
  const employees=await prisma.employee.findMany({
   where:{isActive:true},
   select:{id:true,fullName:true,jobTitle:true,role:true},
   orderBy:{fullName:"asc"},take:200
  });
  return NextResponse.json({employees},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){console.error("[invoice sales accounts]",error);return NextResponse.json({error:"Không thể tải danh sách nhân viên."},{status:503});}
}
