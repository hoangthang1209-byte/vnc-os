-- Additive, nullable CRM association: existing invoices remain intact.
ALTER TABLE "CustomPaymentInvoice" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
CREATE INDEX IF NOT EXISTS "CustomPaymentInvoice_customerId_idx" ON "CustomPaymentInvoice"("customerId");
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='CustomPaymentInvoice_customerId_fkey') THEN
  ALTER TABLE "CustomPaymentInvoice"
  ADD CONSTRAINT "CustomPaymentInvoice_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
 END IF;
END $$;
