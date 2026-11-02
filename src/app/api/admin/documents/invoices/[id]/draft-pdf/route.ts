import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getAdminSessionFromRequest} from "@/lib/admin-auth/get-admin-session";
import {can} from "@/features/auth/admin-permissions";
import {renderInvoicePdf} from "@/features/documents/invoice-pdf";

export const runtime="nodejs";

/** Download a watermarked PDF from the currently saved DRAFT. Never issues or mutates it. */
export async function GET(request:NextRequest,context:{params:Promise<{id:string}>}){
 const session=getAdminSessionFromRequest(request);
 if(!session.authenticated)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!can(session,"orders.view_financials"))return NextResponse.json({error:"Forbidden"},{status:403});
 const {id}=await context.params;
 try{
  const invoice=await prisma.customPaymentInvoice.findUnique({where:{id}});
  if(!invoice)return NextResponse.json({error:"Invoice not found"},{status:404});
  if(invoice.status!=="DRAFT"||invoice.issuedSnapshot){
   return NextResponse.json({error:"Only unissued drafts can be downloaded here. Use the final PDF for issued invoices."},{status:409});
  }
  // Draft is read from saved source fields, never from a user-supplied PDF payload.
  // Legal entity and bank snapshots are still frozen only upon Issue.
  const branding=await prisma.vncOsCompanyBranding.findUnique({where:{id:"default"},select:{logoUrl:true}});
  const pdf=await renderInvoicePdf({
   draft:true,invoiceNo:invoice.invoiceNo,recipientName:invoice.recipientName,
   recipientAddress:invoice.recipientAddress,issuerName:invoice.issuerName,
   issuerAddress:invoice.issuerAddress,currency:invoice.currency,total:invoice.total,
   issueDate:invoice.issueDate,dueDate:invoice.dueDate,
   lines:invoice.lines,adjustments:invoice.adjustments,bankDetails:invoice.bankDetails,
   notes:invoice.notes,preparedByName:invoice.preparedByName,
   createdByDisplayName:invoice.createdByDisplayName,
   companyLogoUrl:branding?.logoUrl??null,
  });
  const safeNo=invoice.invoiceNo.replace(/[^a-zA-Z0-9-]/g,"").slice(0,90);
  return new NextResponse(new Uint8Array(pdf),{headers:{
   "Content-Type":"application/pdf",
   "Content-Disposition":`attachment; filename="draft-commercial-invoice-${safeNo}.pdf"`,
   "Cache-Control":"private, no-store",
   "X-Content-Type-Options":"nosniff"
  }});
 }catch(error){
  console.error("[invoice draft pdf] failed",error);
  return NextResponse.json({error:"Unable to create draft PDF"},{status:500});
 }
}
