import {NextRequest,NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {prisma} from "@/lib/prisma";
import {getAdminSessionFromRequest} from "@/lib/admin-auth/get-admin-session";
import {can} from "@/features/auth/admin-permissions";
import {renderInvoicePdf} from "@/features/documents/invoice-pdf";
import {validInvoiceRecipient,invoiceEmailContent} from "@/features/documents/invoice-email";
import {logAdminAuditEvent} from "@/features/auth/admin-audit-log";

export const runtime="nodejs";

/** Send an already-issued immutable invoice as an attached PDF (never create a new invoice). */
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}){
 const session=getAdminSessionFromRequest(request);
 if(!session.authenticated)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!can(session,"orders.view_financials")||!can(session,"payments.manage"))return NextResponse.json({error:"Forbidden"},{status:403});
 const apiKey=process.env.RESEND_API_KEY;
 const from=process.env.VNC_INVOICE_FROM_EMAIL;
 if(!apiKey||!from||!validInvoiceRecipient(from)){
  return NextResponse.json({error:"Chưa cấu hình dịch vụ gửi email Invoice và địa chỉ người gửi đã xác minh."},{status:503});
 }
 const {id}=await context.params;
 try{
  const invoice=await prisma.customPaymentInvoice.findUnique({where:{id}});
  if(!invoice)return NextResponse.json({error:"Invoice không tồn tại."},{status:404});
  if(invoice.status!=="ISSUED"||!invoice.issuedSnapshot)return NextResponse.json({error:"Chỉ gửi Invoice đã phát hành."},{status:409});
  const snapshot=invoice.issuedSnapshot as Record<string,unknown>;
  const email=snapshot.recipientEmail;
  if(!validInvoiceRecipient(email))return NextResponse.json({error:"Invoice chưa có email khách hàng hợp lệ. Không thể gửi."},{status:422});
  const issued=(value:unknown)=>typeof value==="string"?new Date(value):null;
  const issueDate=issued(snapshot.issueDate);
  if(!issueDate||!Number.isFinite(issueDate.getTime()))throw new Error("Bad issued invoice date");
  const pdf=await renderInvoicePdf({
   invoiceNo:String(snapshot.invoiceNo),recipientName:String(snapshot.recipientName),
   issuerName:String(snapshot.issuerName),issuerAddress:typeof snapshot.issuerAddress==="string"?snapshot.issuerAddress:null,
   recipientAddress:typeof snapshot.recipientAddress==="string"?snapshot.recipientAddress:null,
   issueDate,dueDate:issued(snapshot.dueDate),currency:String(snapshot.currency),total:String(snapshot.total),
   lines:snapshot.lines,adjustments:snapshot.adjustments,bankDetails:snapshot.bankDetails,
   notes:typeof snapshot.notes==="string"?snapshot.notes:null,
   companyLogoUrl:typeof snapshot.companyLogoUrl==="string"?snapshot.companyLogoUrl:null,
   createdByDisplayName:typeof snapshot.createdByDisplayName==="string"?snapshot.createdByDisplayName:null,
   preparedByName:typeof snapshot.preparedByName==="string"?snapshot.preparedByName:null
  });
  if(pdf.length>8_000_000)return NextResponse.json({error:"PDF vượt giới hạn gửi email."},{status:413});
  const emailContent=invoiceEmailContent({
   invoiceNo:String(snapshot.invoiceNo),customerName:String(snapshot.recipientName),
   issuerName:String(snapshot.issuerName),currency:String(snapshot.currency),total:String(snapshot.total)
  });
  const idempotencyKey="vnc-invoice-"+createHash("sha256").update(id+":"+email.toLowerCase()).digest("hex");
  const result=await fetch("https://api.resend.com/emails",{
   method:"POST",signal:AbortSignal.timeout(18000),
   headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json","Idempotency-Key":idempotencyKey},
   body:JSON.stringify({
    from,to:[email],subject:emailContent.subject,text:emailContent.text,
    attachments:[{filename:`commercial-invoice-${String(snapshot.invoiceNo).replace(/[^A-Za-z0-9-]/g,"")}.pdf`,content:pdf.toString("base64")}]
   })
  });
  if(!result.ok){
   console.error("[custom invoice email] email provider rejected request",{invoiceId:id,status:result.status});
   return NextResponse.json({error:"Dịch vụ gửi email từ chối yêu cầu. Kiểm tra cấu hình và thử lại.",providerStatus:result.status},{status:502});
  }
  const response=await result.json() as {id?:string};
  logAdminAuditEvent({action:"custom_invoice_email_sent",userId:session.userId,employeeId:session.employeeId,route:request.nextUrl.pathname,
   detail:{invoiceId:id,invoiceNo:invoice.invoiceNo,recipient:email,providerMessageId:response.id??null}});
  return NextResponse.json({sent:true,recipient:email,messageId:response.id??null},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  console.error("[custom invoice email] failed",error);
  return NextResponse.json({error:"Không thể gửi Invoice. Chứng từ đã phát hành vẫn được giữ nguyên."},{status:500});
 }
}
