import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { can } from "@/features/auth/admin-permissions";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { calculateCustomInvoice, formatMinor, nextCustomInvoiceNumber, type InvoiceCurrency, type InvoiceLine } from "@/features/documents/custom-invoice-calculation";

function authorize(request: NextRequest, permission: string) {
  const session=getAdminSessionFromRequest(request);
  if (!session.authenticated) return NextResponse.json({error:"Unauthorized"},{status:401});
  if (!can(session,"orders.view_financials") || !can(session,permission)) return NextResponse.json({error:"Forbidden"},{status:403});
  return null;
}
function required(value: unknown, max=250): string {
  if (typeof value!=="string" || !value.trim() || value.length>max) throw new Error("Missing or invalid required field");
  return value.trim();
}
function optional(value: unknown, max=1000): string | null {
  if (value==null || value==="") return null;
  return required(value,max);
}
function strictDate(value: unknown): Date {
  if(typeof value!=="string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Invalid date");
  const parsed=new Date(value+"T00:00:00.000Z");
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10)!==value) throw new Error("Invalid date");
  return parsed;
}
export async function POST(request: NextRequest) {
  const refused=authorize(request,"quotes.create");if(refused)return refused;
  try {
    const creatorSession=getAdminSessionFromRequest(request);
    // Creator attribution always comes from the verified session; ignore client-supplied author fields.
    const employee=creatorSession.employeeId
      ? await prisma.employee.findUnique({where:{id:creatorSession.employeeId},select:{fullName:true}})
      : null;
    const creatorName=employee?.fullName?.trim()||creatorSession.username?.trim()
      ||(creatorSession.mode==="owner"?"VNC Owner":creatorSession.employeeId?"Employee "+creatorSession.employeeId:"Authenticated Admin");
    const data:unknown=await request.json();
    if (!data || typeof data!=="object" || Array.isArray(data)) throw new Error("Invalid invoice");
    const body=data as Record<string,unknown>;
    const currency=required(body.currency,3) as InvoiceCurrency;
    if (!["USD","VND","EUR"].includes(currency)) throw new Error("Unsupported currency");
    if (!Array.isArray(body.lines) || body.lines.length<1 || body.lines.length>100) throw new Error("Require 1-100 items");
    const lines:InvoiceLine[]=body.lines.map((entry:unknown)=>{
      if(!entry || typeof entry!=="object" || Array.isArray(entry)) throw new Error("Invalid item");
      const item=entry as Record<string,unknown>;
      return { description:required(item.description,500),quantity:required(item.quantity,32),unit:required(item.unit,32),unitPrice:required(item.unitPrice,32) };
    });
    const adjustments={discount:optional(body.discount,32)||"0",extraCharge:optional(body.extraCharge,32)||"0",tax:optional(body.tax,32)||"0"};
    const totals=calculateCustomInvoice({currency,lines,...adjustments});
    const customerId=body.customerId==null||body.customerId===""?null:required(body.customerId,100);
    if(customerId){
      const customer=await prisma.customer.findUnique({where:{id:customerId},select:{id:true}});
      if(!customer)return NextResponse.json({error:"Khách hàng liên kết không tồn tại trong CRM."},{status:400});
    }
    const orderId=body.orderId==null||body.orderId===""?null:required(body.orderId,100);
    if(orderId){
      if(!can(getAdminSessionFromRequest(request),"orders.view"))return NextResponse.json({error:"Bạn chưa có quyền liên kết đơn hàng."},{status:403});
      const order=await prisma.order.findUnique({where:{id:orderId},select:{id:true,customerId:true}});
      if(!order)return NextResponse.json({error:"Đơn hàng được chọn không tồn tại."},{status:400});
      if(customerId&&order.customerId&&customerId!==order.customerId)
        return NextResponse.json({error:"Khách hàng Invoice không trùng với khách hàng trên đơn hàng đã liên kết."},{status:400});
    }
    const legalEntityId=body.legalEntityId==null||body.legalEntityId===""?null:required(body.legalEntityId,100);
    const bankAccountId=body.bankAccountId==null||body.bankAccountId===""?null:required(body.bankAccountId,100);
    const entity=legalEntityId?await prisma.vncLegalEntity.findUnique({where:{id:legalEntityId}}):null;
    if(legalEntityId&&(!entity||!entity.isActive))return NextResponse.json({error:"Pháp nhân đã chọn không tồn tại hoặc không còn hoạt động."},{status:400});
    const account=bankAccountId?await prisma.vncBankAccount.findUnique({where:{id:bankAccountId}}):null;
    if(bankAccountId&&(!account||!account.isActive||account.legalEntityId!==legalEntityId))
      return NextResponse.json({error:"Tài khoản ngân hàng không thuộc pháp nhân đã chọn hoặc đã ngừng hoạt động."},{status:400});
    if(account?.currency&&account.currency!==currency)
      return NextResponse.json({error:"Loại tiền Invoice phải trùng loại tiền của tài khoản nhận thanh toán."},{status:400});
    const issueDate=strictDate(body.issueDate);
    const dueDate=body.dueDate ? strictDate(body.dueDate):null;
    if(dueDate && dueDate < issueDate) throw new Error("Due date precedes issue date");
    const year=issueDate.getUTCFullYear();
    const invoice=await prisma.$transaction(async tx=>{
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`vnc-custom-invoice-${year}`}))`;
      const prefix=`CI-${year}-`;
      const existing=await tx.customPaymentInvoice.findMany({where:{invoiceNo:{startsWith:prefix}},select:{invoiceNo:true}});
      const invoiceNo=nextCustomInvoiceNumber(year,existing.map(row=>row.invoiceNo));
      return tx.customPaymentInvoice.create({data:{
      invoiceNo,
      createdByUserId:creatorSession.userId,
      createdByEmployeeId:creatorSession.employeeId,
      createdByDisplayName:creatorName.slice(0,250),
      createdByMode:creatorSession.mode,
      customerId,
      orderId,
      legalEntityId,
      bankAccountId,
      currency,
      recipientName:required(body.recipientName,250),
      recipientEmail:optional(body.recipientEmail,250),
      recipientAddress:optional(body.recipientAddress,1000),
      issuerName:entity?.legalName??required(body.issuerName,250),
      issuerAddress:entity?.address??optional(body.issuerAddress,1000),
      issuerTaxId:entity?.taxCode??optional(body.issuerTaxId,80),
      bankDetails:{
        bank:account?.bankName??optional(body.bank,200),
        account:account?.accountNo??optional(body.bankAccount,100),
        beneficiary:account?.accountName??optional(body.beneficiary,200),
        swift:account?.swift??optional(body.swift,80),
        accountAddress:account?.accountAddress??optional(body.accountAddress,1500),
        bankAddress:account?.bankAddress??optional(body.bankAddress,1500),
        branch:account?.branch??optional(body.branch,200),
        currency:account?.currency??currency,
      },
      lines,
      adjustments,
      subtotal:formatMinor(totals.subtotalMinor,currency),
      total:formatMinor(totals.totalMinor,currency),
      issueDate,
      dueDate,
      notes:optional(body.notes,2000)
    }});
    },{maxWait:5000,timeout:15000});
    return NextResponse.json({id:invoice.id,invoiceNo:invoice.invoiceNo,total:invoice.total},{status:201});
  } catch(error) {
    if (typeof error==="object" && error && "code" in error && error.code==="P2002") return NextResponse.json({error:"Xung đột số Invoice tự động. Vui lòng thử lưu lại."},{status:409});
    if (typeof error==="object" && error && "code" in error && error.code==="P2021") return NextResponse.json({error:"Database migration required"},{status:503});
    if(error instanceof Error && /Invalid decimal amount/.test(error.message))return NextResponse.json({error:"Số tiền không hợp lệ. Chỉ dùng số như 20 hoặc 20.50; không nhập 020, dấu phẩy hay chữ."},{status:400});
    if(error instanceof Error && /Description required|Missing or invalid required field/.test(error.message))return NextResponse.json({error:"Thiếu nội dung khoản thu hoặc trường bắt buộc. Kiểm tra các khoản thu trống và thông tin công ty/khách hàng."},{status:400});
    if(error instanceof Error && /Discount exceeds subtotal/.test(error.message))return NextResponse.json({error:"Giảm trừ không được vượt quá tổng tiền hàng."},{status:400});
    if(error instanceof Error && /Quantity and unit price/.test(error.message))return NextResponse.json({error:"Số lượng phải lớn hơn 0 và đơn giá không được âm."},{status:400});
    if(error instanceof Error && /Invalid date|Due date precedes/.test(error.message))return NextResponse.json({error:"Ngày phát hành/hạn thanh toán không hợp lệ."},{status:400});
    console.error("[custom invoice create]",error);
    return NextResponse.json({error:"Không thể lưu Invoice. Kiểm tra dữ liệu hoặc liên hệ quản trị hệ thống.",code:"INVOICE_SAVE_FAILED"},{status:500});
  }
}
export async function GET(request:NextRequest) {
  const refused=authorize(request,"orders.view_financials");if(refused)return refused;
  try {
    const invoices=await prisma.customPaymentInvoice.findMany({take:100,orderBy:{createdAt:"desc"},select:{id:true,invoiceNo:true,status:true,recipientName:true,currency:true,total:true,createdAt:true,createdByDisplayName:true,createdByMode:true,orderId:true,customerId:true}});
    return NextResponse.json({invoices});
  }catch(error) {
    console.error("[custom invoice list]",error);
    return NextResponse.json({error:"Unable to load invoices"},{status:503});
  }
}
