import assert from "node:assert/strict";
import test from "node:test";
import { calculateCustomInvoice, formatMinor, lineAmountMinor, toMinor } from "./custom-invoice-calculation";

test("calculates sample fee invoice in USD exactly", () => {
  const result = calculateCustomInvoice({ currency: "USD", lines: [
    { description:"Sample development fee", quantity:"1", unit:"set", unitPrice:"120.00" },
    { description:"Prototype T-shirt", quantity:"3", unit:"pcs", unitPrice:"18.00" },
    { description:"Courier", quantity:"1", unit:"shipment", unitPrice:"35.00" },
  ]});
  assert.equal(formatMinor(result.totalMinor,"USD"),"209.00");
});
test("keeps decimal calculations exact", () => {
  assert.equal(lineAmountMinor("3","0.10","USD"),30n);
  assert.equal(toMinor("1.005","USD"),101n);
  assert.equal(toMinor("1.5","VND"),2n);
});
test("applies discount, extra charge and tax", () => {
  const result = calculateCustomInvoice({currency:"USD", lines:[{ description:"Fee",quantity:"1",unit:"set",unitPrice:"100" }], discount:"10", extraCharge:"5", tax:"2"});
  assert.equal(result.totalMinor,9700n);
});
test("rejects invalid lines and discounts", () => {
  assert.throws(()=>calculateCustomInvoice({currency:"USD",lines:[]}));
  assert.throws(()=>calculateCustomInvoice({currency:"USD",lines:[{description:"",quantity:"1",unit:"set",unitPrice:"1"}]}));
  assert.throws(()=>calculateCustomInvoice({currency:"USD",lines:[{description:"Fee",quantity:"1",unit:"set",unitPrice:"1"}],discount:"2"}));
  assert.throws(()=>lineAmountMinor("0","10","USD"));
  assert.throws(()=>toMinor("Infinity","USD"));
});
