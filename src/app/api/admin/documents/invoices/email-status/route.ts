import {NextRequest,NextResponse} from "next/server";
import {getAdminSessionFromRequest} from "@/lib/admin-auth/get-admin-session";
import {can} from "@/features/auth/admin-permissions";
import {validInvoiceRecipient} from "@/features/documents/invoice-email";

export async function GET(request:NextRequest){
 const session=getAdminSessionFromRequest(request);
 if(!session.authenticated)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!can(session,"orders.view_financials"))return NextResponse.json({error:"Forbidden"},{status:403});
 const configured=Boolean(process.env.RESEND_API_KEY)&&validInvoiceRecipient(process.env.VNC_INVOICE_FROM_EMAIL);
 return NextResponse.json({configured,provider:configured?"email":"unconfigured",message:configured?null:"Chưa cấu hình người gửi Invoice. Hệ thống chỉ có thể phát hành và tải PDF."},{headers:{"Cache-Control":"private, no-store"}});
}
