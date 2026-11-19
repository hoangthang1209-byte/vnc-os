CREATE TABLE "VncCommercialContract" (
  "id" TEXT NOT NULL,
  "contractNo" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "language" TEXT NOT NULL DEFAULT 'VI',
  "contractType" TEXT NOT NULL DEFAULT 'SALES',
  "customerId" TEXT,
  "orderId" TEXT,
  "legalEntityId" TEXT,
  "bankAccountId" TEXT,
  "title" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'VND',
  "seller" JSONB NOT NULL,
  "buyer" JSONB NOT NULL,
  "goods" JSONB NOT NULL,
  "clauses" JSONB NOT NULL,
  "subtotal" TEXT NOT NULL,
  "taxAmount" TEXT NOT NULL,
  "grandTotal" TEXT NOT NULL,
  "signedDate" TIMESTAMP(3),
  "effectiveDate" TIMESTAMP(3),
  "deliveryDate" TIMESTAMP(3),
  "deliveryAddress" TEXT,
  "paymentTerms" JSONB NOT NULL,
  "notes" TEXT,
  "issuedSnapshot" JSONB,
  "issuedAt" TIMESTAMP(3),
  "createdByUserId" TEXT,
  "createdByName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VncCommercialContract_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VncCommercialContract_contractNo_key" ON "VncCommercialContract"("contractNo");
CREATE INDEX "VncCommercialContract_status_createdAt_idx" ON "VncCommercialContract"("status", "createdAt");
CREATE INDEX "VncCommercialContract_customerId_idx" ON "VncCommercialContract"("customerId");
CREATE INDEX "VncCommercialContract_orderId_idx" ON "VncCommercialContract"("orderId");
