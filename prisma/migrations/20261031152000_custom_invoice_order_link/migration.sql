ALTER TABLE "CustomPaymentInvoice" ADD COLUMN IF NOT EXISTS "orderId" TEXT;
CREATE INDEX IF NOT EXISTS "CustomPaymentInvoice_orderId_idx" ON "CustomPaymentInvoice"("orderId");
DO $migration$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='CustomPaymentInvoice_orderId_fkey') THEN
    ALTER TABLE "CustomPaymentInvoice" ADD CONSTRAINT "CustomPaymentInvoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $migration$;
