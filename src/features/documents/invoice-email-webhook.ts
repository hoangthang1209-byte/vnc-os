import {createHmac,timingSafeEqual} from "node:crypto";

/** Resend webhook signatures follow the Standard Webhooks / Svix scheme. */
export function verifyResendSignature(
 payload:string,headers:{id:string|null;timestamp:string|null;signature:string|null},secret:string,nowMs=Date.now()
):boolean{
 if(!secret.startsWith("whsec_")||!headers.id||!headers.timestamp||!headers.signature)return false;
 if(!/^[a-zA-Z0-9_-]{4,180}$/.test(headers.id)||!/^\d{10}$/.test(headers.timestamp))return false;
 const seconds=Number(headers.timestamp);
 if(!Number.isSafeInteger(seconds)||Math.abs(nowMs/1000-seconds)>300)return false;
 const key=Buffer.from(secret.slice(6),"base64");
 if(key.length<16)return false;
 const expected=createHmac("sha256",key).update(headers.id+"."+headers.timestamp+"."+payload,"utf8").digest();
 return headers.signature.split(/\s+/).some(part=>{
  if(!part.startsWith("v1,"))return false;
  const encoded=part.slice(3);
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))return false;
  const actual=Buffer.from(encoded,"base64");
  return actual.length===expected.length&&timingSafeEqual(actual,expected);
 });
}
export const INVOICE_RESEND_EVENTS={
 "email.sent":"SENT",
 "email.delivered":"DELIVERED",
 "email.delivery_delayed":"DELAYED",
 "email.bounced":"BOUNCED",
 "email.failed":"FAILED",
 "email.suppressed":"FAILED",
 "email.complained":"FAILED",
} as const;
export type InvoiceDeliveryEventType=keyof typeof INVOICE_RESEND_EVENTS;
export type InvoiceDeliveryStatus="SENT"|"DELIVERED"|"DELAYED"|"BOUNCED"|"FAILED"|"PARTIAL";
export function eventDeliveryStatus(type:string):InvoiceDeliveryStatus|null{
 return Object.prototype.hasOwnProperty.call(INVOICE_RESEND_EVENTS,type)
  ? INVOICE_RESEND_EVENTS[type as InvoiceDeliveryEventType]:null;
}
export type InvoiceEmailEvent={eventType:string;recipient:string|null;occurredAt:Date};
export function summarizeInvoiceDelivery(
 recipients:string[],events:InvoiceEmailEvent[]
):{status:InvoiceDeliveryStatus;delivered:number;failed:number;pending:number;byRecipient:{email:string;status:InvoiceDeliveryStatus}[]}{
 const expected=[...new Set(recipients.map(e=>e.trim().toLowerCase()).filter(Boolean))];
 const latest=new Map<string,{status:InvoiceDeliveryStatus;occurredAt:number}>();
 const rank:{[key:string]:number}={SENT:0,DELAYED:1,DELIVERED:2,BOUNCED:3,FAILED:3,PARTIAL:0};
 for(const event of events){
  const status=eventDeliveryStatus(event.eventType);
  if(!status||!Number.isFinite(event.occurredAt.getTime()))continue;
  const targets=(event.recipient||"").split(",").map(e=>e.trim().toLowerCase()).filter(Boolean);
  for(const target of targets){
   if(!expected.includes(target))continue;
   const prev=latest.get(target),currentTime=event.occurredAt.getTime();
   if(!prev||currentTime>prev.occurredAt||(currentTime===prev.occurredAt&&rank[status]>rank[prev.status])){
    latest.set(target,{status,occurredAt:currentTime});
   }
  }
 }
 const byRecipient=expected.map(email=>({email,status:latest.get(email)?.status||"SENT" as InvoiceDeliveryStatus}));
 const delivered=byRecipient.filter(x=>x.status==="DELIVERED").length;
 const failed=byRecipient.filter(x=>x.status==="BOUNCED"||x.status==="FAILED").length;
 const pending=byRecipient.length-delivered-failed;
 let status:InvoiceDeliveryStatus="SENT";
 if(failed>0)status=byRecipient.some(x=>x.status==="BOUNCED")?"BOUNCED":"FAILED";
 else if(delivered>0&&pending>0)status="PARTIAL";
 else if(byRecipient.length>0&&delivered===byRecipient.length)status="DELIVERED";
 else if(byRecipient.some(x=>x.status==="DELAYED"))status="DELAYED";
 return {status,delivered,failed,pending,byRecipient};
}
