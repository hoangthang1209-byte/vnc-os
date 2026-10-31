import { NextResponse } from "next/server";
import { loadInvoiceInterFont } from "@/features/documents/inter-font";
export const runtime="nodejs";
export async function GET(){
 const font=await loadInvoiceInterFont();
 if(!font)return NextResponse.json({error:"Invoice font temporarily unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
 return new NextResponse(new Uint8Array(font),{
  headers:{
   "Content-Type":"font/ttf",
   "Cache-Control":"public, max-age=86400, stale-while-revalidate=604800",
   "Access-Control-Allow-Origin":"*",
  }
 });
}
