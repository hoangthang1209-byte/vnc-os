import test from "node:test";
import assert from "node:assert/strict";
import {validInvoiceRecipient,invoiceEmailContent,parseInvoiceRecipients,invoiceRecipients} from "./invoice-email";

test("validates email recipient and rejects header injection",()=>{
 assert.equal(validInvoiceRecipient("accounts@example.com"),true);
 assert.equal(validInvoiceRecipient("accounts@example.com\r\nBcc: bad@example.com"),false);
 assert.equal(validInvoiceRecipient("invalid"),false);
});
test("builds subject and content without header injections",()=>{
 const mail=invoiceEmailContent({invoiceNo:"CI-2026-0002",customerName:"FRESH PRINTS",issuerName:"Vietnam Clothing",currency:"USD",total:"468.00"});
 assert.match(mail.subject,/CI-2026-0002/);
 assert.match(mail.text,/USD 468.00/);
 assert.match(mail.text,/VAT e-invoice/);
});


test("one Invoice supports many To and CC recipients with case-insensitive deduplication",()=>{
 assert.deepEqual(invoiceRecipients("Accounting@Freshprints.com; buyer@freshprints.com\naccounting@freshprints.com","manager@freshprints.com, BUYER@freshprints.com"),{
  to:["accounting@freshprints.com","buyer@freshprints.com"],
  cc:["manager@freshprints.com"]
 });
 assert.deepEqual(parseInvoiceRecipients(""),[]);
});
test("rejects malformed and excessive invoice email lists",()=>{
 assert.throws(()=>invoiceRecipients("wrong-address","cc@example.com"),/Email không hợp lệ/);
 assert.throws(()=>invoiceRecipients("","cc@example.com"),/ít nhất một/);
 assert.throws(()=>parseInvoiceRecipients(Array.from({length:11},(_,i)=>"user"+i+"@example.com").join(";")),/Tối đa/);
 assert.throws(()=>invoiceRecipients("to@example.com","manager@example.com\nBcc: bad@example.com"),/Email không hợp lệ/);
});


test("branded Invoice HTML includes escaped customer data, amount and reply address",()=>{
 const input={invoiceNo:"CI-2026-0005",customerName:"ACME <script>alert(1)</script> & Partners",
 issuerName:"Vietnam Clothing",currency:"USD",total:"446.00"};
 const rendered=invoiceEmailContent(input);
 assert.match(rendered.html,/Vietnam Clothing/);
 assert.match(rendered.html,/TOTAL AMOUNT DUE/);
 assert.match(rendered.html,/446\.00/);
 assert.match(rendered.html,/support@vietnamclothing\.vn/);
 assert.doesNotMatch(rendered.html,/<script>/);
 assert.match(rendered.html,/&lt;script&gt;/);
 assert.match(rendered.text,/USD 446\.00/);
});
