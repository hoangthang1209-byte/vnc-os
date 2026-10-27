import { prisma } from "@/lib/prisma";
import { ProductionMasterValidationError } from "@/features/production-master/production-master.errors";
import { mergeCostingSourcePricesForSupplier } from "@/features/pricing/services/costing-source-price.service";

/** Reassign all live references atomically; keep colliding historical prices inactive on the source. */
export async function mergeProductionSuppliers(sourceId: string, targetSupplierId: string) {
  if (sourceId === targetSupplierId) throw new ProductionMasterValidationError("Không thể gộp nhà cung cấp với chính nó.");
  return prisma.$transaction(async (tx) => {
    const [source, target] = await Promise.all([
      tx.productionSupplier.findUnique({ where: { id: sourceId } }),
      tx.productionSupplier.findUnique({ where: { id: targetSupplierId } }),
    ]);
    if (!source) throw new ProductionMasterValidationError("Không tìm thấy nhà cung cấp nguồn.");
    if (!target) throw new ProductionMasterValidationError("Không tìm thấy nhà cung cấp đích.");
    if (!target.isActive) throw new ProductionMasterValidationError("Nhà cung cấp đích đã ngừng sử dụng.");

    const bomUpdated = await tx.techPackBomItem.updateMany({ where: { supplierId: sourceId }, data: { supplierId: targetSupplierId } });
    const materialUpdated = await tx.productionMaterial.updateMany({ where: { supplierId: sourceId }, data: { supplierId: targetSupplierId } });
    const trimUpdated = await tx.productionTrim.updateMany({ where: { supplierId: sourceId }, data: { supplierId: targetSupplierId } });
    const patternUpdated = await tx.pattern.updateMany({ where: { patternSupplierId: sourceId }, data: { patternSupplierId: targetSupplierId } });
    const sourcePrices = await mergeCostingSourcePricesForSupplier(sourceId, targetSupplierId, tx);
    const mergeNote = `Đã gộp vào ${target.code} - ${target.name}.`;
    await tx.productionSupplier.update({
      where: { id: sourceId },
      data: { isActive: false, notes: source.notes?.trim() ? `${source.notes.trim()}\n${mergeNote}` : mergeNote },
    });
    return { bomUpdated: bomUpdated.count, materialUpdated: materialUpdated.count, trimUpdated: trimUpdated.count, patternUpdated: patternUpdated.count, sourcePricesMoved: sourcePrices.moved, sourcePricesKeptOnSource: sourcePrices.keptOnSource, target };
  }, { timeout: 20000 });
}
