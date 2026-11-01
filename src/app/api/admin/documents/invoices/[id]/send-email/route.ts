import {NextRequest,NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {prisma} from "@/lib/prisma";
import {getAdminSessionFromRequest} from "@/lib/admin-auth/get-admin-session";
import {can} from "@/features/auth/admin-permissions";
import {renderInvoicePdf} from "@/features/documents/invoice-pdf";
import {invoiceEmailContent,invoiceRecipients} from "@/features/documents/invoice-email";
import {logAdminAuditEvent} from "@/features/auth/admin-audit-log";

export const runtime="nodejs";

/** Send an already-issued immutable invoice as an attached PDF (never create a new invoice). */
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}){
 const session=getAdminSessionFromRequest(request);
 if(!session.authenticated)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!can(session,"orders.view_financials")||!can(session,"payments.manage"))return NextResponse.json({error:"Forbidden"},{status:403});
 const apiKey=process.env.RESEND_API_KEY;
 // The sender address is fixed by VNC policy; domain verification is required at provider.
 const from="Vietnam Clothing <support@vietnamclothing.vn>";
 if(!apiKey){
  return NextResponse.json({error:"Chưa cấu hình dịch vụ gửi email Invoice và địa chỉ người gửi đã xác minh."},{status:503});
 }
 const {id}=await context.params;
 try{
  const invoice=await prisma.customPaymentInvoice.findUnique({where:{id}});
  if(!invoice)return NextResponse.json({error:"Invoice không tồn tại."},{status:404});
  if(invoice.status!=="ISSUED"||!invoice.issuedSnapshot)return NextResponse.json({error:"Chỉ gửi Invoice đã phát hành."},{status:409});
  const body:unknown=await request.json().catch(()=>({}));
  const forceResend=typeof body==="object"&&body!==null&&!Array.isArray(body)&&
    (body as {forceResend?:unknown}).forceResend===true;
  const snapshot=invoice.issuedSnapshot as Record<string,unknown>;
  let recipients:{to:string[];cc:string[]};
  try{recipients=invoiceRecipients(snapshot.recipientEmail,snapshot.recipientCcEmails);}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Email khách hàng không hợp lệ."},{status:422});}
  const {to,cc}=recipients;
  const recipientsKey=[...to.map(x=>"to:"+x),...cc.map(x=>"cc:"+x)].sort().join("|");
  if(invoice.emailedAt && invoice.emailedTo===recipientsKey&&!forceResend){
   return NextResponse.json({sent:true,alreadySent:true,recipients:{to,cc},emailedAt:invoice.emailedAt.toISOString()});
  }
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
  const idempotencyKey="vnc-invoice-"+createHash("sha256").update(id+":"+recipientsKey+":"+invoice.emailSendCount).digest("hex");
  const result=await fetch("https://api.resend.com/emails",{
   method:"POST",signal:AbortSignal.timeout(18000),
   headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json","Idempotency-Key":idempotencyKey},
   body:JSON.stringify({
    from,to,cc,subject:emailContent.subject,text:emailContent.text,
    attachments:[{filename:`commercial-invoice-${String(snapshot.invoiceNo).replace(/[^A-Za-z0-9-]/g,"")}.pdf`,content:pdf.toString("base64")}]
   })
  });
  if(!result.ok){
   console.error("[custom invoice email] email provider rejected request",{invoiceId:id,status:result.status});
   return NextResponse.json({error:"Dịch vụ gửi email từ chối yêu cầu. Kiểm tra cấu hình và thử lại.",providerStatus:result.status},{status:502});
  }
  const response=await result.json() as {id?:string};
  let deliveryRecorded=true;
  try{
   await prisma.customPaymentInvoice.update({where:{id},data:{
    emailedAt:new Date(),emailedTo:recipientsKey,emailProviderId:response.id??null,
    emailSendCount:{increment:1}
   }});
  }catch{
   deliveryRecorded=false;
   console.error("[custom invoice email] provider accepted but delivery record could not be saved",{invoiceId:id});
  }
  logAdminAuditEvent({action:"custom_invoice_email_sent",userId:session.userId,employeeId:session.employeeId,route:request.nextUrl.pathname,
   detail:{invoiceId:id,invoiceNo:invoice.invoiceNo,to,cc,providerMessageId:response.id??null}});
  return NextResponse.json({sent:true,deliveryRecorded,recipient:to.join(", "),recipients:{to,cc},messageId:response.id??null,warning:deliveryRecorded?null:"Email accepted by provider but delivery status could not be recorded."},{status:deliveryRecorded?200:202,headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  console.error("[custom invoice email] failed",error);
  return NextResponse.json({error:"Không thể gửi Invoice. Chứng từ đã phát hành vẫn được giữ nguyên."},{status:500});
 }
}
