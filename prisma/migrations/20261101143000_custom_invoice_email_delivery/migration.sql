-- Additive, nullable delivery metadata; issued Invoice snapshots are not changed.
ALTER TABLE "CustomPaymentInvoice"
 ADD COLUMN IF NOT EXISTS "emailedAt" TIMESTAMP(3),
 ADD COLUMN IF NOT EXISTS "emailedTo" TEXT,
 ADD COLUMN IF NOT EXISTS "emailProviderId" TEXT,
 ADD COLUMN IF NOT EXISTS "emailSendCount" INTEGER NOT NULL DEFAULT 0;
