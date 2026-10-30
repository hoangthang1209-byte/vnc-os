import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";
import { renderInvoicePdf } from "@/features/documents/invoice-pdf";
export async function GET(request:NextRequest, context:{params:Promise<{id:string}>}) {
  const session=getAdminSessionFromRequest(request);
  if (!session.authenticated) return NextResponse.json({error:"Unauthorized"},{status:401});
  if (!can(session,"documents.view")) return NextResponse.json({error:"Forbidden"},{status:403});
  const {id}=await context.params;
  const invoice=await prisma.customPaymentInvoice.findUnique({where:{id}});
  if(!invoice)return NextResponse.json({error:"Not found"},{status:404});
  const bytes=await renderInvoicePdf(invoice);
  return new NextResponse(new Uint8Array(bytes),{headers:{"Content-Type":"application/pdf","Content-Disposition":'attachment; filename="invoice.pdf"',"Cache-Control":"private, no-store"}});
}
