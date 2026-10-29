-- Supplier sourcing and factory qualification metadata; additive/non-destructive.
ALTER TABLE "ProductionSupplier"
  ADD COLUMN IF NOT EXISTS "supplierType" TEXT NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN IF NOT EXISTS "factoryAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "website" TEXT,
  ADD COLUMN IF NOT EXISTS "capabilities" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;
CREATE INDEX IF NOT EXISTS "ProductionSupplier_supplierType_idx" ON "ProductionSupplier" ("supplierType");
CREATE INDEX IF NOT EXISTS "ProductionSupplier_verificationStatus_idx" ON "ProductionSupplier" ("verificationStatus");
