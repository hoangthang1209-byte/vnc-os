export type ContractLanguage = "VI" | "EN";
export type ContractParty = {
 name:string; address:string; taxId:string; representative:string; title:string;
 phone:string; email:string; bankName:string; accountName:string; accountNo:string; swift:string;
};
export type ContractItem = {description:string; specification:string; quantity:number; unit:string; unitPrice:number};
export type ContractClause = {heading:string; body:string};
export type PaymentMilestone = {label:string; percent:number; due:string};
export const blankParty=():ContractParty=>({
 name:"",address:"",taxId:"",representative:"",title:"",phone:"",email:"",
 bankName:"",accountName:"",accountNo:"",swift:""
});
export const standardClauses=(language:ContractLanguage):ContractClause[]=>
 language==="VI" ? [
 {heading:"1. HÀNG HÓA VÀ GIÁ TRỊ",body:"Danh mục hàng hóa, số lượng, đơn giá và tổng giá trị được thể hiện tại bảng hàng hóa kèm theo hợp đồng."},
 {heading:"2. QUY CÁCH VÀ CHẤT LƯỢNG",body:"Sản phẩm được sản xuất theo mẫu, thông số kỹ thuật và tài liệu do hai bên phê duyệt bằng văn bản. Chi tiết nghiệm thu và dung sai do hai bên xác nhận."},
 {heading:"3. GIAO HÀNG",body:"Thời gian, địa điểm, phương thức giao hàng và trách nhiệm vận chuyển được xác nhận theo từng đơn hàng hoặc phụ lục."},
 {heading:"4. THANH TOÁN",body:"Bên mua thanh toán theo các mốc nêu trong hợp đồng. Chứng từ thanh toán, loại tiền và nghĩa vụ thuế được xác nhận bởi các bên."},
 {heading:"5. NGHIỆM THU, KHIẾU NẠI",body:"Bên mua kiểm tra sản phẩm khi nhận hàng và thông báo sai khác bằng văn bản. Hai bên thống nhất thời hạn và phương thức khắc phục trước khi ký."},
 {heading:"6. BẤT KHẢ KHÁNG",body:"Các bên thông báo kịp thời sự kiện ngoài khả năng kiểm soát ảnh hưởng trực tiếp đến việc thực hiện nghĩa vụ và cùng thống nhất phương án xử lý."},
 {heading:"7. ĐIỀU KHOẢN CHUNG",body:"Hiệu lực, sửa đổi, chấm dứt, giải quyết tranh chấp và số bản hợp đồng được xác định theo thỏa thuận được ký kết giữa các bên."},
 ] : [
 {heading:"1. GOODS AND CONTRACT VALUE",body:"The goods, specifications, quantities, unit prices and contract value are set out in the item schedule."},
 {heading:"2. SPECIFICATIONS AND QUALITY",body:"Products shall conform to written-approved samples and technical specifications. Acceptance criteria and tolerances must be agreed by both parties."},
 {heading:"3. DELIVERY",body:"Delivery schedule, destination, transport and allocation of shipping costs shall be mutually agreed in the order or applicable annex."},
 {heading:"4. PAYMENT",body:"The buyer shall pay according to the payment milestones set out herein. Required documents, currency and applicable taxes are subject to agreement."},
 {heading:"5. INSPECTION AND CLAIMS",body:"The buyer shall inspect deliveries and notify nonconformities in writing. Any remedies and response timelines must be agreed before execution."},
 {heading:"6. FORCE MAJEURE",body:"Either party shall promptly notify the other of events beyond its reasonable control that materially prevent performance and agree on mitigation."},
 {heading:"7. GENERAL PROVISIONS",body:"Effective date, amendments, termination, dispute resolution and counterparts are subject to the final signed agreement."},
 ];
export const str=(v:unknown,max=1500):string=>typeof v==="string"?v.trim().slice(0,max):"";
export const validDate=(v:unknown):Date|null=>{
 if(v===null||v===undefined||v==="")return null;
 if(typeof v!=="string"||!/^\\d{4}-\\d{2}-\\d{2}$/.test(v))throw new Error("Ngày tháng phải theo định dạng YYYY-MM-DD.");
 const d=new Date(v+"T00:00:00.000Z");
 if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==v)throw new Error("Ngày không hợp lệ.");
 return d;
};
export const party=(v:unknown):ContractParty=>{
 const o=v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
 return {name:str(o.name,250),address:str(o.address),taxId:str(o.taxId,100),
 representative:str(o.representative,250),title:str(o.title,200),phone:str(o.phone,70),
 email:str(o.email,250),bankName:str(o.bankName,250),accountName:str(o.accountName,250),
 accountNo:str(o.accountNo,120),swift:str(o.swift,30)};
};
export function parseContractBody(input:unknown){
 if(!input||typeof input!=="object"||Array.isArray(input))throw new Error("Thiếu nội dung hợp đồng.");
 const b=input as Record<string,unknown>;
 const language=b.language==="EN"?"EN":b.language==="VI"?"VI":null;
 if(!language)throw new Error("Ngôn ngữ không hợp lệ.");
 const seller=party(b.seller),buyer=party(b.buyer);
 if(!seller.name||!buyer.name)throw new Error("Cần đủ tên pháp nhân hai bên.");
 if(!Array.isArray(b.goods)||b.goods.length<1||b.goods.length>80)throw new Error("Cần từ 1 đến 80 sản phẩm.");
 const goods:ContractItem[]=b.goods.map(v=>{
  const o=v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
  const quantity=Number(o.quantity),unitPrice=Number(o.unitPrice);
  if(!str(o.description,500)||!Number.isFinite(quantity)||quantity<=0||!Number.isFinite(unitPrice)||unitPrice<0||quantity>1e9||unitPrice>1e12)
   throw new Error("Dòng hàng hóa không hợp lệ.");
  return {description:str(o.description,500),specification:str(o.specification,1000),quantity,unit:str(o.unit,30)||"pcs",unitPrice};
 });
 if(!Array.isArray(b.clauses)||b.clauses.length<1||b.clauses.length>30)throw new Error("Hợp đồng cần ít nhất một điều khoản.");
 const clauses:ContractClause[]=b.clauses.map(v=>{
  const o=v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
  const heading=str(o.heading,250),body=str(o.body,10000);
  if(!heading||!body)throw new Error("Điều khoản chưa đầy đủ.");
  return {heading,body};
 });
 const payments:PaymentMilestone[]=Array.isArray(b.paymentTerms)?b.paymentTerms.map(v=>{
  const o=v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
  const percent=Number(o.percent);if(!Number.isFinite(percent)||percent<0||percent>100)throw new Error("Tỷ lệ thanh toán không hợp lệ.");
  return {label:str(o.label,200),percent,due:str(o.due,800)};
 }):[];
 if(payments.length>12||Math.abs(payments.reduce((sum,p)=>sum+p.percent,0)-100)>.001)throw new Error("Tổng tỷ lệ thanh toán phải bằng 100%.");
 const currency=str(b.currency,3).toUpperCase();
 if(!["VND","USD","EUR"].includes(currency))throw new Error("Đơn vị tiền không hợp lệ.");
 const taxRate=Number(b.taxRate??0);
 if(!Number.isFinite(taxRate)||taxRate<0||taxRate>100)throw new Error("Thuế suất không hợp lệ.");
 const decimals=currency==="VND"?0:2;
 const round=(n:number)=>Number(n.toFixed(decimals));
 const subtotal=round(goods.reduce((sum,g)=>sum+round(g.quantity*g.unitPrice),0));
 const taxAmount=round(subtotal*taxRate/100),grandTotal=round(subtotal+taxAmount);
 return {language,contractType:"SALES",title:str(b.title,300)||(language==="VI"?"HỢP ĐỒNG MUA BÁN":"SALES AGREEMENT"),
  seller,buyer,goods,clauses,paymentTerms:payments,currency,taxRate,subtotal:String(subtotal),taxAmount:String(taxAmount),grandTotal:String(grandTotal),
  signedDate:validDate(b.signedDate),effectiveDate:validDate(b.effectiveDate),deliveryDate:validDate(b.deliveryDate),
  deliveryAddress:str(b.deliveryAddress,1500)||null,notes:str(b.notes,3000)||null,
  customerId:str(b.customerId,100)||null,orderId:str(b.orderId,100)||null,
  legalEntityId:str(b.legalEntityId,100)||null,bankAccountId:str(b.bankAccountId,100)||null};
}
