import PDFDocument from "pdfkit";
import {resolve as resolvePath} from "node:path";
import {loadInvoiceInterFont} from "./inter-font";
import {type ContractParty,type ContractItem,type ContractClause,type PaymentMilestone,party} from "./contract-fields";
type ContractPrint={
 contractNo:string;status:string;language:string;title:string;
 seller:unknown;buyer:unknown;goods:unknown;clauses:unknown;paymentTerms:unknown;
 currency:string;subtotal:string;taxAmount:string;grandTotal:string;
 signedDate:Date|null;deliveryDate:Date|null;effectiveDate:Date|null;
 deliveryAddress:string|null;notes:string|null;
};
const items=(v:unknown)=>Array.isArray(v)?v as ContractItem[]:[];
const clauses=(v:unknown)=>Array.isArray(v)?v as ContractClause[]:[];
const payments=(v:unknown)=>Array.isArray(v)?v as PaymentMilestone[]:[];
const money=(n:number,currency:string)=>new Intl.NumberFormat(currency==="VND"?"vi-VN":"en-US",{minimumFractionDigits:currency==="VND"?0:2,maximumFractionDigits:currency==="VND"?0:2}).format(n);
export async function renderLegacyContractPdf(contract:ContractPrint):Promise<Buffer>{
 const isVi=contract.language==="VI", seller=party(contract.seller),buyer=party(contract.buyer);
 const inter=await loadInvoiceInterFont();
 return await new Promise((resolve,reject)=>{
  const pdf=new PDFDocument({size:"A4",margin:45,bufferPages:true});
  pdf.registerFont("regular",inter??resolvePath(process.cwd(),"node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf"));
  pdf.registerFont("bold",inter??resolvePath(process.cwd(),"node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf"));
  const blocks:Buffer[]=[];pdf.on("data",(b:Buffer)=>blocks.push(b));pdf.on("end",()=>resolve(Buffer.concat(blocks)));pdf.on("error",reject);
  const left=45,right=550,width=right-left,bottom=744;
  let y=43;
  const f=(bold=false,size=9,color="#243348")=>pdf.font(bold?"bold":"regular").fontSize(size).fillColor(color);
  const measure=(s:string,w=width,size=9,bold=false)=>{f(bold,size);return pdf.heightOfString(s,{width:w});};
  function page(){pdf.addPage();y=49;}
  function guard(height:number){if(y+height>bottom)page();}
  function text(value:string,size=9,bold=false,color="#243348",space=7,ind=0){
   const s=value||"—",w=width-ind,h=measure(s,w,size,bold);guard(h+space);
   f(bold,size,color).text(s,left+ind,y,{width:w});y+=h+space;
  }
  function heading(value:string){guard(44);y+=7;text(value,10,true,"#152e49",8);}
  function line(){guard(13);pdf.moveTo(left,y).lineTo(right,y).strokeColor("#d3d9e2").lineWidth(.6).stroke();y+=11;}
  function pair(p:ContractParty,tag:string){
   heading(tag+"  "+p.name);
   if(p.address)text((isVi?"Địa chỉ: ":"Address: ")+p.address,8.5);
   if(p.taxId)text((isVi?"MST: ":"Tax ID: ")+p.taxId,8.5);
   if(p.representative)text((isVi?"Đại diện: ":"Representative: ")+p.representative+(p.title?" — "+p.title:""),8.5);
   if(p.email||p.phone)text([p.email,p.phone].filter(Boolean).join("  |  "),8.5);
   if(p.bankName||p.accountNo)text((isVi?"Ngân hàng: ":"Bank: ")+[p.bankName,p.accountNo,p.accountName,p.swift].filter(Boolean).join(" | "),8.2);
  }
  f(true,14).text(isVi?"HỢP ĐỒNG MUA BÁN HÀNG HÓA":"GOODS SALES AGREEMENT",left,y,{width,align:"center"});y+=27;
  f(false,9).text((isVi?"Số: ":"No.: ")+contract.contractNo,left,y,{width,align:"center"});y+=17;
  if(contract.signedDate){f(false,8.5).text((isVi?"Ngày ký: ":"Date: ")+contract.signedDate.toISOString().slice(0,10),left,y,{width,align:"center"});y+=19;}
  line();
  pair(buyer,isVi?"BÊN A — BÊN MUA":"PARTY A — BUYER");
  pair(seller,isVi?"BÊN B — BÊN BÁN":"PARTY B — SELLER");
  line();
  heading(isVi?"BẢNG HÀNG HÓA VÀ GIÁ TRỊ":"GOODS AND VALUE SCHEDULE");
  const goods=items(contract.goods);
  for(let i=0;i<goods.length;i++){
   const it=goods[i]; const descr=`${i+1}. ${it.description}${it.specification?" — "+it.specification:""}`;
   const h=measure(descr,width-95,8.3)+measure(`${it.quantity} ${it.unit}`,width-95,7.8)+13;
   guard(h+6);
   f(false,8.3).text(descr,left,y,{width:width-105});
   f(true,8.2).text(money(it.quantity*it.unitPrice,contract.currency),right-99,y,{width:99,align:"right"});
   y+=measure(descr,width-105,8.3)+3;
   f(false,7.8,"#637184").text(`${it.quantity} ${it.unit} × ${money(it.unitPrice,contract.currency)} ${contract.currency}`,left+8,y,{width:width-110});
   y+=measure(`${it.quantity} ${it.unit}`,width-110,7.8)+9;
  }
  line();
  text((isVi?"Tạm tính: ":"Subtotal: ")+money(Number(contract.subtotal),contract.currency)+" "+contract.currency,8.8,true);
  text((isVi?"Thuế / VAT: ":"Tax / VAT: ")+money(Number(contract.taxAmount),contract.currency)+" "+contract.currency,8.8);
  text((isVi?"TỔNG THANH TOÁN: ":"TOTAL CONTRACT VALUE: ")+money(Number(contract.grandTotal),contract.currency)+" "+contract.currency,10,true,"#122c4a",13);
  heading(isVi?"LỊCH THANH TOÁN":"PAYMENT MILESTONE SCHEDULE");
  for(const p of payments(contract.paymentTerms)){
   text(`${p.label|| (isVi?"Đợt":"Milestone")} — ${p.percent}% (${money(Number(contract.grandTotal)*p.percent/100,contract.currency)} ${contract.currency})${p.due?" · "+p.due:""}`,8.5);
  }
  if(contract.deliveryDate||contract.deliveryAddress){
   heading(isVi?"GIAO HÀNG":"DELIVERY");
   if(contract.deliveryDate)text((isVi?"Ngày dự kiến: ":"Expected date: ")+contract.deliveryDate.toISOString().slice(0,10),8.5);
   if(contract.deliveryAddress)text((isVi?"Địa điểm: ":"Destination: ")+contract.deliveryAddress,8.5);
  }
  for(const clause of clauses(contract.clauses)){
   heading(clause.heading);
   text(clause.body,8.3,false,"#273443",11);
  }
  if(contract.notes){heading(isVi?"GHI CHÚ BỔ SUNG":"ADDITIONAL NOTES");text(contract.notes,8.3);}
  guard(128);y+=20;line();
  const half=width/2;
  f(true,8.3).text(isVi?"ĐẠI DIỆN BÊN A (BÊN MUA)":"FOR THE BUYER",left,y,{width:half,align:"center"});
  f(true,8.3).text(isVi?"ĐẠI DIỆN BÊN B (BÊN BÁN)":"FOR THE SELLER",left+half,y,{width:half,align:"center"});
  y+=72;
  f(true,8).text(buyer.representative||buyer.name,left,y,{width:half,align:"center"});
  f(true,8).text(seller.representative||seller.name,left+half,y,{width:half,align:"center"});
  const range=pdf.bufferedPageRange();
  for(let p=0;p<range.count;p++){
   pdf.switchToPage(range.start+p);
   f(false,7,"#718096").text(`${contract.contractNo}  ·  ${isVi?"Hợp đồng thương mại":"Commercial contract"}`,left,778,{width:width-60});
   f(false,7,"#718096").text(`${p+1}/${range.count}`,right-47,778,{width:47,align:"right"});
   if(contract.status==="DRAFT"){
    pdf.save();pdf.opacity(.13);pdf.translate(297,420).rotate(-35);
    f(true,85,"#4f6077").text("DRAFT",-240,-45,{width:480,align:"center",lineBreak:false});
    pdf.restore();
   }
  }
  pdf.end();
 });
}
