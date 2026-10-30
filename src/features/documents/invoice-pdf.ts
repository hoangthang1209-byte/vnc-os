import PDFDocument from "pdfkit";
type InvoicePdfInput = {invoiceNo:string;recipientName:string;issuerName:string;currency:string;total:string;subtotal:string;issueDate:Date;lines:unknown;notes?:string|null};
export function renderInvoicePdf(invoice:InvoicePdfInput): Promise<Buffer> {
 return new Promise((resolve,reject)=>{
  const pdf=new PDFDocument({size:"A4",margin:45});const chunks:Buffer[]=[];
  pdf.on("data",(chunk:Buffer)=>chunks.push(chunk));pdf.on("error",reject);pdf.on("end",()=>resolve(Buffer.concat(chunks)));
  pdf.fontSize(17).font("Helvetica-Bold").text(invoice.issuerName.slice(0,160)).moveDown(0.7);
  pdf.fontSize(19).text("COMMERCIAL INVOICE").fontSize(10).font("Helvetica").text("Payment Request - Not a VAT invoice").moveDown();
  pdf.text("Invoice No.: "+invoice.invoiceNo).text("Date: "+invoice.issueDate.toISOString().slice(0,10)).moveDown();
  pdf.font("Helvetica-Bold").text("BILL TO").font("Helvetica").text(invoice.recipientName.slice(0,160)).moveDown(1.5);
  pdf.font("Helvetica-Bold").text("DESCRIPTION",45,pdf.y).moveDown(0.3);
  const lines=Array.isArray(invoice.lines)?invoice.lines:[];
  for(const raw of lines.slice(0,100)){
   const line=raw as Record<string,unknown>;
   const description=String(line.description??"").replace(/[^\x20-\x7E]/g,"?").slice(0,130);
   const qty=String(line.quantity??"");
   const price=String(line.unitPrice??"");
   pdf.font("Helvetica").fontSize(10).text(description+" | Qty: "+qty+" | Unit price: "+invoice.currency+" "+price,{width:500}).moveDown(0.4);
   if(pdf.y>690)pdf.addPage();
  }
  pdf.moveDown().font("Helvetica-Bold").fontSize(12).text("TOTAL DUE: "+invoice.currency+" "+invoice.total,{align:"right"}).moveDown();
  if(invoice.notes)pdf.font("Helvetica").fontSize(9).text(invoice.notes.slice(0,700));
  pdf.moveDown().fontSize(9).text("This document is a commercial payment request, not a Vietnamese VAT invoice.");
  pdf.end();
 });
}
