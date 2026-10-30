import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";
import { renderInvoicePdf } from "@/features/documents/invoice-pdf";

export async function GET(request:NextRequest, context:{params:Promise<{id:string}>}) {
  const session=getAdminSessionFromRequest(request);
  if(!session.authenticated)return NextResponse.json({error:"Unauthorized"},{status:401});
  if(!can(session,"documents.export"))return NextResponse.json({error:"Forbidden"},{status:403});
  const {id}=await context.params;
  try{
    const invoice=await prisma.customPaymentInvoice.findUnique({where:{id}});
    if(!invoice)return NextResponse.json({error:"Not found"},{status:404});
    if(invoice.status!=="ISSUED" || !invoice.issuedSnapshot) {
      return NextResponse.json({error:"Issue invoice before downloading final PDF"},{status:409});
    }
    const snapshot=invoice.issuedSnapshot as Record<string,unknown>;
    const date=(value:unknown)=>typeof value==="string"?new Date(value):null;
    const issueDate=date(snapshot.issueDate);
    if(!issueDate || !Number.isFinite(issueDate.getTime()))throw new Error("Invalid saved issue date");
    const bytes=await renderInvoicePdf({
      invoiceNo:String(snapshot.invoiceNo),recipientName:String(snapshot.recipientName),
      issuerName:String(snapshot.issuerName),issuerAddress:typeof snapshot.issuerAddress==="string"?snapshot.issuerAddress:null,
      recipientAddress:typeof snapshot.recipientAddress==="string"?snapshot.recipientAddress:null,
      issueDate,dueDate:date(snapshot.dueDate),currency:String(snapshot.currency),total:String(snapshot.total),
      lines:snapshot.lines,adjustments:snapshot.adjustments,bankDetails:snapshot.bankDetails,
      notes:typeof snapshot.notes==="string"?snapshot.notes:null,
    });
    return new NextResponse(new Uint8Array(bytes),{headers:{
      "Content-Type":"application/pdf",
      "Content-Disposition":'attachment; filename="commercial-invoice.pdf"',
      "Cache-Control":"private, no-store",
      "X-Content-Type-Options":"nosniff",
    }});
  }catch(error){
    console.error("[custom invoice pdf]",error);
    return NextResponse.json({error:"Unable to generate PDF"},{status:500});
  }
}
