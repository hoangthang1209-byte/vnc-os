-- Audit ownership of custom invoices. Existing documents retain legacy attribution.
ALTER TABLE "CustomPaymentInvoice" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;
ALTER TABLE "CustomPaymentInvoice" ADD COLUMN IF NOT EXISTS "createdByEmployeeId" TEXT;
ALTER TABLE "CustomPaymentInvoice" ADD COLUMN IF NOT EXISTS "createdByDisplayName" TEXT NOT NULL DEFAULT 'Legacy / not recorded';
ALTER TABLE "CustomPaymentInvoice" ADD COLUMN IF NOT EXISTS "createdByMode" TEXT NOT NULL DEFAULT 'legacy';
CREATE INDEX IF NOT EXISTS "CustomPaymentInvoice_createdByUserId_idx" ON "CustomPaymentInvoice"("createdByUserId");