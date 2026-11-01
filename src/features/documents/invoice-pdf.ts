import PDFDocument from "pdfkit";
import { resolve as resolvePath } from "node:path";
import { calculateCustomInvoice, formatMinor, type InvoiceCurrency, type InvoiceLine } from "./custom-invoice-calculation";
import { vncLogoPngBuffer } from "./vnc-invoice-brand";
import { loadInvoiceInterFont } from "./inter-font";

type InvoicePdfInput = {
  invoiceNo: string; recipientName: string; recipientAddress?: string | null;
  issuerName: string; issuerAddress?: string | null; currency: string; total: string;
  issueDate: Date; dueDate?: Date | null; lines: unknown; adjustments?: unknown;
  bankDetails?: unknown; notes?: string | null; createdByDisplayName?: string | null; preparedByName?: string | null;
  companyLogoUrl?: string | null;
};
async function companyLogoBuffer(source: string | null | undefined): Promise<Buffer> {
  const fallback=vncLogoPngBuffer();
  try {
    if(!source)return fallback;
    const url=new URL(source);
    // Do not fetch arbitrary user-controlled URLs from the PDF server.
    const trusted=url.protocol==="https:" && (
      url.hostname.endsWith(".public.blob.vercel-storage.com") ||
      url.hostname==="res.cloudinary.com"
    );
    if(!trusted)return fallback;
    const response=await fetch(source,{cache:"no-store",signal:AbortSignal.timeout(4000)});
    const kind=response.headers.get("content-type")||"";
    const length=Number(response.headers.get("content-length")||0);
    if(!response.ok || !/^image\/(png|jpeg)(?:;|$)/i.test(kind) || length>3_000_000)return fallback;
    const bytes=Buffer.from(await response.arrayBuffer());
    return bytes.length>0 && bytes.length<=3_000_000?bytes:fallback;
  }catch{return fallback;}
}
const L=48, R=547, W=R-L, BOTTOM=759, INK="#222c39", NAVY="#273647", GREY="#77818f", LIGHT="#e9edf1";
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
 const logoBuffer=await companyLogoBuffer(invoice.companyLogoUrl);
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
   // Restrained enterprise letterhead — artwork and title remain clearly separated.
   // Wider, taller VNC artwork without crowding the invoice title or line items.
   pdf.image(logoBuffer,L,35,{fit:[177,50],valign:"center"});
   write("COMMERCIAL INVOICE",309,47,238,true,12.8,NAVY,"right");
   write("PAYMENT REQUEST",344,66,203,false,7,GREY,"right");
   pdf.strokeColor(NAVY).lineWidth(1.1).moveTo(L,95).lineTo(R,95).stroke();
   y=107;
  }
  companyHeader();
  // Company identity and document metadata.
  const half=(W-26)/2,right=L+half+26;
  write("ISSUED BY",L,y,half,true,7,GREY);
  write("BILL TO",right,y,half,true,7,GREY);
  y+=12;
  const issuerName=invoice.issuerName.slice(0,500),recipientName=invoice.recipientName.slice(0,500);
  const issuerHeight=height(issuerName,half,true,9.1),customerHeight=height(recipientName,half,true,9.1);
  write(issuerName,L,y,half,true,9.1);write(recipientName,right,y,half,true,9.1);
  y+=Math.max(issuerHeight,customerHeight)+4;
  const issuerAddress=str(invoice.issuerAddress).slice(0,850),customerAddress=str(invoice.recipientAddress).slice(0,850);
  const addrHeight=Math.max(issuerAddress?height(issuerAddress,half,false,7.6):0,customerAddress?height(customerAddress,half,false,7.6):0);
  if(issuerAddress)write(issuerAddress,L,y,half,false,7.6,GREY);
  if(customerAddress)write(customerAddress,right,y,half,false,7.6,GREY);
  y+=addrHeight+12;
  ensure(48);
  pdf.roundedRect(L,y,W,39,3).fill("#f7f8fa");
  const meta=[
   ["INVOICE NUMBER",invoice.invoiceNo],
   ["ISSUE DATE",invoice.issueDate.toISOString().slice(0,10)],
   ["DUE DATE",invoice.dueDate?invoice.dueDate.toISOString().slice(0,10):"—"],
  ];
  const cell=W/3;
  meta.forEach(([label,val],i)=>{
    const x=L+12+i*cell;
    write(label,x,y+5,cell-16,true,6.4,GREY);
    write(val.slice(0,75),x,y+19,cell-16,true,8.5,INK);
  });
  y+=51;
  ensure(42);
  write("INVOICE ITEMS",L,y,200,true,8.3,NAVY);y+=13;
  const columns=[L,L+246,L+296,L+353,L+433,R];
  function tableHead(){
   pdf.rect(L,y,W,22).fill(NAVY);
   const heads=[["DESCRIPTION",columns[0]+9,238,"left"],["QTY",columns[1],44,"right"],["UNIT",columns[2]+4,48,"left"],["UNIT PRICE",columns[3],70,"right"],["AMOUNT",columns[4],R-columns[4]-9,"right"]] as const;
   for(const [label,x,width,align] of heads)write(label,x,y+6,width,true,6.3,"#ffffff",align);
   y+=22;
  }
  tableHead();
  totals.lines.forEach((item,index)=>{
   const desc=item.description.slice(0,650);
   const rowHeight=Math.max(22,height(desc,229,false,7.5)+8);
   if(y+rowHeight>BOTTOM){pdf.addPage();y=L+6;tableHead();}
   if(index%2===1)pdf.rect(L,y,W,rowHeight).fill("#f8f9fb");
   write(desc,L+9,y+5,229,false,7.5);
   write(item.quantity,columns[1],y+5,44,false,7.5,INK,"right");
   write(item.unit.slice(0,40),columns[2]+4,y+5,48,false,7.5);
   write(item.unitPrice,columns[3],y+5,70,false,7.5,INK,"right");
   write(formatMinor(item.amountMinor,currency),columns[4],y+5,R-columns[4]-9,true,7.6,INK,"right");
   y+=rowHeight;rule(y); 
  });
  y+=7;
  const sums:Array<[string,string,boolean]>=[["Subtotal",formatMinor(totals.subtotalMinor,currency),false]];
  if(totals.discountMinor)sums.push(["Discount","-"+formatMinor(totals.discountMinor,currency),false]);
  if(totals.extraChargeMinor)sums.push(["Additional charges",formatMinor(totals.extraChargeMinor,currency),false]);
  if(totals.taxMinor)sums.push(["Tax / other charges",formatMinor(totals.taxMinor,currency),false]);
  ensure(sums.length*16+43);
  const sx=L+260,sw=W-260;
  for(const [label,val] of sums){
    write(label,sx,y,sw*.55,false,7.9,GREY);
    write(currency+" "+val,sx+sw*.55,y,sw*.45,false,7.9,INK,"right");y+=16;
  }
  y+=3;pdf.roundedRect(sx-8,y,sw+8,32,3).fill(NAVY);
  write("TOTAL AMOUNT DUE",sx,y+8,sw*.5,true,6.6,"#e5eaf0");
  write(currency+" "+invoice.total,sx+sw*.43,y+8,sw*.55,true,10.2,"#ffffff","right");
  y+=40;
  // Compact two-column banking grid. All remittance fields remain readable and
  // complete; the layout only changes their presentation, never saved data.
  const bankPairs:[string,string,string,string][]=[
   ["ACCOUNT NAME",str(bank.beneficiary),"BANK NAME",str(bank.bank)],
   ["ACCOUNT NUMBER",str(bank.account),"CURRENCY",str(bank.currency)||currency],
   ["SWIFT / BIC",str(bank.swift),"BRANCH",str(bank.branch)],
   ["ACCOUNT ADDRESS",str(bank.accountAddress),"BANK ADDRESS",str(bank.bankAddress)],
  ];
  const bankGap=20,bankCol=(W-bankGap)/2;
  const bankLabelWidth=73,bankValueWidth=bankCol-bankLabelWidth-7;
  const bankRows=bankPairs.map(([leftLabel,leftValue,rightLabel,rightValue])=>{
   const leftHeight=leftValue?height(leftValue,bankValueWidth,leftLabel==="ACCOUNT NUMBER"||leftLabel==="ACCOUNT NAME",7.15):0;
   const rightHeight=rightValue?height(rightValue,bankValueWidth,rightLabel==="ACCOUNT NUMBER"||rightLabel==="ACCOUNT NAME",7.15):0;
   return {leftLabel,leftValue,rightLabel,rightValue,rowHeight:Math.max(17,leftHeight+4,rightHeight+4)};
  }).filter(row=>row.leftValue||row.rightValue);
  const bankHeight=23+bankRows.reduce((sum,row)=>sum+row.rowHeight,0);
  ensure(bankHeight+6);
  write("BANK TRANSFER DETAILS",L,y,340,true,8.3,NAVY);y+=13;
  pdf.strokeColor("#cdd7e1").lineWidth(.7).moveTo(L,y).lineTo(R,y).stroke();y+=10;
  for(const row of bankRows){
   const cells:[[string,string,number],[string,string,number]]=[
    [row.leftLabel,row.leftValue,L],
    [row.rightLabel,row.rightValue,L+bankCol+bankGap],
   ];
   for(const [label,value,x] of cells){
    if(!value)continue;
    const emphasis=label==="ACCOUNT NUMBER"||label==="ACCOUNT NAME";
    write(label,x,y+1,bankLabelWidth-3,true,6.15,GREY);
    write(value.slice(0,800),x+bankLabelWidth,y,bankValueWidth,emphasis,7.15,INK);
   }
   y+=row.rowHeight;
  }
  if(invoice.notes){
   y+=4;ensure(45);rule(y);y+=7;
   block("PAYMENT TERMS & NOTES",W,8,true,NAVY,4);
   block(invoice.notes.slice(0,1700),W,7.4,false,INK,6);
  }
  // New invoices show verified Sales/Account; legacy immutable snapshots retain
  // their original creator attribution with an explicit CREATED BY label.
  const historicalCreator=!invoice.preparedByName && invoice.createdByDisplayName &&
    invoice.createdByDisplayName!=="Legacy / not recorded" ? invoice.createdByDisplayName : null;
  const attribution=invoice.preparedByName||historicalCreator;
  if(attribution){
   // Optional wet-signature zone on the right; the verified Sales/Account
   // preparer is not the same as the authenticated audit creator.
   y+=8;
   ensure(invoice.preparedByName?75:35);
   const signatureX=R-193,signatureWidth=193;
   if(invoice.preparedByName){
    write("PREPARED BY / NGƯỜI LẬP",signatureX,y,signatureWidth,true,7.2,NAVY,"right");
    y+=39; // Clear blank area for handwritten signature on the right.
    pdf.strokeColor("#b7c1cd").lineWidth(.7).moveTo(signatureX+26,y).lineTo(R,y).stroke();
    y+=6;
    write(attribution.slice(0,160),signatureX,y,signatureWidth,true,8,INK,"right");
    y+=17;
   }else{
    write("CREATED BY (SYSTEM AUDIT)",signatureX,y,signatureWidth,true,6.8,GREY,"right");
    write(attribution.slice(0,160),signatureX,y+17,signatureWidth,false,7.8,INK,"right");
    y+=35;
   }
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
