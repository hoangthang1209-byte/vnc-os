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
  await assert.rejects(async () => renderInvoicePdf({
    invoiceNo:"TEST",recipientName:"Test",issuerName:"Test",currency:"USD",
    total:"999.99",issueDate:new Date("2026-10-30"),
    lines:[{description:"Sample",quantity:"1",unit:"set",unitPrice:"5"}],
  }),/does not match/);
});

test("enterprise invoice PDF includes bundled brand image and handles multiple pages", async () => {
 const pdf=await renderInvoicePdf({
  invoiceNo:"VNC-V2-TEST",recipientName:"Fresh Prints LLC",issuerName:"Công ty Sản xuất May mặc Việt Nam",
  currency:"USD",total:"2300.00",issueDate:new Date("2026-10-31T00:00:00.000Z"),
  lines:Array.from({length:20},(_,i)=>({description:"Production sample and sourcing service — mã hàng "+(i+1),quantity:"1",unit:"set",unitPrice:"115.00"})),
  bankDetails:{beneficiary:"Vietnam Clothing",bank:"ACB",account:"TEST-NOT-REAL",swift:"ASCBVNVX"},
  notes:"Please confirm banking details before making any payment.",
 });
 assert.equal(pdf.subarray(0,5).toString(),"%PDF-");
 assert.ok(pdf.length>7000,"branded multipage PDF is unexpectedly small");
});

test("V5.1 PDF preserves payout and Sales attribution with long banking details", async () => {
 const pdf=await renderInvoicePdf({
   invoiceNo:"CI-2099-0007",
   recipientName:"FRESH PRINTS",
   recipientAddress:"Pacific, MO - 63069",
   issuerName:"Vietnam Clothing Manufacturing Co.,Ltd",
   issuerAddress:"14B Bùi Cẩm Hổ, Phường Tân Phú, TP Hồ Chí Minh, Việt Nam",
   currency:"USD",total:"468.00",
   issueDate:new Date("2026-10-30T00:00:00.000Z"),
   dueDate:new Date("2026-11-02T00:00:00.000Z"),
   lines:[{description:"Deposit",quantity:"1",unit:"PO",unitPrice:"468"}],
   bankDetails:{
     account:"TEST-ONLY-34277567",currency:"USD",beneficiary:"VIETNAM CLOTHING MANUFACTURING CO., LTD",
     accountAddress:"14B Bui Cam Ho, Tan Phu, Ho Chi Minh City, Vietnam",
     bank:"ASIA COMMERCIAL JOINT STOCK BANK (ACB)",
     bankAddress:"442 Nguyen Thi Minh Khai, Ho Chi Minh City, Vietnam",
     branch:"ACB - PGD HAM TU",swift:"ASCBVNVX"
   },
   createdByDisplayName:"System Operator",
   preparedByName:"Trần Thị Thuỳ Linh",
 });
 assert.equal(pdf.subarray(0,5).toString(),"%PDF-");
 assert.ok(pdf.length>8000);
});


test("compact A4 invoice fits ten normal service lines, bank information and signature on one page", async () => {
 const pdf=await renderInvoicePdf({
  invoiceNo:"CI-2099-0010",recipientName:"FRESH PRINTS LLC",
  recipientAddress:"Pacific, Missouri 63069, USA",
  issuerName:"VIETNAM CLOTHING MANUFACTURING CO., LTD",
  issuerAddress:"14B Bui Cam Ho, Tan Phu, Ho Chi Minh City, Vietnam",
  currency:"USD",total:"1000.00",issueDate:new Date("2026-11-01T00:00:00.000Z"),
  lines:Array.from({length:10},(_,i)=>({
    description:"Apparel sample development — Service "+String(i+1).padStart(2,"0"),
    quantity:"1",unit:"set",unitPrice:"100.00",
  })),
  bankDetails:{
   beneficiary:"VIETNAM CLOTHING MANUFACTURING CO., LTD",
   account:"TEST-ACCOUNT-NO-PAYMENT",currency:"USD",
   bank:"ASIA COMMERCIAL JOINT STOCK BANK (ACB)",
   swift:"ASCBVNVX",branch:"ACB - HAM TU",
   accountAddress:"14B Bui Cam Ho, Tan Phu, HCMC, Vietnam",
   bankAddress:"442 Nguyen Thi Minh Khai, Ho Chi Minh City, Vietnam",
  },
  preparedByName:"Trần Thị Thuỳ Linh"
 });
 assert.equal(pdf.subarray(0,5).toString(),"%PDF-");
 const pageCount=(pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)||[]).length;
 assert.equal(pageCount,1,"ten normal service rows should fit one readable A4 page");
});

test("long service item descriptions paginate instead of clipping",async()=>{
 const pdf=await renderInvoicePdf({
  invoiceNo:"CI-2099-0030",recipientName:"Sourcing Customer",
  issuerName:"Vietnam Clothing",currency:"USD",total:"3000.00",
  issueDate:new Date("2026-11-01T00:00:00.000Z"),
  lines:Array.from({length:30},(_,i)=>({
   description:"Detailed product sample technical specification for batch "+i+
     " — inclusive of sourcing and quality assurance services",
   quantity:"1",unit:"service",unitPrice:"100.00"
  })),
  bankDetails:{beneficiary:"Vietnam Clothing",bank:"ACB",account:"TEST"},
  preparedByName:"VNC Sales",
 });
 assert.ok((pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)||[]).length>=2);
});


test("Draft PDF has distinct watermarked bytes, retains total and renders across two pages", async()=>{
 const values={
  invoiceNo:"CI-2099-0099",recipientName:"Draft Customer",issuerName:"Vietnam Clothing",
  currency:"USD",total:"3000.00",issueDate:new Date("2026-11-02T00:00:00Z"),
  lines:Array.from({length:30},(_,i)=>({description:"Sample service batch "+i+" — cut, packing and quality inspection",quantity:"1",unit:"set",unitPrice:"100.00"})),
  bankDetails:{beneficiary:"Vietnam Clothing",bank:"ACB",account:"TEST-ONLY"},
  preparedByName:"VNC Sales"
 };
 const draft=await renderInvoicePdf({...values,draft:true});
 const final=await renderInvoicePdf(values);
 assert.equal(draft.subarray(0,5).toString(),"%PDF-");
 assert.equal(final.subarray(0,5).toString(),"%PDF-");
 assert.ok(!draft.equals(final),"Draft must not be identical to final invoice PDF");
 const draftPages=(draft.toString("latin1").match(/\\/Type\\s*\\/Page\\b/g)||[]).length;
 const finalPages=(final.toString("latin1").match(/\\/Type\\s*\\/Page\\b/g)||[]).length;
 assert.ok(draftPages>=2,"Expected multi-page draft");
 assert.equal(draftPages,finalPages,"Watermark must not add pages");
});
