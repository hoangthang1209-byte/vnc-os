/** Local official Inter variable TTF (SIL OFL 1.1). Shared by Preview and PDF. */
import { INTER_FONT_BASE64 } from "./inter-font-data";
let cached:Buffer|undefined;
export async function loadInvoiceInterFont():Promise<Buffer>{
 if(!cached)cached=Buffer.from(INTER_FONT_BASE64,"base64");
 return cached;
}
