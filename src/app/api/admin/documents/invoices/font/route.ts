import { NextRequest, NextResponse } from "next/server";
import { loadInvoiceInterFont } from "@/features/documents/inter-font";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";

export const runtime="nodejs";
export async function GET(request:NextRequest){
 const session=getAdminSessionFromRequest(request);
 if(!session.authenticated)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!can(session,"orders.view_financials"))return NextResponse.json({error:"Forbidden"},{status:403});
 const font=await loadInvoiceInterFont();
 return new NextResponse(new Uint8Array(font),{
  headers:{
   "Content-Type":"font/ttf",
   "Cache-Control":"private, max-age=86400",
   "X-Content-Type-Options":"nosniff",
  }
 });
}
