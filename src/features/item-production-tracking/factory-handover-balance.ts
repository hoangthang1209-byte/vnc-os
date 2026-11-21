/** Pure quantity reconciliation for four physical custody checkpoints. */
export const FACTORY_HANDOVER_TYPES = ["VNC_DISPATCH", "FACTORY_RECEIVE", "FACTORY_RETURN", "VNC_RECEIVE"] as const;
export type FactoryHandoverType = typeof FACTORY_HANDOVER_TYPES[number];
export type FactoryHandoverTotals = {
  dispatched: number; factoryReceived: number; factoryReturned: number; vncReceived: number;
  awaitingFactory: number; withFactory: number; returning: number;
};

export function reconcileFactoryHandover(
  planned: number, entries: Array<{ type: FactoryHandoverType; quantity: number }>,
): FactoryHandoverTotals {
  if (!Number.isSafeInteger(planned) || planned < 0) throw new Error("Số lượng kế hoạch không hợp lệ.");
  const sum: Record<FactoryHandoverType, number> = {
    VNC_DISPATCH: 0, FACTORY_RECEIVE: 0, FACTORY_RETURN: 0, VNC_RECEIVE: 0,
  };
  for (const e of entries) {
    if (!FACTORY_HANDOVER_TYPES.includes(e.type) || !Number.isSafeInteger(e.quantity) || e.quantity <= 0) {
      throw new Error("Nhật ký giao nhận có dữ liệu không hợp lệ.");
    }
    sum[e.type] += e.quantity;
  }
  const dispatched = sum.VNC_DISPATCH, factoryReceived = sum.FACTORY_RECEIVE;
  const factoryReturned = sum.FACTORY_RETURN, vncReceived = sum.VNC_RECEIVE;
  if (dispatched > planned || factoryReceived > dispatched || factoryReturned > factoryReceived || vncReceived > factoryReturned) {
    throw new Error("Số lượng bàn giao không khớp với lô sản xuất.");
  }
  return {
    dispatched, factoryReceived, factoryReturned, vncReceived,
    awaitingFactory: dispatched - factoryReceived,
    withFactory: factoryReceived - factoryReturned,
    returning: factoryReturned - vncReceived,
  };
}

export function validateFactoryHandover(
  planned: number,
  existing: Array<{ type: FactoryHandoverType; quantity: number }>,
  entry: { type: FactoryHandoverType; quantity: number },
): FactoryHandoverTotals {
  if (!FACTORY_HANDOVER_TYPES.includes(entry.type)) throw new Error("Loại giao nhận không hợp lệ.");
  if (!Number.isSafeInteger(entry.quantity) || entry.quantity <= 0) throw new Error("Số lượng phải là số nguyên dương.");
  return reconcileFactoryHandover(planned, [...existing, entry]);
}
