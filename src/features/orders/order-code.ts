import { prisma } from "@/lib/prisma";

/**
 * Official VNC OS order numbers: ORD-YYYY-NNNNNN.
 * The first live order is ORD-2026-000001 (BIGBANG Batch 2).
 * Sequence resets by Vietnam-local calendar year, but never uses total row
 * count: historical/demo deletions must not cause code reuse.
 *
 * Order creation already retries unique-key races in order.service.ts.
 */
export async function generateOrderNo(): Promise<string> {
  const year = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
  }).format(new Date());
  const prefix = `ORD-${year}-`;
  const latest = await prisma.order.findFirst({
    where: { orderNo: { startsWith: prefix } },
    orderBy: { orderNo: "desc" },
    select: { orderNo: true },
  });
  const previous = latest?.orderNo.match(new RegExp(`^ORD-${year}-(\\d{6})$`));
  const next = previous ? Number(previous[1]) + 1 : 1;
  if (next > 999999) throw new Error(`VNC Order numbering exhausted for ${year}`);
  return `${prefix}${String(next).padStart(6, "0")}`;
}
