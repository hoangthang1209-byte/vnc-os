/**
 * Single typography source for VNC Invoice PDF and browser preview.
 * Inter is released under SIL Open Font License 1.1 by Rasmus Andersson.
 * Official Google Fonts repository: https://github.com/google/fonts/tree/main/ofl/inter
 * Only font data is requested; no invoice or customer information is sent.
 */
const FONT_URL="https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf";
let cached:Promise<Buffer|null>|undefined;

async function retrieveInter():Promise<Buffer|null>{
 try{
  const response=await fetch(FONT_URL,{signal:AbortSignal.timeout(6000),next:{revalidate:86400}});
  if(!response.ok)return null;
  const size=Number(response.headers.get("content-length")||"0");
  if(size>5_000_000)return null;
  const buffer=Buffer.from(await response.arrayBuffer());
  if(buffer.length<20_000||buffer.length>5_000_000)return null;
  const signature=buffer.subarray(0,4).toString("hex");
  if(signature!=="00010000" && buffer.subarray(0,4).toString("ascii")!=="OTTO")return null;
  return buffer;
 }catch{return null;}
}
export function loadInvoiceInterFont():Promise<Buffer|null>{
 // Cache successful font retrieval only; retry after transient network failure.
 if(!cached)cached=retrieveInter().then(result=>{if(!result)cached=undefined;return result;});
 return cached;
}
