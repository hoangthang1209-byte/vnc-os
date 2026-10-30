import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { can } from "@/features/auth/admin-permissions";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { calculateCustomInvoice, formatMinor, type InvoiceCurrency, type InvoiceLine } from "@/features/documents/custom-invoice-calculation";

function authorize(request: NextRequest, permission: string) {
  const session=getAdminSessionFromRequest(request);
  if (!session.authenticated) return NextResponse.json({error:"Unauthorized"},{status:401});
  if (!can(session,permission)) return NextResponse.json({error:"Forbidden"},{status:403});
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
  const refused=authorize(request,"documents.create");if(refused)return refused;
  try {
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
    const issueDate=strictDate(body.issueDate);
    const dueDate=body.dueDate ? strictDate(body.dueDate):null;
    if(dueDate && dueDate < issueDate) throw new Error("Due date precedes issue date");
    const invoice=await prisma.customPaymentInvoice.create({data:{
      invoiceNo:required(body.invoiceNo,80),
      currency,
      recipientName:required(body.recipientName,250),
      recipientEmail:optional(body.recipientEmail,250),
      recipientAddress:optional(body.recipientAddress,1000),
      issuerName:required(body.issuerName,250),
      issuerAddress:optional(body.issuerAddress,1000),
      issuerTaxId:optional(body.issuerTaxId,80),
      bankDetails:{bank:optional(body.bank,200),account:optional(body.bankAccount,100),beneficiary:optional(body.beneficiary,200),swift:optional(body.swift,80)},
      lines,
      adjustments,
      subtotal:formatMinor(totals.subtotalMinor,currency),
      total:formatMinor(totals.totalMinor,currency),
      issueDate,
      dueDate,
      notes:optional(body.notes,2000)
    }});
    return NextResponse.json({id:invoice.id,invoiceNo:invoice.invoiceNo,total:invoice.total},{status:201});
  } catch(error) {
    if (typeof error==="object" && error && "code" in error && error.code==="P2002") return NextResponse.json({error:"Invoice number already exists"},{status:409});
    if (typeof error==="object" && error && "code" in error && error.code==="P2021") return NextResponse.json({error:"Database migration required"},{status:503});
    console.error("[custom invoice create]",error);
    return NextResponse.json({error:"Unable to save invoice. Check fields and database availability."},{status:400});
  }
}
export async function GET(request:NextRequest) {
  const refused=authorize(request,"documents.view");if(refused)return refused;
  try {
    const invoices=await prisma.customPaymentInvoice.findMany({take:100,orderBy:{createdAt:"desc"},select:{id:true,invoiceNo:true,status:true,recipientName:true,currency:true,total:true,createdAt:true}});
    return NextResponse.json({invoices});
  }catch(error) {
    console.error("[custom invoice list]",error);
    return NextResponse.json({error:"Unable to load invoices"},{status:503});
  }
}
