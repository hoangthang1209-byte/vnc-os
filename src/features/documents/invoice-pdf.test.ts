import test from "node:test";
import assert from "node:assert/strict";
import { renderInvoicePdf } from "./invoice-pdf";

test("creates A4 payment request PDF with Vietnamese names", async () => {
  const pdf=await renderInvoicePdf({
    invoiceNo:"TEST-CI-321",
    recipientName:"Công ty Mẫu Việt Nam",
    recipientAddress:"Quận Tân Phú, TP. Hồ Chí Minh",
    issuerName:"Vietnam Clothing",
    currency:"USD",total:"209.00",
    issueDate:new Date("2026-10-30T00:00:00.000Z"),
    lines:[
      {description:"Sample fee",quantity:"1",unit:"set",unitPrice:"120"},
      {description:"Prototype",quantity:"3",unit:"pcs",unitPrice:"18"},
      {description:"Shipping",quantity:"1",unit:"shipment",unitPrice:"35"},
    ],
    bankDetails:{beneficiary:"Vietnam Clothing",bank:"Bank",account:"TEST-ONLY"},
  });
  assert.equal(pdf.subarray(0,5).toString(),"%PDF-");
  assert.ok(pdf.length>1000);
});

test("refuses inconsistent saved total", async () => {
  await assert.rejects(renderInvoicePdf({
    invoiceNo:"TEST",recipientName:"Test",issuerName:"Test",currency:"USD",
    total:"999.99",issueDate:new Date("2026-10-30"),
    lines:[{description:"Sample",quantity:"1",unit:"set",unitPrice:"5"}],
  }),/does not match/);
});
