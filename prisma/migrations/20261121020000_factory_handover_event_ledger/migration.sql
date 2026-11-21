-- Durable custody log, separate from production progress and QC.
CREATE TYPE "FactoryHandoverEventType" AS ENUM ('VNC_DISPATCH', 'FACTORY_RECEIVE', 'FACTORY_RETURN', 'VNC_RECEIVE');
CREATE TABLE "FactoryHandoverEvent" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "type" "FactoryHandoverEventType" NOT NULL,
  "quantity" INTEGER NOT NULL,
  "reference" TEXT,
  "note" TEXT,
  "createdByAdminUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FactoryHandoverEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FactoryHandoverEvent_quantity_positive" CHECK ("quantity" > 0)
);
CREATE INDEX "FactoryHandoverEvent_batchId_createdAt_idx" ON "FactoryHandoverEvent"("batchId","createdAt");
CREATE INDEX "FactoryHandoverEvent_batchId_type_idx" ON "FactoryHandoverEvent"("batchId","type");
ALTER TABLE "FactoryHandoverEvent" ADD CONSTRAINT "FactoryHandoverEvent_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "ItemProductionBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
