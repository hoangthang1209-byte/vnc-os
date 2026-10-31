import PDFDocument from "pdfkit";
import { resolve as resolvePath } from "node:path";
import { calculateCustomInvoice, formatMinor, type InvoiceCurrency, type InvoiceLine } from "./custom-invoice-calculation";
import { vncLogoPngBuffer } from "./vnc-invoice-brand";
import { loadInvoiceInterFont } from "./inter-font";

type InvoicePdfInput = {
  invoiceNo: string; recipientName: string; recipientAddress?: string | null;
  issuerName: string; issuerAddress?: string | null; currency: string; total: string;
  issueDate: Date; dueDate?: Date | null; lines: unknown; adjustments?: unknown;
  bankDetails?: unknown; notes?: string | null;
};
const L=48, R=547, W=R-L, BOTTOM=747, INK="#222c39", NAVY="#273647", GREY="#77818f", LIGHT="#e9edf1";
function object(v:unknown):Record<string,unknown>{return v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};}
function str(v:unknown):string{return typeof v==="string"?v:"";}
function items(v:unknown):InvoiceLine[]{
 if(!Array.isArray(v))throw new Error("Invoice has no line items");
 return v.map(raw=>{const r=object(raw);return {description:str(r.description),quantity:str(r.quantity),unit:str(r.unit),unitPrice:str(r.unitPrice)};});
}
export async function renderInvoicePdf(invoice:InvoicePdfInput):Promise<Buffer>{
 const currency=invoice.currency as InvoiceCurrency,adjustments=object(invoice.adjustments);
 const totals=calculateCustomInvoice({currency,lines:items(invoice.lines),discount:str(adjustments.discount)||"0",extraCharge:str(adjustments.extraCharge)||"0",tax:str(adjustments.tax)||"0"});
 if(formatMinor(totals.totalMinor,currency)!==invoice.total)throw new Error("Saved invoice total does not match line items");
 const bank=object(invoice.bankDetails);
 const inter=await loadInvoiceInterFont();
 return new Promise((resolve,reject)=>{
  const pdf=new PDFDocument({size:"A4",margin:L,bufferPages:true});
  // Retain the proven Unicode font for PDF; the document uses the same enterprise sizing as the web preview.
  // Use the exact Inter font loaded by the A4 browser preview.
  // Unicode-capable DejaVu remains a safe fallback when external font retrieval fails.
  pdf.registerFont("Body",inter??resolvePath(process.cwd(),"node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf"));
  pdf.registerFont("Heading",inter??resolvePath(process.cwd(),"node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf"));
  const chunks:Buffer[]=[];
  pdf.on("data",(b:Buffer)=>chunks.push(b));pdf.on("error",reject);pdf.on("end",()=>resolve(Buffer.concat(chunks)));
  let y=L;
  function font(bold=false,size=9,color=INK){pdf.font(bold?"Heading":"Body").fontSize(size).fillColor(color);}
  function height(value:string,width:number,bold=false,size=9){font(bold,size);return pdf.heightOfString(value,{width});}
  function write(value:string,x:number,top:number,width:number,bold=false,size=9,color=INK,align:"left"|"right"="left"){
   font(bold,size,color);pdf.text(value,x,top,{width,align});
  }
  function rule(top:number,color=LIGHT){pdf.strokeColor(color).lineWidth(.7).moveTo(L,top).lineTo(R,top).stroke();}
  function ensure(space:number){if(y+space>BOTTOM){pdf.addPage();y=L+8;}}
  function block(value:string,width=W,size=9,bold=false,color=INK,space=6){
   const h=height(value,width,bold,size);ensure(h+space);write(value,L,y,width,bold,size,color);y+=h+space;
  }
  function companyHeader(){
   pdf.image(vncLogoPngBuffer(),L,44,{fit:[132,42]});
   write("COMMERCIAL",326,47,221,true,15,NAVY,"right");
   write("INVOICE",326,67,221,true,15,NAVY,"right");
   write("PAYMENT REQUEST",343,91,204,false,7,GREY,"right");
   rule(114,LIGHT);
   y=132;
  }
  companyHeader();
  // Company identity and document metadata.
  const half=(W-26)/2,right=L+half+26;
  write("ISSUED BY",L,y,half,true,7,GREY);
  write("BILL TO",right,y,half,true,7,GREY);
  y+=15;
  const issuerName=invoice.issuerName.slice(0,500),recipientName=invoice.recipientName.slice(0,500);
  const issuerHeight=height(issuerName,half,true,9.1),customerHeight=height(recipientName,half,true,9.1);
  write(issuerName,L,y,half,true,9.1);write(recipientName,right,y,half,true,9.1);
  y+=Math.max(issuerHeight,customerHeight)+6;
  const issuerAddress=str(invoice.issuerAddress).slice(0,850),customerAddress=str(invoice.recipientAddress).slice(0,850);
  const addrHeight=Math.max(issuerAddress?height(issuerAddress,half,false,7.6):0,customerAddress?height(customerAddress,half,false,7.6):0);
  if(issuerAddress)write(issuerAddress,L,y,half,false,7.6,GREY);
  if(customerAddress)write(customerAddress,right,y,half,false,7.6,GREY);
  y+=addrHeight+19;
  ensure(62);
  pdf.roundedRect(L,y,W,49,3).fill("#f7f8fa");
  const meta=[
   ["INVOICE NUMBER",invoice.invoiceNo],
   ["ISSUE DATE",invoice.issueDate.toISOString().slice(0,10)],
   ["DUE DATE",invoice.dueDate?invoice.dueDate.toISOString().slice(0,10):"—"],
  ];
  const cell=W/3;
  meta.forEach(([label,val],i)=>{
    const x=L+12+i*cell;
    write(label,x,y+9,cell-16,true,6.5,GREY);
    write(val.slice(0,75),x,y+25,cell-16,true,8.7,INK);
  });
  y+=72;
  ensure(62);
  write("INVOICE ITEMS",L,y,200,true,8.5,NAVY);y+=15;
  const columns=[L,L+246,L+296,L+353,L+433,R];
  function tableHead(){
   pdf.rect(L,y,W,25).fill(NAVY);
   const heads=[["DESCRIPTION",columns[0]+9,238,"left"],["QTY",columns[1],44,"right"],["UNIT",columns[2]+4,48,"left"],["UNIT PRICE",columns[3],70,"right"],["AMOUNT",columns[4],R-columns[4]-9,"right"]] as const;
   for(const [label,x,width,align] of heads)write(label,x,y+8,width,true,6.4,"#ffffff",align);
   y+=25;
  }
  tableHead();
  totals.lines.forEach((item,index)=>{
   const desc=item.description.slice(0,650);
   const rowHeight=Math.max(27,height(desc,229,false,7.8)+12);
   if(y+rowHeight>BOTTOM){pdf.addPage();y=L+6;tableHead();}
   if(index%2===1)pdf.rect(L,y,W,rowHeight).fill("#f8f9fb");
   write(desc,L+9,y+8,229,false,7.8);
   write(item.quantity,columns[1],y+8,44,false,7.7,INK,"right");
   write(item.unit.slice(0,40),columns[2]+4,y+8,48,false,7.7);
   write(item.unitPrice,columns[3],y+8,70,false,7.7,INK,"right");
   write(formatMinor(item.amountMinor,currency),columns[4],y+8,R-columns[4]-9,true,7.8,INK,"right");
   y+=rowHeight;rule(y); 
  });
  y+=14;ensure(116);
  const sums:Array<[string,string,boolean]>=[["Subtotal",formatMinor(totals.subtotalMinor,currency),false]];
  if(totals.discountMinor)sums.push(["Discount","-"+formatMinor(totals.discountMinor,currency),false]);
  if(totals.extraChargeMinor)sums.push(["Additional charges",formatMinor(totals.extraChargeMinor,currency),false]);
  if(totals.taxMinor)sums.push(["Tax / other charges",formatMinor(totals.taxMinor,currency),false]);
  const sx=L+260,sw=W-260;
  for(const [label,val] of sums){
    write(label,sx,y,sw*.55,false,7.9,GREY);
    write(currency+" "+val,sx+sw*.55,y,sw*.45,false,7.9,INK,"right");y+=20;
  }
  y+=4;pdf.roundedRect(sx-8,y,sw+8,40,3).fill(NAVY);
  write("TOTAL AMOUNT DUE",sx,y+11,sw*.5,true,6.6,"#e5eaf0");
  write(currency+" "+invoice.total,sx+sw*.43,y+12,sw*.55,true,10.5,"#ffffff","right");
  y+=61;
  ensure(125);
  write("BANK TRANSFER INSTRUCTIONS",L,y,360,true,8.5,NAVY);y+=15;rule(y);y+=11;
  const banking:[string,string][]=[
   ["ACCOUNT NUMBER",str(bank.account)],["CURRENCY",str(bank.currency)||currency],
   ["ACCOUNT NAME",str(bank.beneficiary)],["ACCOUNT ADDRESS",str(bank.accountAddress)],
   ["BANK NAME",str(bank.bank)],["BANK ADDRESS",str(bank.bankAddress)],
   ["BRANCH",str(bank.branch)],["SWIFT / BIC",str(bank.swift)]
  ];
  for(const [label,value] of banking){
   if(!value)continue;
   const lines=height(value,320,false,7.8),rh=Math.max(20,lines+7);
   ensure(rh);
   write(label,L,y+2,150,true,6.8,GREY);
   write(value.slice(0,800),L+167,y,332,false,7.8,INK);
   y+=rh;
  }
  if(invoice.notes){
   y+=8;ensure(65);rule(y);y+=11;
   block("PAYMENT TERMS & NOTES",W,8.5,true,NAVY,8);
   block(invoice.notes.slice(0,1700),W,7.8,false,INK,10);
  }
  const pageRange=pdf.bufferedPageRange();
  for(let p=0;p<pageRange.count;p++){
   pdf.switchToPage(pageRange.start+p);
   rule(775);
   write("COMMERCIAL PAYMENT REQUEST · NOT A VIETNAMESE VAT E-INVOICE",L,786,420,false,6.2,GREY);
   write(`${p+1} / ${pageRange.count}`,R-58,786,58,false,6.2,GREY,"right");
  }
  pdf.end();
 });
}
