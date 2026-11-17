import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";
import { calculateCustomInvoice, formatMinor, type InvoiceCurrency, type InvoiceLine } from "@/features/documents/custom-invoice-calculation";
import { parseInvoiceRecipients } from "@/features/documents/invoice-email";
import { logAdminAuditEvent } from "@/features/auth/admin-audit-log";

const required = (v: unknown, max = 250) => {
  if (typeof v !== "string" || !v.trim() || v.length > max) throw new Error("Invalid required field");
  return v.trim();
};
const optional = (v: unknown, max = 1000) => v == null || v === "" ? null : required(v, max);
const date = (v: unknown) => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error("Invalid date");
  const d = new Date(v + "T00:00:00.000Z");
  if (d.toISOString().slice(0,10) !== v) throw new Error("Invalid date");
  return d;
};

/** Save changes only while still DRAFT, preserving the number, creator and audit history. */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAdminSessionFromRequest(request);
  if (!session.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session,"orders.view_financials") || !can(session,"quotes.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid request");
    const input = body as Record<string, unknown>;
    const original = await prisma.customPaymentInvoice.findUnique({ where: { id } });
    if (!original) return NextResponse.json({ error: "Không tìm thấy hóa đơn." }, { status: 404 });
    if (original.status !== "DRAFT") return NextResponse.json({ error: "Hóa đơn đã phát hành không thể chỉnh sửa." }, { status: 409 });

    const currency = required(input.currency, 3) as InvoiceCurrency;
    if (!["VND","USD","EUR"].includes(currency)) throw new Error("Invalid currency");
    if (!Array.isArray(input.lines) || !input.lines.length || input.lines.length > 100) throw new Error("Invalid lines");
    const lines: InvoiceLine[] = input.lines.map((v: unknown) => {
      if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("Invalid line");
      const l = v as Record<string, unknown>;
      return { description: required(l.description,500), quantity: required(l.quantity,32),
        unit: required(l.unit,32), unitPrice: required(l.unitPrice,32) };
    });
    const adjustments = { discount: optional(input.discount,32) ?? "0",
      extraCharge: optional(input.extraCharge,32) ?? "0", tax: optional(input.tax,32) ?? "0" };
    const totals = calculateCustomInvoice({ currency, lines, ...adjustments });
    const legalEntityId = required(input.legalEntityId,100);
    const bankAccountId = required(input.bankAccountId,100);
    const [entity, bank] = await Promise.all([
      prisma.vncLegalEntity.findUnique({where:{id:legalEntityId}}),
      prisma.vncBankAccount.findUnique({where:{id:bankAccountId}}),
    ]);
    if (!entity?.isActive || !bank?.isActive || bank.legalEntityId !== entity.id ||
        (bank.currency && bank.currency !== currency)) {
      return NextResponse.json({ error: "Pháp nhân/ngân hàng không hợp lệ hoặc sai loại tiền." }, { status: 400 });
    }
    const customerId = optional(input.customerId,100);
    const orderId = optional(input.orderId,100);
    if (orderId && !can(session,"orders.view")) return NextResponse.json({error:"Forbidden"},{status:403});
    const [customer,order] = await Promise.all([
      customerId ? prisma.customer.findUnique({where:{id:customerId},select:{id:true}}) : null,
      orderId ? prisma.order.findUnique({where:{id:orderId},select:{id:true,customerId:true}}) : null,
    ]);
    if ((customerId && !customer) || (orderId && !order) || (order?.customerId && customerId && order.customerId !== customerId)) {
      return NextResponse.json({error:"Khách hàng/đơn hàng liên kết không hợp lệ."},{status:400});
    }
    const issueDate = date(input.issueDate);
    const dueDate = input.dueDate ? date(input.dueDate) : null;
    if (dueDate && dueDate < issueDate) throw new Error("Due date precedes issue date");
    const emails = parseInvoiceRecipients(input.recipientEmail,10);
    const cc = parseInvoiceRecipients(input.recipientCcEmails,10).filter(e=>!emails.includes(e));
    if (emails.length + cc.length > 20) throw new Error("Too many recipients");
    const preparerId = optional(input.preparedByEmployeeId,100);
    const preparer = preparerId ? await prisma.employee.findUnique({where:{id:preparerId},select:{id:true,fullName:true,isActive:true}}) : null;
    if (preparerId && !preparer?.isActive) return NextResponse.json({error:"Nhân viên phụ trách không hợp lệ."},{status:400});
    const changed = await prisma.customPaymentInvoice.updateMany({
      where: { id, status: "DRAFT" },
      data: {
        customerId,orderId, legalEntityId,bankAccountId,currency,
        recipientName:required(input.recipientName,250),
        recipientAddress:optional(input.recipientAddress,1000),
        deliveryRecipientName:optional(input.deliveryRecipientName,250),
        deliveryRecipientPhone:optional(input.deliveryRecipientPhone,50),
        deliveryRecipientAddress:optional(input.deliveryRecipientAddress,1500),
        recipientEmail:emails.join(", ") || null, recipientCcEmails:cc.join(", ") || null,
        issuerName:entity.legalName,issuerAddress:entity.address,issuerTaxId:entity.taxCode,
        bankDetails: { bank:bank.bankName, account:bank.accountNo, beneficiary:bank.accountName,
          swift:bank.swift,accountAddress:bank.accountAddress,bankAddress:bank.bankAddress,
          branch:bank.branch,currency:bank.currency??currency },
        lines,adjustments,subtotal:formatMinor(totals.subtotalMinor,currency),
        total:formatMinor(totals.totalMinor,currency),issueDate,dueDate,
        notes:optional(input.notes,2000),
        preparedByEmployeeId:preparerId,preparedByName:preparer?.fullName ?? null,
      },
    });
    if (!changed.count) return NextResponse.json({error:"Bản nháp vừa được phát hành hoặc thay đổi trạng thái."},{status:409});
    logAdminAuditEvent({action:"custom_invoice_draft_updated",userId:session.userId,
      employeeId:session.employeeId,route:request.nextUrl.pathname,detail:{id,invoiceNo:original.invoiceNo}});
    return NextResponse.json({id,invoiceNo:original.invoiceNo,status:"DRAFT"});
  } catch(error) {
    if (error instanceof Error && /Invalid|Too many|Due date|Discount|Quantity|decimal|required/i.test(error.message)) {
      return NextResponse.json({error:"Thông tin bản nháp không hợp lệ: "+error.message},{status:400});
    }
    console.error("[custom invoice draft update]",error);
    return NextResponse.json({error:"Không thể cập nhật bản nháp."},{status:500});
  }
}
