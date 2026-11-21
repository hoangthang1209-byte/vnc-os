import "server-only";
import { prisma } from "@/lib/prisma";
import { ProductionExecutionValidationError } from "@/features/orders/production-quantity";
import { Decimal } from "@prisma/client/runtime/library";

function positiveInteger(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new ProductionExecutionValidationError("Số lượng carton phải là số nguyên dương.");
  }
  return value;
}

export async function listPackingCartons(orderId: string) {
  return prisma.orderPackingCarton.findMany({
    where: { orderId }, orderBy: [{ createdAt: "desc" }],
    select: { id: true, orderId: true, orderItemId: true, orderItemVariantId: true,
      cartonCode: true, quantity: true, marketCode: true, sizeSnapshot: true,
      status: true, sealedAt: true, note: true, createdAt: true },
  });
}

export async function createPackingCarton(orderId: string, input: {
  orderItemId: string; orderItemVariantId?: string | null; cartonCode: string;
  quantity: number; marketCode?: string | null; sizeSnapshot?: string | null; note?: string | null;
}) {
  const quantity = positiveInteger(input.quantity);
  const cartonCode = input.cartonCode?.trim();
  if (!cartonCode || cartonCode.length > 80) throw new ProductionExecutionValidationError("Mã carton phải có từ 1 đến 80 ký tự.");
  if ((input.note?.length ?? 0) > 1000) throw new ProductionExecutionValidationError("Ghi chú quá dài.");
  return prisma.$transaction(async tx => {
    const item = await tx.orderItem.findFirst({ where: { orderId, id: input.orderItemId } });
    if (!item) throw new ProductionExecutionValidationError("SKU không thuộc đơn hàng.");
    const variantsInItem = await tx.orderItemVariant.count({ where: { orderItemId: item.id } });
    if (variantsInItem > 0 && !input.orderItemVariantId) {
      throw new ProductionExecutionValidationError("SKU có size/variant cần chọn đúng biến thể trước khi đóng carton.");
    }
    if (input.orderItemVariantId) {
      const variant = await tx.orderItemVariant.findFirst({ where: { id: input.orderItemVariantId, orderItemId: item.id } });
      if (!variant) throw new ProductionExecutionValidationError("Size/variant không thuộc SKU.");
    }
    const duplicate = await tx.orderPackingCarton.findUnique({ where: { orderId_cartonCode: { orderId, cartonCode } } });
    if (duplicate) throw new ProductionExecutionValidationError("Mã carton đã tồn tại trong đơn hàng.");
    return tx.orderPackingCarton.create({ data: {
      orderId, orderItemId: item.id, orderItemVariantId: input.orderItemVariantId || null,
      cartonCode, quantity, marketCode: input.marketCode?.trim() || null,
      sizeSnapshot: input.sizeSnapshot?.trim() || null, note: input.note?.trim() || null,
    } });
  });
}

export async function setPackingCartonSealed(orderId: string, cartonId: string, seal: boolean) {
  return prisma.$transaction(async tx => {
    // Lock the order so parallel sealing of cartons cannot overbook QC passed quantity.
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;
    const carton = await tx.orderPackingCarton.findFirst({ where: { id: cartonId, orderId } });
    if (!carton) throw new ProductionExecutionValidationError("Không tìm thấy carton.");
    if (seal && carton.status === "SEALED") return carton;
    if (!seal && carton.status === "DRAFT") return carton;
    if (seal) {
      const passed = await tx.orderQcInspection.findMany({
        where: { orderId, orderItemId: carton.orderItemId, status: { in: ["PASSED", "PASSED_WITH_NOTE"] } },
        select: { passedQuantity: true },
      });
      const approved = passed.reduce((sum, qc) => sum.plus(qc.passedQuantity), new Decimal(0));
      const sealed = await tx.orderPackingCarton.aggregate({
        where: { orderId, orderItemId: carton.orderItemId, status: "SEALED" },
        _sum: { quantity: true },
      });
      if (new Decimal((sealed._sum.quantity ?? 0) + carton.quantity).gt(approved)) {
        throw new ProductionExecutionValidationError("Carton vượt số lượng QC đạt theo SKU.");
      }
      if (carton.orderItemVariantId) {
        const variant = await tx.orderItemVariant.findUnique({
          where: { id: carton.orderItemVariantId }, select: { quantity: true },
        });
        const variantSealed = await tx.orderPackingCarton.aggregate({
          where: { orderId, orderItemVariantId: carton.orderItemVariantId, status: "SEALED" },
          _sum: { quantity: true },
        });
        if (!variant || (variantSealed._sum.quantity ?? 0) + carton.quantity > variant.quantity) {
          throw new ProductionExecutionValidationError("Carton vượt số lượng đặt của size/variant.");
        }
      }
    } else {
      const shipped = await tx.orderDeliveryExecutionItem.aggregate({
        where: { orderItemId: carton.orderItemId, deliveryExecution: {
          orderId, status: { notIn: ["DRAFT", "READY_TO_DISPATCH", "CANCELLED"] },
        } },
        _sum: { dispatchedQuantity: true },
      });
      const sealed = await tx.orderPackingCarton.aggregate({
        where: { orderId, orderItemId: carton.orderItemId, status: "SEALED" },
        _sum: { quantity: true },
      });
      if (new Decimal((sealed._sum.quantity ?? 0) - carton.quantity).lt(shipped._sum.dispatchedQuantity ?? new Decimal(0))) {
        throw new ProductionExecutionValidationError("Không thể mở carton khi số lượng đã xuất hàng sẽ vượt số đã đóng.");
      }
    }
    return tx.orderPackingCarton.update({ where: { id: cartonId },
      data: { status: seal ? "SEALED" : "DRAFT", sealedAt: seal ? new Date() : null } });
  });
}
