import test from "node:test";
import assert from "node:assert/strict";
import {validInvoiceRecipient,invoiceEmailContent} from "./invoice-email";

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
