-- Preserve creator audit attribution while separately snapshotting the order Sales/Account.
ALTER TABLE "CustomPaymentInvoice"
  ADD COLUMN IF NOT EXISTS "preparedByEmployeeId" TEXT,
  ADD COLUMN IF NOT EXISTS "preparedByName" TEXT;
