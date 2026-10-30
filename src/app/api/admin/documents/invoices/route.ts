import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { can } from "@/features/auth/admin-permissions";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { calculateCustomInvoice, formatMinor, type InvoiceCurrency, type InvoiceLine } from "@/features/documents/custom-invoice-calculation";

export async function POST(request:NextRequest) {
  const session=getAdminSessionFromRequest(request);
  if (!session.authenticated) return NextResponse.json({error:"Unauthorized"},{status:401});
  if (!can(session,"documents.create")) return NextResponse.json({error:"Forbidden"},{status:403});
  try {
    const data=await request.json();
    const currency=data.currency as InvoiceCurrency;
    if (!["USD","VND","EUR"].includes(currency)) throw new Error("Currency invalid");
    const lines=data.lines as InvoiceLine[];
    const adjustments={discount:String(data.discount ?? "0"),extraCharge:String(data.extraCharge ?? "0"),tax:String(data.tax ?? "0")};
    const totals=calculateCustomInvoice({currency,lines,...adjustments});
    const invoice=await prisma.customPaymentInvoice.create({data:{
      invoiceNo:String(data.invoiceNo),currency,recipientName:String(data.recipientName),issuerName:String(data.issuerName),
      lines,adjustments,subtotal:formatMinor(totals.subtotalMinor,currency),total:formatMinor(totals.totalMinor,currency),
      issueDate:new Date(data.issueDate),notes:data.notes ? String(data.notes):null
    }});
    return NextResponse.json({id:invoice.id},{status:201});
  } catch(error) {console.error("[invoice create]",error);return NextResponse.json({error:"Invalid invoice or database unavailable"},{status:400});}
}
export async function GET(request:NextRequest) {
  const session=getAdminSessionFromRequest(request);
  if (!session.authenticated) return NextResponse.json({error:"Unauthorized"},{status:401});
  if (!can(session,"documents.view")) return NextResponse.json({error:"Forbidden"},{status:403});
  return NextResponse.json({invoices:await prisma.customPaymentInvoice.findMany({take:100,orderBy:{createdAt:"desc"}})});
}
