ALTER TABLE "MaterialSupplier" ADD COLUMN IF NOT EXISTS "productionSupplierId" TEXT;
CREATE INDEX IF NOT EXISTS "MaterialSupplier_productionSupplierId_idx" ON "MaterialSupplier"("productionSupplierId");
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='MaterialSupplier_productionSupplierId_fkey') THEN ALTER TABLE "MaterialSupplier" ADD CONSTRAINT "MaterialSupplier_productionSupplierId_fkey" FOREIGN KEY ("productionSupplierId") REFERENCES "ProductionSupplier"("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF; END $$;
CREATE TABLE IF NOT EXISTS "SupplierRfq" ("id" TEXT PRIMARY KEY,"supplierId" TEXT NOT NULL REFERENCES "ProductionSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE,"title" TEXT NOT NULL,"status" TEXT NOT NULL DEFAULT 'DRAFT',"productCategory" TEXT,"quantity" INTEGER,"unit" TEXT,"targetPrice" DECIMAL(14,2),"quotedPrice" DECIMAL(14,2),"currency" TEXT NOT NULL DEFAULT 'VND',"moq" INTEGER,"leadTimeDays" INTEGER,"deadline" TIMESTAMP(3),"note" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS "SupplierRfq_supplierId_status_idx" ON "SupplierRfq"("supplierId","status");
CREATE INDEX IF NOT EXISTS "SupplierRfq_deadline_idx" ON "SupplierRfq"("deadline");
CREATE TABLE IF NOT EXISTS "SupplierScorecard" ("id" TEXT PRIMARY KEY,"supplierId" TEXT NOT NULL REFERENCES "ProductionSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE,"period" TEXT NOT NULL,"qualityScore" INTEGER NOT NULL,"deliveryScore" INTEGER NOT NULL,"priceScore" INTEGER NOT NULL,"responsivenessScore" INTEGER NOT NULL,"note" TEXT,"assessedBy" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "SupplierScorecard_supplierId_period_key" UNIQUE ("supplierId","period"));

-- Reject new exact/case/whitespace duplicates at database level.
-- Deployment precondition: existing normalized names must be unique.
CREATE UNIQUE INDEX IF NOT EXISTS "ProductionSupplier_normalized_name_unique"
  ON "ProductionSupplier" (lower(btrim(regexp_replace("name", '[[:space:]]+', ' ', 'g'))));
ALTER TABLE "SupplierScorecard" ADD CONSTRAINT "SupplierScorecard_scores_range" CHECK ("qualityScore" BETWEEN 0 AND 100 AND "deliveryScore" BETWEEN 0 AND 100 AND "priceScore" BETWEEN 0 AND 100 AND "responsivenessScore" BETWEEN 0 AND 100);
