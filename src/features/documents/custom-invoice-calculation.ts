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
  if (denominator <= 0n || numerator < 0n) throw new Error("Invalid arithmetic");
  return (numerator + denominator / 2n) / denominator;
}
/** Round half up to the minor currency unit, without JS floating-point arithmetic. */
export function toMinor(value: string, currency: InvoiceCurrency): bigint {
  const amount = decimalParts(value);
  const precision = scale(currency);
  const result = roundDivide(amount.digits * 10n ** BigInt(precision), 10n ** BigInt(amount.fractionalDigits));
  return amount.negative ? -result : result;
}
export function lineAmountMinor(quantity: string, unitPrice: string, currency: InvoiceCurrency): bigint {
  const qty = decimalParts(quantity);
  const price = decimalParts(unitPrice);
  if (qty.negative || price.negative || qty.digits === 0n) throw new Error("Quantity and unit price must be non-negative; quantity must be positive");
  return roundDivide(qty.digits * price.digits * 10n ** BigInt(scale(currency)), 10n ** BigInt(qty.fractionalDigits + price.fractionalDigits));
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
  const subtotalMinor = lines.reduce((sum, line) => sum + line.amountMinor, 0n);
  const discountMinor = toMinor(input.discount ?? "0", input.currency);
  const extraChargeMinor = toMinor(input.extraCharge ?? "0", input.currency);
  const taxMinor = toMinor(input.tax ?? "0", input.currency);
  if ([discountMinor, extraChargeMinor, taxMinor].some(value => value < 0n)) throw new Error("Adjustments cannot be negative");
  if (discountMinor > subtotalMinor) throw new Error("Discount exceeds subtotal");
  const totalMinor = subtotalMinor - discountMinor + extraChargeMinor + taxMinor;
  return { lines, subtotalMinor, discountMinor, extraChargeMinor, taxMinor, totalMinor };
}
export function formatMinor(amount: bigint, currency: InvoiceCurrency): string {
  const s = scale(currency);
  const sign = amount < 0n ? "-" : "";
  const digits = (amount < 0n ? -amount : amount).toString().padStart(s + 1, "0");
  return sign + (s ? digits.slice(0, -s) + "." + digits.slice(-s) : digits);
}
