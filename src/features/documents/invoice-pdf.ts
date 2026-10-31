import PDFDocument from "pdfkit";
import { resolve as resolvePath } from "node:path";
import { calculateCustomInvoice, formatMinor, type InvoiceCurrency, type InvoiceLine } from "./custom-invoice-calculation";
import { vncLogoPngBuffer } from "./vnc-invoice-brand";

type InvoicePdfInput = {
  invoiceNo: string; recipientName: string; recipientAddress?: string | null;
  issuerName: string; issuerAddress?: string | null; currency: string; total: string;
  issueDate: Date; dueDate?: Date | null; lines: unknown; adjustments?: unknown;
  bankDetails?: unknown; notes?: string | null;
};
const L=46, R=549, W=R-L, BOTTOM=746, INK="#1a2837", NAVY="#22344a", GREY="#617186", LIGHT="#e6ebf0";
function object(v:unknown):Record<string,unknown>{return v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};}
function str(v:unknown):string{return typeof v==="string"?v:"";}
function items(v:unknown):InvoiceLine[]{
 if(!Array.isArray(v))throw new Error("Invoice has no line items");
 return v.map(raw=>{const r=object(raw);return {description:str(r.description),quantity:str(r.quantity),unit:str(r.unit),unitPrice:str(r.unitPrice)};});
}
export function renderInvoicePdf(invoice:InvoicePdfInput):Promise<Buffer>{
 const currency=invoice.currency as InvoiceCurrency,adjustments=object(invoice.adjustments);
 const totals=calculateCustomInvoice({currency,lines:items(invoice.lines),discount:str(adjustments.discount)||"0",extraCharge:str(adjustments.extraCharge)||"0",tax:str(adjustments.tax)||"0"});
 if(formatMinor(totals.totalMinor,currency)!==invoice.total)throw new Error("Saved invoice total does not match line items");
 const bank=object(invoice.bankDetails);
 return new Promise((resolve,reject)=>{
  const pdf=new PDFDocument({size:"A4",margin:L,bufferPages:true});
  // Retain the proven Unicode font for PDF; the document uses the same enterprise sizing as the web preview.
  pdf.registerFont("Body",resolvePath(process.cwd(),"node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf"));
  pdf.registerFont("Heading",resolvePath(process.cwd(),"node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf"));
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
   pdf.image(vncLogoPngBuffer(),L,43,{fit:[163,50],align:"left"});
   write("COMMERCIAL",324,49,225,true,19,NAVY,"right");
   write("INVOICE",324,74,225,true,19,NAVY,"right");
   write("PAYMENT REQUEST",343,102,206,false,8,GREY,"right");
   rule(124,NAVY);
   y=145;
  }
  companyHeader();
  // Company identity and document metadata.
  const half=(W-22)/2,right=L+half+22;
  write("ISSUED BY",L,y,half,true,8,GREY);
  write("BILL TO",right,y,half,true,8,GREY);
  y+=17;
  const issuerName=invoice.issuerName.slice(0,500),recipientName=invoice.recipientName.slice(0,500);
  const issuerHeight=height(issuerName,half,true,10),customerHeight=height(recipientName,half,true,10);
  write(issuerName,L,y,half,true,10);write(recipientName,right,y,half,true,10);
  y+=Math.max(issuerHeight,customerHeight)+8;
  const issuerAddress=str(invoice.issuerAddress).slice(0,850),customerAddress=str(invoice.recipientAddress).slice(0,850);
  const addrHeight=Math.max(issuerAddress?height(issuerAddress,half,false,8.3):0,customerAddress?height(customerAddress,half,false,8.3):0);
  if(issuerAddress)write(issuerAddress,L,y,half,false,8.3,GREY);
  if(customerAddress)write(customerAddress,right,y,half,false,8.3,GREY);
  y+=addrHeight+21;
  ensure(80);
  pdf.roundedRect(L,y,W,60,5).fill("#f5f7f9");
  const meta=[
   ["INVOICE NUMBER",invoice.invoiceNo],
   ["ISSUE DATE",invoice.issueDate.toISOString().slice(0,10)],
   ["DUE DATE",invoice.dueDate?invoice.dueDate.toISOString().slice(0,10):"—"],
  ];
  const cell=W/3;
  meta.forEach(([label,val],i)=>{
    const x=L+14+i*cell;
    write(label,x,y+12,cell-14,true,7,GREY);
    write(val.slice(0,75),x,y+30,cell-14,true,10,INK);
  });
  y+=90;
  ensure(62);
  write("INVOICE ITEMS",L,y,200,true,10,NAVY);y+=17;
  const columns=[L,L+246,L+296,L+353,L+433,R];
  function tableHead(){
   pdf.rect(L,y,W,31).fill(NAVY);
   const heads=[["DESCRIPTION",columns[0]+9,238,"left"],["QTY",columns[1],44,"right"],["UNIT",columns[2]+4,48,"left"],["UNIT PRICE",columns[3],70,"right"],["AMOUNT",columns[4],R-columns[4]-9,"right"]] as const;
   for(const [label,x,width,align] of heads)write(label,x,y+10,width,true,7,"#ffffff",align);
   y+=31;
  }
  tableHead();
  totals.lines.forEach((item,index)=>{
   const desc=item.description.slice(0,650);
   const rowHeight=Math.max(34,height(desc,229,false,8.6)+15);
   if(y+rowHeight>BOTTOM){pdf.addPage();y=L+6;tableHead();}
   if(index%2===1)pdf.rect(L,y,W,rowHeight).fill("#f8f9fb");
   write(desc,L+9,y+10,229,false,8.6);
   write(item.quantity,columns[1],y+10,44,false,8.2,INK,"right");
   write(item.unit.slice(0,40),columns[2]+4,y+10,48,false,8.2);
   write(item.unitPrice,columns[3],y+10,70,false,8.2,INK,"right");
   write(formatMinor(item.amountMinor,currency),columns[4],y+10,R-columns[4]-9,true,8.2,INK,"right");
   y+=rowHeight;rule(y); 
  });
  y+=18;ensure(135);
  const sums:Array<[string,string,boolean]>=[["Subtotal",formatMinor(totals.subtotalMinor,currency),false]];
  if(totals.discountMinor)sums.push(["Discount","-"+formatMinor(totals.discountMinor,currency),false]);
  if(totals.extraChargeMinor)sums.push(["Additional charges",formatMinor(totals.extraChargeMinor,currency),false]);
  if(totals.taxMinor)sums.push(["Tax / other charges",formatMinor(totals.taxMinor,currency),false]);
  const sx=L+260,sw=W-260;
  for(const [label,val] of sums){
    write(label,sx,y,sw*.55,false,8.7,GREY);
    write(currency+" "+val,sx+sw*.55,y,sw*.45,false,8.7,INK,"right");y+=23;
  }
  y+=4;pdf.roundedRect(sx-10,y,sw+10,49,4).fill(NAVY);
  write("TOTAL AMOUNT DUE",sx,y+11,sw*.5,true,7.5,"#dbe5ee");
  write(currency+" "+invoice.total,sx+sw*.43,y+13,sw*.55,true,13,"#ffffff","right");
  y+=76;
  ensure(160);
  write("BANK TRANSFER INSTRUCTIONS",L,y,360,true,10,NAVY);y+=18;rule(y);y+=13;
  const banking:[string,string][]=[
   ["BENEFICIARY",str(bank.beneficiary)],["BANK",str(bank.bank)],["ACCOUNT NUMBER",str(bank.account)],["SWIFT / BIC",str(bank.swift)]
  ];
  for(const [label,value] of banking){
   if(!value)continue;
   const lines=height(value,320,false,8.8),rh=Math.max(24,lines+9);
   ensure(rh);
   write(label,L,y+2,150,true,7.7,GREY);
   write(value.slice(0,800),L+167,y,336,false,8.8,INK);
   y+=rh;
  }
  if(invoice.notes){
   y+=10;ensure(74);rule(y);y+=13;
   block("PAYMENT TERMS & NOTES",W,9.5,true,NAVY,9);
   block(invoice.notes.slice(0,1700),W,8.8,false,INK,12);
  }
  const pageRange=pdf.bufferedPageRange();
  for(let p=0;p<pageRange.count;p++){
   pdf.switchToPage(pageRange.start+p);
   rule(775);
   write("COMMERCIAL PAYMENT REQUEST · NOT A VIETNAMESE VAT E-INVOICE",L,786,420,false,7,GREY);
   write(`${p+1} / ${pageRange.count}`,R-58,786,58,false,7,GREY,"right");
  }
  pdf.end();
 });
}
