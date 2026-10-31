CREATE TABLE IF NOT EXISTS "VncLegalEntity" (
 "id" TEXT NOT NULL,
 "code" TEXT NOT NULL,
 "legalName" TEXT NOT NULL,
 "address" TEXT,
 "taxCode" TEXT,
 "email" TEXT,
 "phone" TEXT,
 "isActive" BOOLEAN NOT NULL DEFAULT true,
 "isDefault" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "VncLegalEntity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "VncLegalEntity_code_key" ON "VncLegalEntity"("code");
CREATE INDEX IF NOT EXISTS "VncLegalEntity_isActive_isDefault_idx" ON "VncLegalEntity"("isActive","isDefault");
CREATE TABLE IF NOT EXISTS "VncBankAccount" (
 "id" TEXT NOT NULL,
 "legalEntityId" TEXT NOT NULL,
 "accountName" TEXT NOT NULL,
 "bankName" TEXT NOT NULL,
 "accountNo" TEXT NOT NULL,
 "accountAddress" TEXT,
 "bankAddress" TEXT,
 "swift" TEXT,
 "currency" TEXT,
 "branch" TEXT,
 "isActive" BOOLEAN NOT NULL DEFAULT true,
 "isDefault" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "VncBankAccount_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "VncBankAccount_legalEntityId_fkey" FOREIGN KEY ("legalEntityId") REFERENCES "VncLegalEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "VncBankAccount_legalEntityId_isActive_idx" ON "VncBankAccount"("legalEntityId","isActive");
ALTER TABLE "CustomPaymentInvoice" ADD COLUMN IF NOT EXISTS "legalEntityId" TEXT;
ALTER TABLE "CustomPaymentInvoice" ADD COLUMN IF NOT EXISTS "bankAccountId" TEXT;
CREATE INDEX IF NOT EXISTS "CustomPaymentInvoice_legalEntityId_idx" ON "CustomPaymentInvoice"("legalEntityId");
CREATE INDEX IF NOT EXISTS "CustomPaymentInvoice_bankAccountId_idx" ON "CustomPaymentInvoice"("bankAccountId");
ALTER TABLE "CustomPaymentInvoice" ADD CONSTRAINT "CustomPaymentInvoice_legalEntityId_fkey" FOREIGN KEY ("legalEntityId") REFERENCES "VncLegalEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomPaymentInvoice" ADD CONSTRAINT "CustomPaymentInvoice_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "VncBankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;