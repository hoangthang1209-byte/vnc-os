import {NextRequest,NextResponse} from "next/server";
import {getAdminSessionFromRequest} from "@/lib/admin-auth/get-admin-session";
import {can} from "@/features/auth/admin-permissions";

export async function GET(request:NextRequest){
 const session=getAdminSessionFromRequest(request);
 if(!session.authenticated)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!can(session,"orders.view_financials"))return NextResponse.json({error:"Forbidden"},{status:403});
 const configured=Boolean(process.env.RESEND_API_KEY)&&process.env.VNC_INVOICE_FROM_EMAIL?.trim().toLowerCase()==="support@vietnamclothing.vn";
 return NextResponse.json({configured,from:"support@vietnamclothing.vn",provider:configured?"email":"unconfigured",message:configured?null:"Chưa cấu hình người gửi Invoice. Hệ thống chỉ có thể phát hành và tải PDF."},{headers:{"Cache-Control":"private, no-store"}});
}
