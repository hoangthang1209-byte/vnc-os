-- Additive metadata only. Never rewrite historical issuedSnapshot or invoice numbers.
ALTER TABLE "CustomPaymentInvoice"
  ADD COLUMN "replacesInvoiceId" TEXT,
  ADD COLUMN "replacementReason" TEXT,
  ADD COLUMN "replacedByInvoiceId" TEXT,
  ADD COLUMN "replacedAt" TIMESTAMP(3),
  ADD COLUMN "deliveryRecipientName" TEXT,
  ADD COLUMN "deliveryRecipientPhone" TEXT,
  ADD COLUMN "deliveryRecipientAddress" TEXT;
CREATE UNIQUE INDEX "CustomPaymentInvoice_replacesInvoiceId_key" ON "CustomPaymentInvoice"("replacesInvoiceId");
CREATE UNIQUE INDEX "CustomPaymentInvoice_replacedByInvoiceId_key" ON "CustomPaymentInvoice"("replacedByInvoiceId");
CREATE INDEX "CustomPaymentInvoice_replacedAt_idx" ON "CustomPaymentInvoice"("replacedAt");
