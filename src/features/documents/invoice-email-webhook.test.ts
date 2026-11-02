import test from "node:test";
import assert from "node:assert/strict";
import {createHmac} from "node:crypto";
import {verifyResendSignature,eventDeliveryStatus,summarizeInvoiceDelivery} from "./invoice-email-webhook";

const secret="whsec_"+Buffer.from("long-testing-signature-key-vnc-invoice").toString("base64");
function signed(raw:string,at=1_800_000_000){
 const id="msg_test_12345678",timestamp=String(at);
 const hmac=createHmac("sha256",Buffer.from(secret.slice(6),"base64"))
   .update(id+"."+timestamp+"."+raw).digest("base64");
 return {id,timestamp,signature:"v1,"+hmac};
}
test("Resend signature verification rejects forged, altered, expired and replayed payloads",()=>{
 const body=JSON.stringify({type:"email.delivered",data:{email_id:"msg123",to:["buyer@example.com"]}});
 const now=1_800_000_000_000;
 assert.equal(verifyResendSignature(body,signed(body),secret,now),true);
 assert.equal(verifyResendSignature(body+" ",signed(body),secret,now),false);
 assert.equal(verifyResendSignature(body,{...signed(body),signature:"v1,Zm9yZ2Vk"},secret,now),false);
 assert.equal(verifyResendSignature(body,signed(body,1_799_999_500),secret,now),false);
 assert.equal(verifyResendSignature(body,signed(body),"whsec_bad",now),false);
 assert.equal(verifyResendSignature(body,{...signed(body),id:"malformed id"},secret,now),false);
});
test("Email sent does not imply recipient delivery",()=>{
 const emails=["a@example.com","b@example.com"];
 const now=new Date("2026-11-02T00:00:00.000Z");
 const s=summarizeInvoiceDelivery(emails,[{eventType:"email.sent",recipient:emails.join(","),occurredAt:now}]);
 assert.equal(s.status,"SENT");
 assert.equal(s.pending,2);
});
test("Aggregate delivery is per-recipient and deduped, with bounce visible",()=>{
 const at=new Date("2026-11-02T01:00:00.000Z");
 const s=summarizeInvoiceDelivery(["a@example.com","b@example.com"],[
  {eventType:"email.delivered",recipient:"a@example.com",occurredAt:at},
  {eventType:"email.bounced",recipient:"b@example.com",occurredAt:at},
 ]);
 assert.equal(s.status,"BOUNCED");
 assert.equal(s.delivered,1);assert.equal(s.failed,1);
 assert.equal(s.byRecipient.find(x=>x.email==="a@example.com")?.status,"DELIVERED");
 assert.equal(s.byRecipient.find(x=>x.email==="b@example.com")?.status,"BOUNCED");
});
test("Out of order delayed or sent events must not downgrade later delivery",()=>{
 const old=new Date("2026-11-02T00:00:00.000Z"),later=new Date("2026-11-02T00:01:00.000Z");
 const s=summarizeInvoiceDelivery(["a@example.com"],[
  {eventType:"email.delivered",recipient:"a@example.com",occurredAt:later},
  {eventType:"email.sent",recipient:"a@example.com",occurredAt:old},
  {eventType:"email.delivery_delayed",recipient:"a@example.com",occurredAt:old},
 ]);
 assert.equal(s.status,"DELIVERED");
 assert.equal(eventDeliveryStatus("email.failed"),"FAILED");
 assert.equal(eventDeliveryStatus("email.opened"),null);
});


test("three recipients are all Delivered once all callbacks are present",()=>{
 const time=new Date("2026-11-02T05:15:26.000Z");
 const recipients=["finance@example.com","buyer@example.com","accounting@example.com"];
 const events=recipients.flatMap(recipient=>[
  {eventType:"email.sent",recipient,occurredAt:new Date(time.getTime()-3000)},
  {eventType:"email.delivered",recipient,occurredAt:time}
 ]);
 const delivery=summarizeInvoiceDelivery(recipients,events);
 assert.equal(delivery.status,"DELIVERED");
 assert.equal(delivery.delivered,3);
 assert.equal(delivery.pending,0);
 assert.equal(delivery.failed,0);
});
