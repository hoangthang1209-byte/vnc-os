import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";

function access(request: NextRequest, write = false) {
  const session = getAdminSessionFromRequest(request);
  if (!session.authenticated) return NextResponse.json({error:"Unauthorized"},{status:401});
  if (!can(session,"orders.view_financials") || (write && !can(session,"payments.manage"))) {
    return NextResponse.json({error:"Forbidden"},{status:403});
  }
  return null;
}
function mediaUrl(value: unknown): string | null {
  if(value===null || value==="") return null;
  if(typeof value!=="string" || value.length>2000) throw new Error("Invalid image URL");
  const url=value.trim();
  if(url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) return url;
  const parsed=new URL(url);
  if(parsed.protocol!=="https:" || parsed.username || parsed.password) throw new Error("HTTPS image URL required");
  if(!/\.(png|jpe?g|webp|ico|svg)(?:$|\?)/i.test(parsed.pathname+parsed.search)) {
    throw new Error("Expected image file URL");
  }
  return url;
}
const headers={"Cache-Control":"private, no-store"};
export async function GET(request:NextRequest) {
  const denied=access(request);if(denied)return denied;
  try {
    const config=await prisma.vncOsCompanyBranding.findUnique({where:{id:"default"}});
    return NextResponse.json({logoUrl:config?.logoUrl??null,faviconUrl:config?.faviconUrl??null},{headers});
  } catch {return NextResponse.json({error:"Branding migration required"},{status:503,headers});}
}
export async function PATCH(request:NextRequest) {
  const denied=access(request,true);if(denied)return denied;
  try {
    const body=await request.json() as Record<string,unknown>;
    const logoUrl=mediaUrl(body.logoUrl),faviconUrl=mediaUrl(body.faviconUrl);
    const result=await prisma.vncOsCompanyBranding.upsert({
      where:{id:"default"},
      create:{id:"default",logoUrl,faviconUrl},
      update:{logoUrl,faviconUrl}
    });
    return NextResponse.json({logoUrl:result.logoUrl,faviconUrl:result.faviconUrl},{headers});
  } catch(error){
    const message=error instanceof Error?error.message:"Unable to update VNC branding";
    return NextResponse.json({error:message},{status:/migration|database|table/i.test(message)?503:400,headers});
  }
}
