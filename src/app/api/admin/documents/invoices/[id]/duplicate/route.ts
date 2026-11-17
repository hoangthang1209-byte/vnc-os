import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";
import { nextMonthlyCustomInvoiceNumber } from "@/features/documents/custom-invoice-calculation";
import { logAdminAuditEvent } from "@/features/auth/admin-audit-log";
import type { Prisma } from "@prisma/client";

/**
 * A duplicate is a new DRAFT, never a reopened issued document.
 * Payment and email delivery records belong exclusively to the source invoice.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAdminSessionFromRequest(request);
  if (!session.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session, "orders.view_financials") || !can(session, "quotes.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  try {
    const source = await prisma.customPaymentInvoice.findUnique({ where: { id } });
    if (!source) return NextResponse.json({ error: "Invoice nguồn không tồn tại." }, { status: 404 });
    if (source.status !== "DRAFT" && source.status !== "ISSUED") {
      return NextResponse.json({ error: "Không thể nhân bản hóa đơn ở trạng thái này." }, { status: 409 });
    }
    // Validate relationships again: master data may be archived since the source was issued.
    if (!source.legalEntityId || !source.bankAccountId) {
      return NextResponse.json({ error: "Invoice nguồn không có cấu hình pháp nhân/ngân hàng hợp lệ." }, { status: 409 });
    }
    const [entity, bank, customer, order] = await Promise.all([
      prisma.vncLegalEntity.findUnique({ where: { id: source.legalEntityId } }),
      prisma.vncBankAccount.findUnique({ where: { id: source.bankAccountId } }),
      source.customerId ? prisma.customer.findUnique({ where: { id: source.customerId }, select: { id: true } }) : null,
      source.orderId ? prisma.order.findUnique({ where: { id: source.orderId }, select: { id: true, customerId: true } }) : null,
    ]);
    if (!entity?.isActive || !bank?.isActive || bank.legalEntityId !== entity.id ||
        (bank.currency && bank.currency !== source.currency)) {
      return NextResponse.json({ error: "Pháp nhân hoặc tài khoản ngân hàng đã thay đổi. Hãy tạo Invoice mới với cấu hình hiện hành." }, { status: 409 });
    }
    if ((source.customerId && !customer) || (source.orderId && !order) ||
        (order?.customerId && source.customerId && order.customerId !== source.customerId)) {
      return NextResponse.json({ error: "Liên kết CRM/đơn hàng nguồn không còn hợp lệ." }, { status: 409 });
    }
    const employee = session.employeeId
      ? await prisma.employee.findUnique({ where: { id: session.employeeId }, select: { fullName: true } })
      : null;
    const creatorName = (employee?.fullName?.trim() || session.username?.trim() ||
      (session.mode === "owner" ? "VNC Owner" : "Authenticated Admin")).slice(0, 250);
    const now = new Date();
    const year = now.getUTCFullYear(), month = now.getUTCMonth() + 1;
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const dueDate = source.dueDate
      ? new Date(now.getTime() + Math.max(0, Math.round((source.dueDate.getTime() - source.issueDate.getTime()) / 86400000)) * 86400000)
      : null;

    const duplicate = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`vnc-custom-invoice-${monthKey}`}))`;
      const existing = await tx.customPaymentInvoice.findMany({
        where: { invoiceNo: { startsWith: `CI-${monthKey}-` } }, select: { invoiceNo: true },
      });
      const invoiceNo = nextMonthlyCustomInvoiceNumber(year, month, existing.map(i => i.invoiceNo));
      return tx.customPaymentInvoice.create({
        data: {
          invoiceNo, status: "DRAFT",
          currency: source.currency,
          recipientName: source.recipientName,
          recipientEmail: source.recipientEmail,
          recipientCcEmails: source.recipientCcEmails,
          recipientAddress: source.recipientAddress,
          customerId: source.customerId, orderId: source.orderId,
          legalEntityId: entity.id, bankAccountId: bank.id,
          issuerName: entity.legalName, issuerAddress: entity.address, issuerTaxId: entity.taxCode,
          bankDetails: {
            bank: bank.bankName, account: bank.accountNo, beneficiary: bank.accountName,
            swift: bank.swift, accountAddress: bank.accountAddress,
            bankAddress: bank.bankAddress, branch: bank.branch, currency: bank.currency ?? source.currency,
          },
          lines: source.lines as Prisma.InputJsonValue,
          adjustments: source.adjustments as Prisma.InputJsonValue,
          subtotal: source.subtotal, total: source.total,
          issueDate: now, dueDate, notes: source.notes,
          preparedByEmployeeId: source.preparedByEmployeeId,
          preparedByName: source.preparedByName,
          createdByUserId: session.userId,
          createdByEmployeeId: session.employeeId,
          createdByDisplayName: creatorName,
          createdByMode: session.mode,
          // Deliberately NOT copied: issuedSnapshot, issuedAt, all email/delivery fields.
        },
      });
    }, { maxWait: 5000, timeout: 15000 });
    logAdminAuditEvent({
      action: "custom_invoice_duplicated", userId: session.userId, employeeId: session.employeeId,
      route: request.nextUrl.pathname,
      detail: { sourceInvoiceId: source.id, sourceInvoiceNo: source.invoiceNo,
        newInvoiceId: duplicate.id, newInvoiceNo: duplicate.invoiceNo },
    });
    return NextResponse.json({
      id: duplicate.id, invoiceNo: duplicate.invoiceNo, status: duplicate.status,
      sourceInvoiceNo: source.invoiceNo,
      invoice: {
        recipientName: duplicate.recipientName, recipientAddress: duplicate.recipientAddress ?? "",
        recipientEmail: duplicate.recipientEmail ?? "", recipientCcEmails: duplicate.recipientCcEmails ?? "",
        customerId: duplicate.customerId ?? "", orderId: duplicate.orderId ?? "",
        legalEntityId: duplicate.legalEntityId ?? "", bankAccountId: duplicate.bankAccountId ?? "",
        currency: duplicate.currency,
        issuerName: duplicate.issuerName, issuerAddress: duplicate.issuerAddress ?? "",
        issuerTaxId: duplicate.issuerTaxId ?? "",
        beneficiary: bank.accountName, bank: bank.bankName, bankAccount: bank.accountNo,
        accountAddress: bank.accountAddress ?? "", bankAddress: bank.bankAddress ?? "",
        branch: bank.branch ?? "", swift: bank.swift ?? "",
        issueDate: duplicate.issueDate.toISOString().slice(0, 10),
        dueDate: duplicate.dueDate?.toISOString().slice(0, 10) ?? "",
        lines: duplicate.lines, adjustments: duplicate.adjustments,
        notes: duplicate.notes ?? "",
        preparedByName: duplicate.preparedByName ?? "",
        preparedByEmployeeId: duplicate.preparedByEmployeeId ?? "",
      },
    }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Xung đột số Invoice, vui lòng thử lại." }, { status: 409 });
    }
    console.error("[custom invoice duplicate]", error);
    return NextResponse.json({ error: "Không thể nhân bản Invoice." }, { status: 500 });
  }
}
