import assert from "node:assert/strict";
import test from "node:test";
import {blankParty,parseContractBody,standardClauses} from "./contract-fields";
const sample=()=>({
 language:"VI",title:"HỢP ĐỒNG MUA BÁN",currency:"VND",
 seller:{...blankParty(),name:"VNC Manufacturing"},buyer:{...blankParty(),name:"Customer Co"},
 goods:[{description:"Áo polo",specification:"Cá sấu poly, màu trắng",quantity:200,unit:"cái",unitPrice:100000}],
 clauses:standardClauses("VI"),paymentTerms:[{label:"Đợt 1",percent:50,due:"Ký hợp đồng"},{label:"Đợt 2",percent:50,due:"Giao hàng"}],
 taxRate:8,signedDate:"2026-11-19",effectiveDate:"",deliveryDate:"",deliveryAddress:"TP.HCM"
});
test("calculates VND goods and VAT without changing editable clauses",()=>{
 const c=parseContractBody(sample());
 assert.equal(c.subtotal,"20000000");assert.equal(c.taxAmount,"1600000");
 assert.equal(c.grandTotal,"21600000");assert.equal(c.goods[0].description,"Áo polo");
 assert.equal(c.clauses.length,7);assert.equal(c.signedDate?.toISOString().slice(0,10),"2026-11-19");
});
test("supports bilingual clauses and USD 2-decimal totals",()=>{
 const body={...sample(),language:"EN",currency:"USD",taxRate:0,
  goods:[{description:"Hoodie",specification:"400 GSM",quantity:3,unit:"pcs",unitPrice:12.35}],
  clauses:standardClauses("EN")};
 const c=parseContractBody(body);
 assert.equal(c.language,"EN");assert.equal(c.grandTotal,"37.05");
 assert.match(c.clauses[0].heading,/GOODS/);
});
test("rejects empty parties, invalid line items, invalid dates and payment percentages",()=>{
 assert.throws(()=>parseContractBody({...sample(),buyer:blankParty()}),/tên pháp nhân/);
 assert.throws(()=>parseContractBody({...sample(),goods:[{description:"",quantity:2,unit:"pcs",unitPrice:100}]}),/hàng hóa/);
 assert.throws(()=>parseContractBody({...sample(),signedDate:"2026-02-30"}),/Ngày/);
 assert.throws(()=>parseContractBody({...sample(),paymentTerms:[{label:"All",percent:80,due:""}]}),/100%/);
});
