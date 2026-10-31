import PDFDocument from "pdfkit";
import { resolve as resolvePath } from "node:path";
import { calculateCustomInvoice, formatMinor, type InvoiceCurrency, type InvoiceLine } from "./custom-invoice-calculation";

type InvoicePdfInput = {
  invoiceNo: string;
  recipientName: string;
  recipientAddress?: string | null;
  issuerName: string;
  issuerAddress?: string | null;
  currency: string;
  total: string;
  issueDate: Date;
  dueDate?: Date | null;
  lines: unknown;
  adjustments?: unknown;
  bankDetails?: unknown;
  notes?: string | null;
};

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}
function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function safe(value: unknown): string {
  return str(value).slice(0, 500);
}
function lineItems(value: unknown): InvoiceLine[] {
  if (!Array.isArray(value)) throw new Error("Invoice has no line items");
  return value.map(raw => {
    const row = object(raw);
    return {description:str(row.description), quantity:str(row.quantity), unit:str(row.unit), unitPrice:str(row.unitPrice)};
  });
}

/** PDF generated from saved invoice fields, without client-side monetary calculations. */
export function renderInvoicePdf(invoice: InvoicePdfInput): Promise<Buffer> {
  const currency = invoice.currency as InvoiceCurrency;
  const adjustments = object(invoice.adjustments);
  const totals = calculateCustomInvoice({
    currency, lines: lineItems(invoice.lines),
    discount: str(adjustments.discount) || "0",
    extraCharge: str(adjustments.extraCharge) || "0",
    tax: str(adjustments.tax) || "0",
  });
  if (formatMinor(totals.totalMinor, currency) !== invoice.total) {
    throw new Error("Saved invoice total does not match line items");
  }
  const bank = object(invoice.bankDetails);
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({size:"A4", margin:45, bufferPages:true});
    pdf.registerFont("Body",resolvePath(process.cwd(),"node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf"));
    pdf.registerFont("Heading",resolvePath(process.cwd(),"node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf"));
    const chunks: Buffer[]=[];
    pdf.on("data",(chunk:Buffer)=>chunks.push(chunk));
    pdf.on("error",reject);
    pdf.on("end",()=>resolve(Buffer.concat(chunks)));
    const row = (left:string,right:string) => {
      if (pdf.y > 715) pdf.addPage();
      const y = pdf.y;
      pdf.font("Body").fontSize(9).text(safe(left),45,y,{width:360});
      pdf.text(safe(right),410,y,{width:140,align:"right"});
      pdf.y = Math.max(pdf.y,y+20);
    };
    pdf.fillColor("#111827").font("Helvetica-Bold").fontSize(18).text(safe(invoice.issuerName));
    pdf.font("Body").fontSize(9).text(safe(invoice.issuerAddress)).moveDown();
    pdf.font("Heading").fontSize(19).text("COMMERCIAL INVOICE");
    pdf.font("Body").fontSize(10).text("PAYMENT REQUEST - NOT A VAT TAX INVOICE").moveDown();
    pdf.fontSize(9).text("Invoice No.: "+safe(invoice.invoiceNo));
    pdf.text("Issue Date: "+invoice.issueDate.toISOString().slice(0,10));
    if(invoice.dueDate) pdf.text("Due Date: "+invoice.dueDate.toISOString().slice(0,10));
    pdf.moveDown().font("Helvetica-Bold").fontSize(10).text("BILL TO");
    pdf.font("Body").text(safe(invoice.recipientName));
    if(invoice.recipientAddress) pdf.fontSize(9).text(safe(invoice.recipientAddress));
    pdf.moveDown().font("Helvetica-Bold").fontSize(10).text("ITEMS");
    pdf.moveDown(0.3);
    totals.lines.forEach((item,index) => {
      row((index+1)+". "+item.description+"   x"+item.quantity+" "+item.unit+" @ "+item.unitPrice,
          currency+" "+formatMinor(item.amountMinor,currency));
    });
    pdf.moveDown().font("Helvetica-Bold");
    row("Subtotal",currency+" "+formatMinor(totals.subtotalMinor,currency));
    if(totals.discountMinor) row("Discount","-"+currency+" "+formatMinor(totals.discountMinor,currency));
    if(totals.extraChargeMinor) row("Additional charges",currency+" "+formatMinor(totals.extraChargeMinor,currency));
    if(totals.taxMinor) row("Tax / other charge",currency+" "+formatMinor(totals.taxMinor,currency));
    pdf.font("Heading").fontSize(12);
    row("TOTAL DUE",currency+" "+invoice.total);
    if(pdf.y>660)pdf.addPage();
    pdf.moveDown().font("Helvetica-Bold").fontSize(10).text("PAYMENT DETAILS");
    pdf.font("Body").fontSize(9);
    for(const [label,key] of [["Beneficiary","beneficiary"],["Bank","bank"],["Account","account"],["SWIFT","swift"]] as const) {
      const value=safe(bank[key]);if(value)pdf.text(label+": "+value);
    }
    if(invoice.notes) {
      pdf.moveDown().font("Helvetica-Bold").text("Notes");
      pdf.font("Body").text(safe(invoice.notes));
    }
    pdf.moveDown().fontSize(8).fillColor("#6b7280")
      .text("This document is a commercial payment request and is not a Vietnamese VAT e-invoice.");
    pdf.end();
  });
}
