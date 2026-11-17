import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";
import type { Prisma } from "@prisma/client";
import { logAdminAuditEvent } from "@/features/auth/admin-audit-log";

/**
 * Issuance freezes the exact commercial payment request at the time of issue.
 * The immutable snapshot is used for every subsequent PDF download.
 */
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}) {
  const session=getAdminSessionFromRequest(request);
  if(!session.authenticated)return NextResponse.json({error:"Unauthorized"},{status:401});
  if(!can(session,"orders.view_financials") || !can(session,"payments.manage"))return NextResponse.json({error:"Forbidden"},{status:403});
  const {id}=await context.params;
  try {
    const result=await prisma.$transaction(async tx=>{
      const invoice=await tx.customPaymentInvoice.findUnique({where:{id}});
      if(!invoice)return null;
      if(invoice.status!=="DRAFT")return {error:"Invoice has already been issued"};
      // Link and supersede the source only on the replacement's successful issue.
      let sourceInvoiceNo:string|null=null;
      if(invoice.replacesInvoiceId){
        const source=await tx.customPaymentInvoice.findUnique({where:{id:invoice.replacesInvoiceId}});
        if(!source || source.status!=="ISSUED" || source.replacedByInvoiceId){
          return {error:"Invoice nguồn không còn đủ điều kiện thay thế."};
        }
        if(!invoice.replacementReason || invoice.replacementReason.trim().length<10){
          return {error:"Missing replacement reason"};
        }
        sourceInvoiceNo=source.invoiceNo;
      }
      if(!invoice.recipientName.trim() || !invoice.issuerName.trim())return {error:"Issuer and recipient required"};
      const bank=invoice.bankDetails as Record<string,unknown>|null;
      if(!bank || typeof bank.beneficiary!=="string" || !bank.beneficiary.trim() ||
        typeof bank.bank!=="string" || !bank.bank.trim() ||
        typeof bank.account!=="string" || !bank.account.trim()) {
        return {error:"Verified beneficiary, bank and account are required before issue"};
      }
      if(bank.swift && (typeof bank.swift!=="string" || !/^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/.test(bank.swift.trim()))) {
        return {error:"SWIFT/BIC phải gồm 8 hoặc 11 ký tự đúng cấu trúc. Không nhập số tài khoản vào ô SWIFT."};
      }
      const companyBranding=await tx.vncOsCompanyBranding.findUnique({where:{id:"default"},select:{logoUrl:true}});
      const snapshot={
        companyLogoUrl:companyBranding?.logoUrl??null,
        invoiceNo:invoice.invoiceNo,
        customerId:invoice.customerId,
        orderId:invoice.orderId,
        legalEntityId:invoice.legalEntityId,
        bankAccountId:invoice.bankAccountId,
        createdByUserId:invoice.createdByUserId,
        createdByEmployeeId:invoice.createdByEmployeeId,
        createdByDisplayName:invoice.createdByDisplayName,
        createdByMode:invoice.createdByMode,
        preparedByName:invoice.preparedByName,
        preparedByEmployeeId:invoice.preparedByEmployeeId,
        recipientName:invoice.recipientName,recipientEmail:invoice.recipientEmail,
        recipientCcEmails:invoice.recipientCcEmails,
        recipientAddress:invoice.recipientAddress,
        deliveryRecipientName:invoice.deliveryRecipientName,
        deliveryRecipientPhone:invoice.deliveryRecipientPhone,
        deliveryRecipientAddress:invoice.deliveryRecipientAddress,
        issuerName:invoice.issuerName,issuerAddress:invoice.issuerAddress,
        issuerTaxId:invoice.issuerTaxId,bankDetails:invoice.bankDetails,
        currency:invoice.currency,total:invoice.total,subtotal:invoice.subtotal,
        lines:invoice.lines,adjustments:invoice.adjustments,
        issueDate:invoice.issueDate.toISOString(),dueDate:invoice.dueDate?.toISOString()??null,
        notes:invoice.notes,
        replacesInvoiceId:invoice.replacesInvoiceId,
        replacementReason:invoice.replacementReason,
        replacesInvoiceNo:sourceInvoiceNo,
      } as Prisma.InputJsonValue;
      if(invoice.replacesInvoiceId){
        const superseded=await tx.customPaymentInvoice.updateMany({
          where:{id:invoice.replacesInvoiceId,status:"ISSUED",replacedByInvoiceId:null},
          data:{status:"SUPERSEDED",replacedByInvoiceId:id,replacedAt:new Date()}
        });
        if(superseded.count!==1)return {error:"Invoice nguồn đã được thay thế bởi yêu cầu khác."};
      }
      const changed=await tx.customPaymentInvoice.updateMany({where:{id,status:"DRAFT"},data:{status:"ISSUED",issuedAt:new Date(),issuedSnapshot:snapshot}});
      // Throwing here (rather than returning an error) ensures source status rolls back.
      if(changed.count!==1)throw new Error("Invoice issuance conflict");

      return {id,invoiceNo:invoice.invoiceNo,status:"ISSUED",replacesInvoiceId:invoice.replacesInvoiceId};
    });
    if(!result)return NextResponse.json({error:"Not found"},{status:404});
    if("error" in result)return NextResponse.json(result,{status:409});
    logAdminAuditEvent({action:result.replacesInvoiceId?"custom_invoice_replacement_issued":"custom_invoice_issued",userId:session.userId,employeeId:session.employeeId,route:request.nextUrl.pathname,detail:{id:result.id,invoiceNo:result.invoiceNo,replacesInvoiceId:result.replacesInvoiceId}});
    return NextResponse.json(result);
  }catch(error) {
    if(typeof error==="object"&&error&&"code" in error&&error.code==="P2021")return NextResponse.json({error:"Cấu hình công ty VNC chưa được migrate. Vui lòng liên hệ quản trị hệ thống."},{status:503});
    console.error("[custom invoice issue]",error);
    return NextResponse.json({error:"Unable to issue invoice"},{status:500});
  }
}
