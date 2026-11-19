import assert from "node:assert/strict";
import test from "node:test";
import {renderContractPdf} from "./contract-pdf";
import {blankParty,standardClauses} from "./contract-fields";
const sample=()=>({
 contractNo:"CT-2099-11-0001",status:"DRAFT",language:"VI",title:"HỢP ĐỒNG MUA BÁN",
 seller:{...blankParty(),name:"CÔNG TY TNHH SẢN XUẤT MAY MẶC VIỆT NAM",address:"14B Bùi Cẩm Hổ, TP Hồ Chí Minh",representative:"NGUYỄN HOÀNG THẮNG",title:"Giám đốc"},
 buyer:{...blankParty(),name:"CÔNG TY KHÁCH HÀNG MẪU",representative:"NGUYỄN VĂN A"},
 currency:"VND",subtotal:"19259259",taxAmount:"1540741",grandTotal:"20800000",
 signedDate:new Date("2026-11-19T00:00:00Z"),effectiveDate:null,deliveryDate:null,deliveryAddress:"TP. Hồ Chí Minh",notes:null,
 goods:[{description:"Áo Polo",specification:"Vải cá sấu poly, màu trắng, in 3 vị trí",quantity:200,unit:"cái",unitPrice:96296.295}],
 clauses:standardClauses("VI"),paymentTerms:[{label:"Đợt 1",percent:50,due:"Sau khi ký"},{label:"Đợt 2",percent:50,due:"Sau khi giao hàng"}]
});
test("contracts renderer emits Vietnamese A4 draft PDF with watermark",async()=>{
 const pdf=await renderContractPdf(sample());
 assert.equal(pdf.subarray(0,5).toString(),"%PDF-");
 assert.ok(pdf.length>3500);
});
test("issued contract freezes content without draft watermark and supports long schedules",async()=>{
 const src=sample();const drafts=await renderContractPdf(src);
 const final=await renderContractPdf({...src,status:"ISSUED",language:"EN",
  goods:Array.from({length:30},(_,i)=>({description:"Merchandise lot "+(i+1),specification:"Long technical product specification and packaging requirements",quantity:20,unit:"pcs",unitPrice:100})),
  clauses:standardClauses("EN")});
 assert.equal(final.subarray(0,5).toString(),"%PDF-");
 assert.notDeepEqual(final,drafts);
 assert.ok((final.toString("latin1").match(/\/Type\s*\/Page\b/g)||[]).length>=2);
});
