import { Prisma, SupplierCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  generateMasterCode,
  ProductionMasterValidationError,
} from "@/features/production-master/production-master.errors";
import { parseSupplierCategory } from "@/features/patterns/pattern-supplier-snapshots";

import { getProductionSupplierUsageCount } from "@/features/production-master/production-master-usage";

export async function listProductionSuppliers(input?: {
  search?: string;
  activeOnly?: boolean;
  inactiveOnly?: boolean;
  category?: string;
  supplierType?: string;
  verificationStatus?: string;
  page?: number;
  pageSize?: number;
}) {
  const where: Prisma.ProductionSupplierWhereInput = {};
  if (input?.activeOnly) where.isActive = true;
  if (input?.inactiveOnly) where.isActive = false;
  const category = parseSupplierCategory(input?.category);
  if (category) where.category = category;
  if (input?.supplierType) where.supplierType = input.supplierType;
  if (input?.verificationStatus) where.verificationStatus = input.verificationStatus;
  if (input?.search?.trim()) {
    const q = input.search.trim();
    where.OR = [
      { code: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { contact: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { capabilities: { contains: q, mode: "insensitive" } },
      { factoryAddress: { contains: q, mode: "insensitive" } },
    ];
  }
  const page = Math.max(1, Math.floor(input?.page ?? 1));
  const pageSize = Math.min(1000, Math.max(1, Math.floor(input?.pageSize ?? 1000)));
  const [total, items] = await prisma.$transaction([prisma.productionSupplier.count({ where }), prisma.productionSupplier.findMany({
    where,
    include: {
      _count: {
        select: {
          bomItems: true,
          materials: true,
          trims: true,
          patterns: true,
        },
      },
    },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
  })]);
  return {
    total, page, pageSize, totalPages: Math.ceil(total / pageSize),
    items: items.map(({ _count, ...item }) => ({
      ...item,
      usageCount: _count.bomItems + _count.materials + _count.trims + _count.patterns,
      patternCount: _count.patterns,
    })),
  };
}

export async function getProductionSupplier(id: string) {
  const item = await prisma.productionSupplier.findUnique({ where: { id } });
  if (!item) return null;
  const usage = await getProductionSupplierUsageCount(id);
  return {
    ...item,
    usageCount: usage.total,
    usageBreakdown: {
      techPackBom: usage.bomCount,
      materialCount: usage.materialCount,
      trimCount: usage.trimCount,
      patternCount: usage.patternCount,
    },
  };
}

async function assertNotDuplicateSupplier(name: string, phone?: string | null, exceptId?: string) {
  const normalized = name.trim().replace(/\s+/g, " ");
  const existing = await prisma.productionSupplier.findFirst({
    where: {
      ...(exceptId ? { id: { not: exceptId } } : {}),
      OR: [
        { name: { equals: normalized, mode: "insensitive" } },
        ...(phone?.trim() ? [{ phone: { equals: phone.trim() } }] : []),
      ],
    },
    select: { code: true, name: true },
  });
  if (existing) throw new ProductionMasterValidationError(`Có thể trùng NCC ${existing.code} - ${existing.name}. Kiểm tra trước khi lưu.`);
}

function assertSupplierQualification(input: {
  supplierType?: string;
  verificationStatus?: string;
  factoryAddress?: string | null;
  sourceUrl?: string | null;
  isActive?: boolean;
}) {
  if (input.verificationStatus === "APPROVED" &&
      input.supplierType === "DIRECT_MANUFACTURER" &&
      (!input.factoryAddress?.trim() || !input.sourceUrl?.trim())) {
    throw new ProductionMasterValidationError("Duyệt xưởng trực tiếp cần địa chỉ xưởng và nguồn bằng chứng.");
  }
  if (input.isActive === true && input.verificationStatus === "REJECTED") {
    throw new ProductionMasterValidationError("Không thể kích hoạt nhà cung cấp đã bị đánh giá không đạt.");
  }
}

export async function createProductionSupplier(input: {
  name: string;
  category?: SupplierCategory;
  supplierType?: string;
  verificationStatus?: string;
  factoryAddress?: string | null;
  website?: string | null;
  capabilities?: string | null;
  sourceUrl?: string | null;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
}) {
  const name = input.name?.trim();
  if (!name) throw new ProductionMasterValidationError("Tên nhà cung cấp là bắt buộc.");
  await assertNotDuplicateSupplier(name, input.phone);
  assertSupplierQualification(input);
  const code = await generateMasterCode("PS", "productionSupplier");
  return prisma.productionSupplier.create({
    data: {
      code,
      name,
      category: input.category ?? SupplierCategory.GENERAL,
      supplierType: input.supplierType ?? "UNKNOWN",
      verificationStatus: input.verificationStatus ?? "UNVERIFIED",
      factoryAddress: input.factoryAddress?.trim() || null,
      website: input.website?.trim() || null,
      capabilities: input.capabilities?.trim() || null,
      sourceUrl: input.sourceUrl?.trim() || null,
      contact: input.contact?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateProductionSupplier(
  id: string,
  input: Partial<{
    name: string;
    category: SupplierCategory;
    supplierType: string;
    verificationStatus: string;
    factoryAddress: string | null;
    website: string | null;
    capabilities: string | null;
    sourceUrl: string | null;
    contact: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    isActive: boolean;
  }>,
) {
  const existing = await prisma.productionSupplier.findUnique({ where: { id } });
  if (!existing) throw new ProductionMasterValidationError("Không tìm thấy nhà cung cấp.");
  if (input.name !== undefined && !input.name.trim()) throw new ProductionMasterValidationError("Tên nhà cung cấp là bắt buộc.");
  if (input.name !== undefined || input.phone !== undefined) await assertNotDuplicateSupplier(input.name ?? existing.name, input.phone === undefined ? existing.phone : input.phone, id);
  assertSupplierQualification({ supplierType: input.supplierType ?? existing.supplierType, verificationStatus: input.verificationStatus ?? existing.verificationStatus, factoryAddress: input.factoryAddress === undefined ? existing.factoryAddress : input.factoryAddress, sourceUrl: input.sourceUrl === undefined ? existing.sourceUrl : input.sourceUrl, isActive: input.isActive ?? existing.isActive });
  return prisma.productionSupplier.update({
    where: { id },
    data: {
      name: input.name?.trim() ?? undefined,
      category: input.category,
      supplierType: input.supplierType,
      verificationStatus: input.verificationStatus,
      factoryAddress: input.factoryAddress,
      website: input.website,
      capabilities: input.capabilities,
      sourceUrl: input.sourceUrl,
      contact: input.contact,
      email: input.email,
      phone: input.phone,
      address: input.address,
      notes: input.notes,
      isActive: input.isActive,
    },
  });
}

export { ProductionMasterValidationError } from "@/features/production-master/production-master.errors";
