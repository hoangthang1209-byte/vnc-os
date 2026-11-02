import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {invoiceRecipients} from "@/features/documents/invoice-email";
import {eventDeliveryStatus,summarizeInvoiceDelivery,verifyResendSignature} from "@/features/documents/invoice-email-webhook";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const noCache={"Cache-Control":"no-store"};

/** Public endpoint secured by the Resend Standard Webhooks signature, not an admin session. */
export async function POST(request:NextRequest){
 const secret=process.env.RESEND_WEBHOOK_SECRET;
 if(!secret)return NextResponse.json({error:"Webhook not configured"},{status:503,headers:noCache});
 const raw=await request.text();
 if(raw.length>48_000)return NextResponse.json({error:"Payload too large"},{status:413});
 const headers={
  id:request.headers.get("svix-id"),
  timestamp:request.headers.get("svix-timestamp"),
  signature:request.headers.get("svix-signature"),
 };
 if(!verifyResendSignature(raw,headers,secret))return NextResponse.json({error:"Invalid signature"},{status:401,headers:noCache});
 let input:unknown;
 try{input=JSON.parse(raw);}catch{return NextResponse.json({error:"Invalid JSON"},{status:400});}
 if(!input||typeof input!=="object"||Array.isArray(input))return NextResponse.json({error:"Invalid event"},{status:400});
 const event=input as Record<string,unknown>;
 const type=typeof event.type==="string"?event.type:"";
 if(!eventDeliveryStatus(type))return NextResponse.json({ok:true,ignored:true},{headers:noCache});
 const data=event.data;
 if(!data||typeof data!=="object"||Array.isArray(data))return NextResponse.json({error:"Invalid event data"},{status:400});
 const detail=data as Record<string,unknown>;
 const emailId=detail.email_id,from=detail.from;
 if(typeof emailId!=="string"||emailId.length>160||!emailId)return NextResponse.json({error:"Missing email ID"},{status:400});
 // Ignore other Resend account messages: invoice mail always originates from VNC support.
 if(typeof from!=="string"||!/support@vietnamclothing\.vn(?:>|$)/i.test(from.trim()))
  return NextResponse.json({ok:true,ignored:true},{headers:noCache});
 const occurredAt=new Date(typeof event.created_at==="string"?event.created_at:"");
 if(!Number.isFinite(occurredAt.getTime()))return NextResponse.json({error:"Invalid event timestamp"},{status:400});
 const recipients=Array.isArray(detail.to)?detail.to.filter((x):x is string=>typeof x==="string"&&x.length<=254):[];
 const recipient=recipients.join(", ").slice(0,1800)||null;
 const errorDetail=detail.bounce&&typeof detail.bounce==="object"&&!Array.isArray(detail.bounce)
  ?(detail.bounce as {message?:unknown}).message:null;
 const summary=typeof errorDetail==="string"?errorDetail.slice(0,1000):null;
 try{
  const result=await prisma.$transaction(async tx=>{
   const invoice=await tx.customPaymentInvoice.findFirst({where:{emailProviderId:emailId},select:{
    id:true,issuedSnapshot:true,emailProviderId:true
   }});
   await tx.vncInvoiceEmailDeliveryEvent.create({data:{
    webhookId:headers.id!,providerEmailId:emailId,eventType:type,recipient,
    invoiceId:invoice?.id||null,occurredAt,detail:summary
   }});
   if(!invoice)return {matched:false};
   let expected:string[]=[];
   try{
    const snapshot=invoice.issuedSnapshot as Record<string,unknown>|null;
    if(snapshot){
     const parsed=invoiceRecipients(snapshot.recipientEmail,snapshot.recipientCcEmails);
     expected=[...parsed.to,...parsed.cc];
    }
   }catch{return {matched:true};}
   const events=await tx.vncInvoiceEmailDeliveryEvent.findMany({where:{providerEmailId:emailId},
    select:{eventType:true,recipient:true,occurredAt:true}});
   const delivery=summarizeInvoiceDelivery(expected,events);
   await tx.customPaymentInvoice.updateMany({where:{id:invoice.id,emailProviderId:emailId},data:{
    emailDeliveryStatus:delivery.status,emailDeliveryUpdatedAt:new Date()
   }});
   return {matched:true};
  });
  return NextResponse.json({ok:true,...result},{headers:noCache});
 }catch(error){
  if(error&&typeof error==="object"&&"code" in error&&error.code==="P2002")
   return NextResponse.json({ok:true,duplicate:true},{headers:noCache});
  console.error("[invoice resend webhook] persistence error",error);
  return NextResponse.json({error:"Temporarily unable to record event"},{status:500,headers:noCache});
 }
}
