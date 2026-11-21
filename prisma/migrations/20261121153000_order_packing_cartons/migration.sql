CREATE TYPE "PackingCartonStatus" AS ENUM ('DRAFT', 'SEALED');
CREATE TABLE "OrderPackingCarton" (
 "id" TEXT NOT NULL,
 "orderId" TEXT NOT NULL,
 "orderItemId" TEXT NOT NULL,
 "orderItemVariantId" TEXT,
 "cartonCode" TEXT NOT NULL,
 "quantity" INTEGER NOT NULL,
 "status" "PackingCartonStatus" NOT NULL DEFAULT 'DRAFT',
 "marketCode" TEXT,
 "sizeSnapshot" TEXT,
 "note" TEXT,
 "sealedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "OrderPackingCarton_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "OrderPackingCarton_quantity_positive" CHECK ("quantity" > 0)
);
CREATE UNIQUE INDEX "OrderPackingCarton_orderId_cartonCode_key" ON "OrderPackingCarton"("orderId","cartonCode");
CREATE INDEX "OrderPackingCarton_orderItemId_status_idx" ON "OrderPackingCarton"("orderItemId","status");
CREATE INDEX "OrderPackingCarton_orderItemVariantId_idx" ON "OrderPackingCarton"("orderItemVariantId");
ALTER TABLE "OrderPackingCarton" ADD CONSTRAINT "OrderPackingCarton_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderPackingCarton" ADD CONSTRAINT "OrderPackingCarton_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderPackingCarton" ADD CONSTRAINT "OrderPackingCarton_orderItemVariantId_fkey" FOREIGN KEY ("orderItemVariantId") REFERENCES "OrderItemVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
