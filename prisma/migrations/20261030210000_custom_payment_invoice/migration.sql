CREATE TABLE IF NOT EXISTS "CustomPaymentInvoice" (
 "id" TEXT NOT NULL,
 "invoiceNo" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'DRAFT',
 "currency" TEXT NOT NULL DEFAULT 'USD',
 "recipientName" TEXT NOT NULL,
 "recipientEmail" TEXT,
 "recipientAddress" TEXT,
 "issuerName" TEXT NOT NULL,
 "issuerAddress" TEXT,
 "issuerTaxId" TEXT,
 "bankDetails" JSONB,
 "lines" JSONB NOT NULL,
 "adjustments" JSONB NOT NULL,
 "subtotal" TEXT NOT NULL,
 "total" TEXT NOT NULL,
 "issueDate" TIMESTAMP(3) NOT NULL,
 "dueDate" TIMESTAMP(3),
 "notes" TEXT,
 "issuedSnapshot" JSONB,
 "issuedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "CustomPaymentInvoice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CustomPaymentInvoice_invoiceNo_key" ON "CustomPaymentInvoice"("invoiceNo");
CREATE INDEX IF NOT EXISTS "CustomPaymentInvoice_status_createdAt_idx" ON "CustomPaymentInvoice"("status","createdAt");
CREATE INDEX IF NOT EXISTS "CustomPaymentInvoice_recipientName_idx" ON "CustomPaymentInvoice"("recipientName");
