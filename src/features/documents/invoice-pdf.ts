import PDFDocument from "pdfkit";
export function renderInvoicePdf(invoice: {invoiceNo:string;recipientName:string;issuerName:string;currency:string;total:string}): Promise<Buffer> {
 return new Promise((resolve,reject)=>{
  const pdf=new PDFDocument({size:"A4",margin:48}); const chunks:Buffer[]=[];
  pdf.on("data",(chunk:Buffer)=>chunks.push(chunk));pdf.on("error",reject);pdf.on("end",()=>resolve(Buffer.concat(chunks)));
  pdf.fontSize(18).text(invoice.issuerName).moveDown().fontSize(20).text("COMMERCIAL INVOICE / PAYMENT REQUEST").moveDown();
  pdf.fontSize(11).text("Invoice: "+invoice.invoiceNo).text("Bill to: "+invoice.recipientName).moveDown();
  pdf.fontSize(14).text("TOTAL DUE: "+invoice.currency+" "+invoice.total).moveDown();
  pdf.fontSize(9).text("Payment request only — not a Vietnamese VAT invoice.");
  pdf.end();
 });
}
