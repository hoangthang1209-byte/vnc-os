/** Custom payment requests are commercial documents, NOT Vietnamese VAT e-invoices. */
export type InvoiceCurrency = "VND" | "USD" | "EUR";
export type InvoiceLine = {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
};
export type InvoiceCalculation = {
  lines: Array<InvoiceLine & { amountMinor: bigint }>;
  subtotalMinor: bigint;
  discountMinor: bigint;
  extraChargeMinor: bigint;
  taxMinor: bigint;
  totalMinor: bigint;
};
/** Match the server's accepted unsigned decimal syntax before attempting a draft save. */
export function isValidInvoiceNumericInput(value: string): boolean {
  return /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value.trim());
}
const scale = (currency: InvoiceCurrency) => currency === "VND" ? 0 : 2;
function decimalParts(value: string): { negative: boolean; digits: bigint; fractionalDigits: number } {
  const raw = value.trim();
  if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(raw)) throw new Error("Invalid decimal amount");
  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;
  const [whole, fraction = ""] = unsigned.split(".");
  return { negative, digits: BigInt(whole + fraction), fractionalDigits: fraction.length };
}
function roundDivide(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= BigInt(0) || numerator < BigInt(0)) throw new Error("Invalid arithmetic");
  return (numerator + denominator / BigInt(2)) / denominator;
}
/** Round half up to the minor currency unit, without JS floating-point arithmetic. */
export function toMinor(value: string, currency: InvoiceCurrency): bigint {
  const amount = decimalParts(value);
  const precision = scale(currency);
  const result = roundDivide(amount.digits * BigInt(10) ** BigInt(precision), BigInt(10) ** BigInt(amount.fractionalDigits));
  return amount.negative ? -result : result;
}
export function lineAmountMinor(quantity: string, unitPrice: string, currency: InvoiceCurrency): bigint {
  const qty = decimalParts(quantity);
  const price = decimalParts(unitPrice);
  if (qty.negative || price.negative || qty.digits === BigInt(0)) throw new Error("Quantity and unit price must be non-negative; quantity must be positive");
  return roundDivide(qty.digits * price.digits * BigInt(10) ** BigInt(scale(currency)), BigInt(10) ** BigInt(qty.fractionalDigits + price.fractionalDigits));
}
export function calculateCustomInvoice(input: {
  currency: InvoiceCurrency;
  lines: InvoiceLine[];
  discount?: string;
  extraCharge?: string;
  tax?: string;
}): InvoiceCalculation {
  if (!["VND", "USD", "EUR"].includes(input.currency)) throw new Error("Unsupported currency");
  if (!input.lines.length || input.lines.length > 100) throw new Error("Invoice must have 1–100 line items");
  const lines = input.lines.map(line => {
    if (!line.description.trim()) throw new Error("Description required");
    return { ...line, amountMinor: lineAmountMinor(line.quantity, line.unitPrice, input.currency) };
  });
  const subtotalMinor = lines.reduce((sum, line) => sum + line.amountMinor, BigInt(0));
  const discountMinor = toMinor(input.discount ?? "0", input.currency);
  const extraChargeMinor = toMinor(input.extraCharge ?? "0", input.currency);
  const taxMinor = toMinor(input.tax ?? "0", input.currency);
  if ([discountMinor, extraChargeMinor, taxMinor].some(value => value < BigInt(0))) throw new Error("Adjustments cannot be negative");
  if (discountMinor > subtotalMinor) throw new Error("Discount exceeds subtotal");
  const totalMinor = subtotalMinor - discountMinor + extraChargeMinor + taxMinor;
  return { lines, subtotalMinor, discountMinor, extraChargeMinor, taxMinor, totalMinor };
}
export function formatMinor(amount: bigint, currency: InvoiceCurrency): string {
  const s = scale(currency);
  const sign = amount < BigInt(0) ? "-" : "";
  const digits = (amount < BigInt(0) ? -amount : amount).toString().padStart(s + 1, "0");
  return sign + (s ? digits.slice(0, -s) + "." + digits.slice(-s) : digits);
}

/** Deterministic sequence parser. The caller must serialize allocations in a DB transaction. */
export function nextCustomInvoiceNumber(year:number,invoiceNumbers:readonly string[]):string {
  if(!Number.isInteger(year)||year<2000||year>9999)throw new Error("Invalid invoice year");
  const prefix=`CI-${year}-`;
  const last=invoiceNumbers.reduce((max,value)=>{
    if(!value.startsWith(prefix))return max;
    const suffix=value.slice(prefix.length);
    return /^[0-9]{4}$/.test(suffix)?Math.max(max,Number(suffix)):max;
  },0);
  if(last>=9999)throw new Error("Invoice sequence exhausted for year");
  return prefix+String(last+1).padStart(4,"0");
}
