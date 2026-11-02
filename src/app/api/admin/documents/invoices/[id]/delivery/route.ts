import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getAdminSessionFromRequest} from "@/lib/admin-auth/get-admin-session";
import {can} from "@/features/auth/admin-permissions";
import {invoiceRecipients} from "@/features/documents/invoice-email";
import {summarizeInvoiceDelivery} from "@/features/documents/invoice-email-webhook";

export async function GET(request:NextRequest,context:{params:Promise<{id:string}>}){
 const session=getAdminSessionFromRequest(request);
 if(!session.authenticated)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!can(session,"orders.view_financials"))return NextResponse.json({error:"Forbidden"},{status:403});
 const {id}=await context.params;
 try{
  const invoice=await prisma.customPaymentInvoice.findUnique({where:{id},select:{
   invoiceNo:true,status:true,issuedSnapshot:true,emailedAt:true,
   emailedTo:true,emailSendCount:true,emailProviderId:true,emailDeliveryStatus:true,
   emailDeliveryUpdatedAt:true
  }});
  if(!invoice)return NextResponse.json({error:"Invoice not found"},{status:404});
  let recipients:string[]=[];
  try{
   const snap=invoice.issuedSnapshot as Record<string,unknown>|null;
   if(snap){
    const values=invoiceRecipients(snap.recipientEmail,snap.recipientCcEmails);
    recipients=[...values.to,...values.cc];
   }
  }catch{/* Old issued snapshots can have no email; keep details read-only. */}
  const events=invoice.emailProviderId?await prisma.vncInvoiceEmailDeliveryEvent.findMany({
   where:{providerEmailId:invoice.emailProviderId},
   orderBy:{occurredAt:"desc"},take:100,
   select:{eventType:true,recipient:true,occurredAt:true,receivedAt:true,detail:true}
  }):[];
  const summary=invoice.emailedAt?summarizeInvoiceDelivery(recipients,events):null;
  return NextResponse.json({
   invoiceNo:invoice.invoiceNo,sent:!!invoice.emailedAt,emailedAt:invoice.emailedAt,
   recipients:invoice.emailedTo,sendCount:invoice.emailSendCount,
   status:invoice.emailDeliveryStatus||(invoice.emailedAt?"SENT":"NOT_SENT"),
   updatedAt:invoice.emailDeliveryUpdatedAt,summary,events
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  console.error("[invoice delivery details] read failed",error);
  return NextResponse.json({error:"Không thể tải lịch sử giao nhận."},{status:503});
 }
}
