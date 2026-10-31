ALTER TABLE "CustomPaymentInvoice" ADD COLUMN IF NOT EXISTS "orderId" TEXT;
CREATE INDEX IF NOT EXISTS "CustomPaymentInvoice_orderId_idx" ON "CustomPaymentInvoice"("orderId");
ALTER TABLE "CustomPaymentInvoice" ADD CONSTRAINT "CustomPaymentInvoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
