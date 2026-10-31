import PDFDocument from "pdfkit";
import { resolve as resolvePath } from "node:path";
import { calculateCustomInvoice, formatMinor, type InvoiceCurrency, type InvoiceLine } from "./custom-invoice-calculation";

type InvoicePdfInput = {
  invoiceNo: string; recipientName: string; recipientAddress?: string | null;
  issuerName: string; issuerAddress?: string | null; currency: string; total: string;
  issueDate: Date; dueDate?: Date | null; lines: unknown; adjustments?: unknown;
  bankDetails?: unknown; notes?: string | null;
};
const LEFT = 46, RIGHT = 549, WIDTH = RIGHT - LEFT, PAGE_BOTTOM = 785;
function object(value: unknown): Record<string,unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string,unknown> : {};
}
function str(value: unknown): string { return typeof value === "string" ? value : ""; }
function safe(value: unknown): string { return str(value).slice(0, 2000); }
function lineItems(value: unknown): InvoiceLine[] {
  if (!Array.isArray(value)) throw new Error("Invoice has no line items");
  return value.map(value => {
    const row=object(value);
    return {description:str(row.description),quantity:str(row.quantity),unit:str(row.unit),unitPrice:str(row.unitPrice)};
  });
}
/** Issued commercial invoice PDF, always calculated from the immutable server-side snapshot. */
export function renderInvoicePdf(invoice: InvoicePdfInput): Promise<Buffer> {
  const currency=invoice.currency as InvoiceCurrency;
  const adj=object(invoice.adjustments);
  const totals=calculateCustomInvoice({
    currency,lines:lineItems(invoice.lines),
    discount:str(adj.discount)||"0",extraCharge:str(adj.extraCharge)||"0",tax:str(adj.tax)||"0",
  });
  if(formatMinor(totals.totalMinor,currency)!==invoice.total)throw new Error("Saved invoice total does not match line items");
  const bank=object(invoice.bankDetails);
  return new Promise((resolve,reject)=>{
    const pdf=new PDFDocument({size:"A4",margin:LEFT,bufferPages:true});
    pdf.registerFont("Body",resolvePath(process.cwd(),"node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf"));
    pdf.registerFont("Heading",resolvePath(process.cwd(),"node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf"));
    const chunks:Buffer[]=[];
    pdf.on("data",(chunk:Buffer)=>chunks.push(chunk));
    pdf.on("error",reject);
    pdf.on("end",()=>resolve(Buffer.concat(chunks)));
    let y=LEFT;
    const ensure=(height:number)=>{if(y+height>PAGE_BOTTOM){pdf.addPage();y=LEFT;}};
    const write=(value:string,x:number,width:number,options:{bold?:boolean;size?:number;color?:string;align?:"left"|"right";height?:number}={})=>{
      pdf.font(options.bold?"Heading":"Body").fontSize(options.size??9).fillColor(options.color??"#1f2937");
      const text=safe(value);
      const height=options.height??pdf.heightOfString(text,{width});
      pdf.text(text,x,y,{width,align:options.align??"left",lineBreak:true});
      return height;
    };
    const textLine=(value:string,options:{bold?:boolean;size?:number;color?:string;space?:number;width?:number}={})=>{
      pdf.font(options.bold?"Heading":"Body").fontSize(options.size??9);
      const height=pdf.heightOfString(safe(value),{width:options.width??WIDTH});
      ensure(height+5);
      write(value,LEFT,options.width??WIDTH,options);
      y+=height+(options.space??5);
    };
    const divider=()=>{ensure(14);pdf.strokeColor("#e3e8ef").lineWidth(.7).moveTo(LEFT,y).lineTo(RIGHT,y).stroke();y+=14;};
    const tableRow=(label:string,amount:string,bold=false)=>{
      pdf.font(bold?"Heading":"Body").fontSize(bold?10:9);
      const h=Math.max(pdf.heightOfString(safe(label),{width:365}),pdf.heightOfString(safe(amount),{width:128}))+7;
      ensure(h);
      write(label,LEFT,365,{bold,size:bold?10:9});
      write(amount,RIGHT-128,128,{bold,size:bold?10:9,align:"right"});
      y+=h;
    };

    textLine(invoice.issuerName,{bold:true,size:15,space:6});
    if(invoice.issuerAddress)textLine(invoice.issuerAddress,{size:9,color:"#64748b",space:15});
    else y+=8;
    divider();
    textLine("COMMERCIAL INVOICE",{bold:true,size:19,space:4});
    textLine("PAYMENT REQUEST — NOT A VAT TAX INVOICE",{size:8,color:"#6b7280",space:15});
    textLine("Invoice No.: "+invoice.invoiceNo);
    textLine("Issue Date: "+invoice.issueDate.toISOString().slice(0,10));
    if(invoice.dueDate)textLine("Due Date: "+invoice.dueDate.toISOString().slice(0,10));
    y+=10;
    textLine("BILL TO",{bold:true,size:10,space:8});
    textLine(invoice.recipientName,{bold:true,size:10});
    if(invoice.recipientAddress)textLine(invoice.recipientAddress,{size:9,color:"#64748b"});
    y+=12;
    divider();
    textLine("ITEMS",{bold:true,size:10,space:11});
    totals.lines.forEach((item,index)=>{
      tableRow(`${index+1}. ${item.description}   ×${item.quantity} ${item.unit} @ ${item.unitPrice}`,
        `${currency} ${formatMinor(item.amountMinor,currency)}`);
    });
    y+=8;divider();
    tableRow("Subtotal",currency+" "+formatMinor(totals.subtotalMinor,currency));
    if(totals.discountMinor)tableRow("Discount","-"+currency+" "+formatMinor(totals.discountMinor,currency));
    if(totals.extraChargeMinor)tableRow("Additional charges",currency+" "+formatMinor(totals.extraChargeMinor,currency));
    if(totals.taxMinor)tableRow("Tax / other charge",currency+" "+formatMinor(totals.taxMinor,currency));
    y+=8;divider();
    tableRow("TOTAL DUE",currency+" "+invoice.total,true);
    y+=20;
    ensure(115);
    textLine("PAYMENT DETAILS",{bold:true,size:10,space:10});
    for(const [label,key] of [["Beneficiary","beneficiary"],["Bank","bank"],["Account","account"],["SWIFT","swift"]] as const){
      const value=safe(bank[key]); if(value)textLine(label+": "+value,{size:9,space:5});
    }
    if(invoice.notes){
      y+=12;ensure(65);textLine("NOTES / PAYMENT TERMS",{bold:true,size:10,space:8});
      textLine(invoice.notes,{size:9,space:5});
    }
    y+=15;ensure(45);divider();
    textLine("This document is a commercial payment request and is not a Vietnamese VAT e-invoice.",{size:8,color:"#64748b"});
    pdf.end();
  });
}
