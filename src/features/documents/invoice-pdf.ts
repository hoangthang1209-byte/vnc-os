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
const L=48, R=547, W=R-L, BOTTOM=746, INK="#1a2837", NAVY="#22344a", GREY="#617186", LIGHT="#e6ebf0";
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
  function font(bold=false,size=8,color=INK){pdf.font(bold?"Heading":"Body").fontSize(size).fillColor(color);}
  function height(value:string,width:number,bold=false,size=8){font(bold,size);return pdf.heightOfString(value,{width});}
  function write(value:string,x:number,top:number,width:number,bold=false,size=8,color=INK,align:"left"|"right"="left"){
   font(bold,size,color);pdf.text(value,x,top,{width,align});
  }
  function rule(top:number,color=LIGHT){pdf.strokeColor(color).lineWidth(.7).moveTo(L,top).lineTo(R,top).stroke();}
  function ensure(space:number){if(y+space>BOTTOM){pdf.addPage();y=L+8;}}
  function block(value:string,width=W,size=8,bold=false,color=INK,space=5){
   const h=height(value,width,bold,size);ensure(h+space);write(value,L,y,width,bold,size,color);y+=h+space;
  }
  function companyHeader(){
   pdf.image(vncLogoPngBuffer(),L,45,{fit:[136,42]});
   write("COMMERCIAL",328,48,219,true,15.5,NAVY,"right");
   write("INVOICE",328,67,219,true,15.5,NAVY,"right");
   write("PAYMENT REQUEST",349,91,198,false,7,GREY,"right");
   rule(112,NAVY);
   y=131;
  }
  companyHeader();
  // Company identity and document metadata.
  const half=(W-24)/2,right=L+half+24;
  write("ISSUED BY",L,y,half,true,7,GREY);
  write("BILL TO",right,y,half,true,7,GREY);
  y+=14;
  const issuerName=invoice.issuerName.slice(0,500),recipientName=invoice.recipientName.slice(0,500);
  const issuerHeight=height(issuerName,half,true,9),customerHeight=height(recipientName,half,true,9);
  write(issuerName,L,y,half,true,9);write(recipientName,right,y,half,true,9);
  y+=Math.max(issuerHeight,customerHeight)+5;
  const issuerAddress=str(invoice.issuerAddress).slice(0,850),customerAddress=str(invoice.recipientAddress).slice(0,850);
  const addrHeight=Math.max(issuerAddress?height(issuerAddress,half,false,7.7):0,customerAddress?height(customerAddress,half,false,7.7):0);
  if(issuerAddress)write(issuerAddress,L,y,half,false,7.7,GREY);
  if(customerAddress)write(customerAddress,right,y,half,false,7.7,GREY);
  y+=addrHeight+16;
  ensure(64);
  pdf.roundedRect(L,y,W,48,3).fill("#f7f8fa");
  const meta=[
   ["INVOICE NUMBER",invoice.invoiceNo],
   ["ISSUE DATE",invoice.issueDate.toISOString().slice(0,10)],
   ["DUE DATE",invoice.dueDate?invoice.dueDate.toISOString().slice(0,10):"—"],
  ];
  const cell=W/3;
  meta.forEach(([label,val],i)=>{
    const x=L+12+i*cell;
    write(label,x,y+9,cell-18,true,6.5,GREY);
    write(val.slice(0,75),x,y+24,cell-18,true,8.8,INK);
  });
  y+=69;
  ensure(48);
  write("INVOICE ITEMS",L,y,200,true,9,NAVY);y+=15;
  const columns=[L,L+246,L+296,L+353,L+433,R];
  function tableHead(){
   pdf.rect(L,y,W,26).fill(NAVY);
   const heads=[["DESCRIPTION",columns[0]+9,238,"left"],["QTY",columns[1],44,"right"],["UNIT",columns[2]+4,48,"left"],["UNIT PRICE",columns[3],70,"right"],["AMOUNT",columns[4],R-columns[4]-9,"right"]] as const;
   for(const [label,x,width,align] of heads)write(label,x,y+8,width,true,6.4,"#ffffff",align);
   y+=26;
  }
  tableHead();
  totals.lines.forEach((item,index)=>{
   const desc=item.description.slice(0,650);
   const rowHeight=Math.max(28,height(desc,229,false,7.8)+12);
   if(y+rowHeight>BOTTOM){pdf.addPage();y=L+6;tableHead();}
   if(index%2===1)pdf.rect(L,y,W,rowHeight).fill("#f8f9fb");
   write(desc,L+9,y+8,229,false,7.8);
   write(item.quantity,columns[1],y+8,44,false,7.7,INK,"right");
   write(item.unit.slice(0,40),columns[2]+4,y+8,48,false,7.7);
   write(item.unitPrice,columns[3],y+8,70,false,7.7,INK,"right");
   write(formatMinor(item.amountMinor,currency),columns[4],y+8,R-columns[4]-9,true,7.7,INK,"right");
   y+=rowHeight;rule(y); 
  });
  y+=14;ensure(112);
  const sums:Array<[string,string,boolean]>=[["Subtotal",formatMinor(totals.subtotalMinor,currency),false]];
  if(totals.discountMinor)sums.push(["Discount","-"+formatMinor(totals.discountMinor,currency),false]);
  if(totals.extraChargeMinor)sums.push(["Additional charges",formatMinor(totals.extraChargeMinor,currency),false]);
  if(totals.taxMinor)sums.push(["Tax / other charges",formatMinor(totals.taxMinor,currency),false]);
  const sx=L+260,sw=W-260;
  for(const [label,val] of sums){
    write(label,sx,y,sw*.55,false,7.8,GREY);
    write(currency+" "+val,sx+sw*.55,y,sw*.45,false,7.8,INK,"right");y+=18;
  }
  y+=4;pdf.roundedRect(sx-10,y,sw+10,38,3).fill(NAVY);
  write("TOTAL AMOUNT DUE",sx,y+11,sw*.5,true,6.8,"#dbe5ee");
  write(currency+" "+invoice.total,sx+sw*.43,y+11,sw*.55,true,11.2,"#ffffff","right");
  y+=57;
  ensure(122);
  write("BANK TRANSFER INSTRUCTIONS",L,y,360,true,9,NAVY);y+=15;rule(y);y+=11;
  const banking:[string,string][]=[
   ["BENEFICIARY",str(bank.beneficiary)],["BANK",str(bank.bank)],["ACCOUNT NUMBER",str(bank.account)],["SWIFT / BIC",str(bank.swift)]
  ];
  for(const [label,value] of banking){
   if(!value)continue;
   const lines=height(value,320,false,7.8),rh=Math.max(20,lines+7);
   ensure(rh);
   write(label,L,y+2,150,true,7,GREY);
   write(value.slice(0,800),L+167,y,332,false,7.8,INK);
   y+=rh;
  }
  if(invoice.notes){
   y+=8;ensure(62);rule(y);y+=11;
   block("PAYMENT TERMS & NOTES",W,9,true,NAVY,7);
   block(invoice.notes.slice(0,1700),W,7.8,false,INK,10);
  }
  const pageRange=pdf.bufferedPageRange();
  for(let p=0;p<pageRange.count;p++){
   pdf.switchToPage(pageRange.start+p);
   rule(775);
   write("COMMERCIAL PAYMENT REQUEST · NOT A VIETNAMESE VAT E-INVOICE",L,786,420,false,6.5,GREY);
   write(`${p+1} / ${pageRange.count}`,R-58,786,58,false,6.5,GREY,"right");
  }
  pdf.end();
 });
}
