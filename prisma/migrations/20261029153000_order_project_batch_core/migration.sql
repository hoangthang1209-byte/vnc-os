-- Additive, nullable hierarchy: existing Order records remain untouched and unassigned.
CREATE TABLE IF NOT EXISTS "OrderProject" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrderProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OrderBatch" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrderBatch_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "batchId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerPoNo" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "OrderProject_code_key" ON "OrderProject"("code");
CREATE INDEX IF NOT EXISTS "OrderProject_customerId_idx" ON "OrderProject"("customerId");
CREATE UNIQUE INDEX IF NOT EXISTS "OrderBatch_projectId_code_key" ON "OrderBatch"("projectId", "code");
CREATE INDEX IF NOT EXISTS "OrderBatch_projectId_idx" ON "OrderBatch"("projectId");
CREATE INDEX IF NOT EXISTS "Order_batchId_idx" ON "Order"("batchId");
CREATE INDEX IF NOT EXISTS "Order_customerPoNo_idx" ON "Order"("customerPoNo");

ALTER TABLE "OrderProject" ADD CONSTRAINT "OrderProject_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderBatch" ADD CONSTRAINT "OrderBatch_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "OrderProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "OrderBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
