import assert from "node:assert/strict";
import test from "node:test";
import { resolveInvoiceOrderPreparer } from "./invoice-preparer";
import { calculateCustomInvoice, formatMinor, lineAmountMinor, toMinor, isValidInvoiceNumericInput } from "./custom-invoice-calculation";

test("calculates sample fee invoice in USD exactly", () => {
  const result = calculateCustomInvoice({ currency: "USD", lines: [
    { description:"Sample development fee", quantity:"1", unit:"set", unitPrice:"120.00" },
    { description:"Prototype T-shirt", quantity:"3", unit:"pcs", unitPrice:"18.00" },
    { description:"Courier", quantity:"1", unit:"shipment", unitPrice:"35.00" },
  ]});
  assert.equal(formatMinor(result.totalMinor,"USD"),"209.00");
});
test("keeps decimal calculations exact", () => {
  assert.equal(lineAmountMinor("3","0.10","USD"),BigInt(30));
  assert.equal(toMinor("1.005","USD"),BigInt(101));
  assert.equal(toMinor("1.5","VND"),BigInt(2));
});
test("applies discount, extra charge and tax", () => {
  const result = calculateCustomInvoice({currency:"USD", lines:[{ description:"Fee",quantity:"1",unit:"set",unitPrice:"100" }], discount:"10", extraCharge:"5", tax:"2"});
  assert.equal(result.totalMinor,BigInt(9700));
});
test("rejects invalid lines and discounts", () => {
  assert.throws(()=>calculateCustomInvoice({currency:"USD",lines:[]}));
  assert.throws(()=>calculateCustomInvoice({currency:"USD",lines:[{description:"",quantity:"1",unit:"set",unitPrice:"1"}]}));
  assert.throws(()=>calculateCustomInvoice({currency:"USD",lines:[{description:"Fee",quantity:"1",unit:"set",unitPrice:"1"}],discount:"2"}));
  assert.throws(()=>lineAmountMinor("0","10","USD"));
  assert.throws(()=>toMinor("Infinity","USD"));
});

test("draft inputs accept normal numeric values and reject malformed numbers", () => {
  for (const value of ["0","1","20","20.50","0.25"," 20.50 "]) assert.equal(isValidInvoiceNumericInput(value),true,value);
  for (const value of ["020","1,200","-1","abc","","1e3"]) assert.equal(isValidInvoiceNumericInput(value),false,value);
});

test("Sales/Account on linked Order determines Prepared By; never audit creator",()=>{
  assert.deepEqual(resolveInvoiceOrderPreparer(null),{name:null,employeeId:null});
  assert.deepEqual(resolveInvoiceOrderPreparer({salesName:"Legacy Sales"}),{name:"Legacy Sales",employeeId:null});
  assert.deepEqual(resolveInvoiceOrderPreparer({salesName:"Legacy Sales",salesRepresentative:{fullName:"Account Rep",employeeId:"rep-1"}}),{name:"Account Rep",employeeId:"rep-1"});
  assert.deepEqual(resolveInvoiceOrderPreparer({salesName:"Legacy Sales",salesRepresentative:{fullName:"Account Rep",employeeId:"rep-1"},salesEmployee:{fullName:"Assigned Sales"},salesEmployeeId:"emp-1"}),{name:"Assigned Sales",employeeId:"emp-1"});
  assert.deepEqual(resolveInvoiceOrderPreparer({salesEmployee:{fullName:"  "}}),{name:null,employeeId:null});
});
