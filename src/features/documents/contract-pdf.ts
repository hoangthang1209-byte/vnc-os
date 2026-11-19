import PDFDocument from "pdfkit";
import {loadInvoiceInterFont} from "./inter-font";
import {party,type ContractParty,type ContractItem,type ContractClause,type PaymentMilestone} from "./contract-fields";

export type ContractPrint={
 contractNo:string;status:string;language:string;title:string;
 seller:unknown;buyer:unknown;goods:unknown;clauses:unknown;paymentTerms:unknown;
 currency:string;subtotal:string;taxAmount:string;grandTotal:string;
 signedDate:Date|null;deliveryDate:Date|null;effectiveDate:Date|null;
 deliveryAddress:string|null;notes:string|null;
};
const C={navy:"#17324D",ink:"#26394A",muted:"#607386",line:"#D6E0E8",pale:"#F1F5F8",white:"#FFFFFF",accent:"#27819A"};
const list=<T>(x:unknown):T[]=>Array.isArray(x)?x as T[]:[];
const fmt=(v:number,currency:string)=>new Intl.NumberFormat(currency==="VND"?"vi-VN":"en-US",{
 minimumFractionDigits:currency==="VND"?0:2,maximumFractionDigits:currency==="VND"?0:2
}).format(v);
const date=(v:Date|null)=>v&&Number.isFinite(v.getTime())?v.toISOString().slice(0,10):"—";

/** New contracts use V2; issued V1 snapshots keep their original renderer. */
export async function renderContractPdf(c:ContractPrint):Promise<Buffer>{
 const vi=c.language==="VI",seller=party(c.seller),buyer=party(c.buyer);
 const goods=list<ContractItem>(c.goods),clauses=list<ContractClause>(c.clauses),milestones=list<PaymentMilestone>(c.paymentTerms);
 const font=await loadInvoiceInterFont();
 return new Promise((resolve,reject)=>{
  const pdf=new PDFDocument({size:"A4",margins:{top:45,bottom:58,left:45,right:45},bufferPages:true,autoFirstPage:true});
  pdf.registerFont("vn",font);pdf.registerFont("vn-bold",font);
  const chunks:Buffer[]=[];pdf.on("data",(x:Buffer)=>chunks.push(x));pdf.on("error",reject);pdf.on("end",()=>resolve(Buffer.concat(chunks)));
  const X=45,W=505,R=X+W,TOP=45,BOTTOM=753;
  let y=TOP;
  const style=(size=9,bold=false,color=C.ink)=>pdf.font(bold?"vn-bold":"vn").fontSize(size).fillColor(color);
  const height=(value:string,w:number,size=9)=>{style(size);return pdf.heightOfString(value||" ",{width:w,lineGap:2});};
  function rule(at=y){pdf.moveTo(X,at).lineTo(R,at).lineWidth(.7).strokeColor(C.line).stroke();}
  function page(){
   pdf.addPage();y=TOP+19;
   style(8,true,C.navy).text("VNC  /  DOCUMENT CENTER",X,TOP,{width:300,lineBreak:false});
   style(8,false,C.muted).text(c.contractNo,R-175,TOP,{width:175,align:"right",lineBreak:false});
   rule(TOP+15);
  }
  function keep(h:number){if(y+h>BOTTOM)page();}
  function t(value:string,size=9,bold=false,color=C.ink,after=8,indent=0){
   const body=value||"—",w=W-indent;
   // Long clauses paginate by wrapped text lines; never crop past the bottom.
   style(size,bold,color);
   const words=body.replace(/\r/g,"").split(/(\s+)/).filter(Boolean);
   let line="";
   const lines:string[]=[];
   for(const token of words){
    if(token.includes("\n")){for(const part of token.split("\n")){if(line){lines.push(line.trim());line="";}if(part.trim())lines.push(part.trim());}continue;}
    const next=line+token;
    if(pdf.widthOfString(next)>w&&line.trim()){lines.push(line.trim());line=token.trimStart();}else line=next;
   }
   if(line.trim())lines.push(line.trim());
   if(!lines.length)lines.push(" ");
   const lh=Math.max(13,height("Ag",w,size)+1);
   for(const one of lines){keep(lh+2);style(size,bold,color).text(one,X+indent,y,{width:w,lineBreak:false});y+=lh;}
   y+=after;
  }
  function section(title:string,number?:string){
   keep(42);y+=11;
   pdf.rect(X,y,W,26).fill(C.pale);
   pdf.rect(X,y,3,26).fill(C.accent);
   style(9.1,true,C.navy).text((number?number+"  ":"")+title,X+13,y+8,{width:W-24,lineBreak:false});
   y+=36;
  }
  function labelValue(label:string,value:string,width=W){
   if(!value)return;
   const labelW=vi?106:105,contentW=width-labelW-10;
   const h=Math.max(height(label,labelW,8),height(value,contentW,8.4))+7;
   keep(h);
   style(7.9,false,C.muted).text(label,X,y,{width:labelW});
   style(8.4,true,C.ink).text(value,X+labelW,y,{width:contentW});
   y+=h;
  }
  function partyBlock(info:ContractParty,heading:string,letter:string){
   keep(85);y+=3;
   pdf.roundedRect(X,y,27,27,5).fill(C.navy);
   style(11,true,C.white).text(letter,X,y+7,{width:27,align:"center",lineBreak:false});
   style(8.5,true,C.accent).text(heading,X+38,y+1,{width:W-38,lineBreak:false});
   style(10,true,C.navy).text(info.name,X+38,y+14,{width:W-38});
   y+=Math.max(40,height(info.name,W-38,10)+20);
   labelValue(vi?"Địa chỉ":"Address",info.address);
   labelValue(vi?"Mã số thuế":"Tax ID",info.taxId);
   labelValue(vi?"Người đại diện":"Representative",info.representative);
   labelValue(vi?"Chức danh":"Position",info.title);
   if(info.phone)labelValue(vi?"Điện thoại":"Phone",info.phone);
   if(info.email)labelValue("Email",info.email);
   if(info.accountNo||info.bankName){
    labelValue(vi?"Ngân hàng":"Bank",info.bankName);
    labelValue(vi?"Tài khoản":"Account",info.accountNo);
    if(info.accountName)labelValue(vi?"Thụ hưởng":"Beneficiary",info.accountName);
    if(info.swift)labelValue("SWIFT",info.swift);
   }
   y+=5;
  }
  function tableHeader(columns:{label:string;width:number}[]){
   keep(28);pdf.rect(X,y,W,27).fill(C.navy);
   let x=X;
   for(const col of columns){style(7.1,true,C.white).text(col.label,x+5,y+9,{width:col.width-10,align:x===X?"center":"left",lineBreak:false});x+=col.width;}
   y+=27;
  }
  function tableRow(cells:string[],widths:number[],minH=30,emph=false){
   const heights=cells.map((cell,i)=>height(cell,widths[i]-12,8));
   const h=Math.max(minH,...heights.map(z=>z+13));
   keep(h);
   if(emph)pdf.rect(X,y,W,h).fill(C.pale);
   else if(Math.round(y)%2===0)pdf.rect(X,y,W,h).fill("#FBFCFD");
   let x=X;
   for(let i=0;i<cells.length;i++){
    if(i>0)pdf.moveTo(x,y).lineTo(x,y+h).lineWidth(.35).strokeColor(C.line).stroke();
    style(8,emph,C.ink).text(cells[i],x+6,y+7,{width:widths[i]-12,align:i===0?"center":i>=3?"right":"left"});
    x+=widths[i];
   }
   pdf.rect(X,y,W,h).lineWidth(.4).strokeColor(C.line).stroke();y+=h;
  }
  // Brand-led masthead. No official seals or legal certification are implied.
  pdf.rect(X,TOP,5,46).fill(C.accent);
  style(10.4,true,C.navy).text("VIETNAM CLOTHING",X+16,TOP+1,{width:270,lineBreak:false});
  style(7.3,false,C.muted).text("MANUFACTURING  /  DOCUMENTS",X+16,TOP+19,{width:270,lineBreak:false});
  style(7.4,true,C.muted).text(vi?"HỢP ĐỒNG THƯƠNG MẠI":"COMMERCIAL AGREEMENT",R-165,TOP+6,{width:165,align:"right",lineBreak:false});
  style(8,false,C.muted).text(c.contractNo,R-165,TOP+25,{width:165,align:"right",lineBreak:false});
  y=TOP+62;rule();y+=21;
  const heading=vi?"HỢP ĐỒNG MUA BÁN HÀNG HÓA":"GOODS SALES AGREEMENT";
  style(16,true,C.navy).text(heading,X,y,{width:W,align:"center"});y+=32;
  style(8.4,false,C.muted).text((vi?"Số hợp đồng: ":"Contract No.: ")+c.contractNo,X,y,{width:W,align:"center"});y+=16;
  style(8.2,false,C.muted).text((vi?"Ngày ký: ":"Date of signing: ")+date(c.signedDate),X,y,{width:W,align:"center"});y+=25;
  rule();y+=13;
  t(vi?"Hai bên thống nhất các điều khoản thương mại sau đây:":"The parties agree to the following commercial terms:",8.3,false,C.muted,9);
  partyBlock(buyer,vi?"BÊN MUA / BÊN A":"BUYER / PARTY A","A");
  rule();y+=11;
  partyBlock(seller,vi?"BÊN BÁN / BÊN B":"SELLER / PARTY B","B");
  section(vi?"DANH MỤC HÀNG HÓA VÀ GIÁ TRỊ":"GOODS AND CONTRACT VALUE","01");
  const columns=vi?["STT","Sản phẩm / Quy cách","SL","ĐVT","Đơn giá","Thành tiền"]:["No.","Item / Specification","Qty","Unit","Unit price","Amount"];
  const widths=[33,205,43,43,86,95],heads=columns.map((label,i)=>({label,width:widths[i]}));
  tableHeader(heads);
  goods.forEach((g,i)=>{
   if(y+42>BOTTOM){page();tableHeader(heads);}
   const item=[g.description,g.specification].filter(Boolean).join("\n");
   tableRow([String(i+1),item,String(g.quantity),g.unit,fmt(g.unitPrice,c.currency),fmt(g.quantity*g.unitPrice,c.currency)],widths,36);
  });
  keep(103);y+=7;
  function totalRow(label:string,value:string,highlight=false){
   const h=highlight?29:22;keep(h);
   if(highlight)pdf.roundedRect(R-260,y,260,h,5).fill(C.navy);
   style(8.5,highlight,highlight?C.white:C.muted).text(label,R-250,y+7,{width:120});
   style(highlight?10:8.5,true,highlight?C.white:C.navy).text(value,R-128,y+7,{width:115,align:"right"});
   y+=h;
  }
  totalRow(vi?"Tạm tính":"Subtotal",fmt(Number(c.subtotal),c.currency));
  totalRow(vi?"Thuế VAT":"Tax / VAT",fmt(Number(c.taxAmount),c.currency));
  totalRow(vi?"TỔNG CỘNG":"TOTAL",fmt(Number(c.grandTotal),c.currency)+" "+c.currency,true);
  section(vi?"LỊCH THANH TOÁN":"PAYMENT SCHEDULE","02");
  tableHeader([{label:vi?"Đợt":"Stage",width:125},{label:vi?"Điều kiện / Thời hạn":"Terms / Due date",width:205},{label:vi?"Tỷ lệ":"Rate",width:65},{label:vi?"Số tiền":"Amount",width:110}]);
  for(const p of milestones){
   if(y+35>BOTTOM){page();tableHeader([{label:vi?"Đợt":"Stage",width:125},{label:vi?"Điều kiện / Thời hạn":"Terms / Due date",width:205},{label:vi?"Tỷ lệ":"Rate",width:65},{label:vi?"Số tiền":"Amount",width:110}]);}
   tableRow([p.label,p.due,String(p.percent)+"%",fmt(Number(c.grandTotal)*p.percent/100,c.currency)],[125,205,65,110],33);
  }
  if(c.deliveryDate||c.deliveryAddress){
   section(vi?"THÔNG TIN GIAO HÀNG":"DELIVERY DETAILS","03");
   if(c.deliveryDate)labelValue(vi?"Ngày giao":"Delivery date",date(c.deliveryDate));
   if(c.deliveryAddress)labelValue(vi?"Địa điểm":"Destination",c.deliveryAddress);
  }
  section(vi?"CÁC ĐIỀU KHOẢN THỎA THUẬN":"AGREED TERMS AND CONDITIONS");
  for(const clause of clauses){
   keep(38);y+=7;
   t(clause.heading,9,true,C.navy,4);
   for(const para of clause.body.split(/\n\s*\n/))t(para,8.4,false,C.ink,7,6);
   y+=2;
  }
  if(c.notes){section(vi?"GHI CHÚ / PHỤ LỤC":"NOTES / ANNEX");t(c.notes,8.5);}
  keep(165);y+=18;rule();y+=17;
  const half=W/2;
  pdf.rect(X,y,half-6,116).lineWidth(.6).strokeColor(C.line).stroke();
  pdf.rect(X+half+6,y,half-6,116).lineWidth(.6).strokeColor(C.line).stroke();
  style(8.7,true,C.navy).text(vi?"ĐẠI DIỆN BÊN A / BÊN MUA":"FOR THE BUYER",X+9,y+13,{width:half-24,align:"center"});
  style(8.7,true,C.navy).text(vi?"ĐẠI DIỆN BÊN B / BÊN BÁN":"FOR THE SELLER",X+half+15,y+13,{width:half-24,align:"center"});
  style(7.2,false,C.muted).text(vi?"Ký, ghi rõ họ tên và đóng dấu (nếu có)":"Signature / company stamp (if any)",X+9,y+32,{width:half-24,align:"center"});
  style(7.2,false,C.muted).text(vi?"Ký, ghi rõ họ tên và đóng dấu (nếu có)":"Signature / company stamp (if any)",X+half+15,y+32,{width:half-24,align:"center"});
  style(8.5,true,C.ink).text(buyer.representative||buyer.name,X+9,y+95,{width:half-24,align:"center"});
  style(8.5,true,C.ink).text(seller.representative||seller.name,X+half+15,y+95,{width:half-24,align:"center"});
  const pages=pdf.bufferedPageRange();
  for(let i=0;i<pages.count;i++){
   pdf.switchToPage(pages.start+i);
   pdf.moveTo(X,775).lineTo(R,775).lineWidth(.65).strokeColor(C.line).stroke();
   style(7,false,C.muted).text("VNC  •  "+c.contractNo,X,786,{width:330,lineBreak:false});
   style(7,false,C.muted).text((vi?"Trang ":"Page ")+(i+1)+"/"+pages.count,R-90,786,{width:90,align:"right",lineBreak:false});
   if(c.status==="DRAFT"){
    pdf.save().opacity(.10).translate(298,420).rotate(-33);
    style(75,true,C.navy).text("DRAFT",-190,-32,{width:380,align:"center",lineBreak:false});
    pdf.restore();
   }
  }
  pdf.end();
 });
}
