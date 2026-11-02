-- Additive, non-destructive changes. No issued invoice data or snapshots are rewritten.
ALTER TABLE "CustomPaymentInvoice"
 ADD COLUMN IF NOT EXISTS "emailDeliveryStatus" TEXT,
 ADD COLUMN IF NOT EXISTS "emailDeliveryUpdatedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "VncInvoiceEmailDeliveryEvent" (
 "id" TEXT NOT NULL,
 "webhookId" TEXT NOT NULL,
 "providerEmailId" TEXT NOT NULL,
 "eventType" TEXT NOT NULL,
 "recipient" TEXT,
 "invoiceId" TEXT,
 "occurredAt" TIMESTAMP(3) NOT NULL,
 "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "detail" TEXT,
 CONSTRAINT "VncInvoiceEmailDeliveryEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "VncInvoiceEmailDeliveryEvent_webhookId_key" ON "VncInvoiceEmailDeliveryEvent"("webhookId");
CREATE INDEX IF NOT EXISTS "VncInvoiceEmailDeliveryEvent_providerEmailId_occurredAt_idx" ON "VncInvoiceEmailDeliveryEvent"("providerEmailId","occurredAt");
CREATE INDEX IF NOT EXISTS "VncInvoiceEmailDeliveryEvent_invoiceId_occurredAt_idx" ON "VncInvoiceEmailDeliveryEvent"("invoiceId","occurredAt");
