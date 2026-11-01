-- Add CC support without modifying any issued invoice snapshot.
ALTER TABLE "CustomPaymentInvoice"
  ALTER COLUMN "recipientEmail" TYPE TEXT,
  ADD COLUMN IF NOT EXISTS "recipientCcEmails" TEXT;
