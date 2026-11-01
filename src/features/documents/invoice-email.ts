export function validInvoiceRecipient(email:unknown):email is string{
 if(typeof email!=="string"||email.length>254||/[\r\n]/.test(email))return false;
 return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function escapeEmailHtml(value:string):string{
 return value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
export function invoiceEmailContent(input:{invoiceNo:string;customerName:string;issuerName:string;currency:string;total:string}){
 const safe=(value:string,max=180)=>value.replace(/[\r\n\x00-\x1f]/g," ").trim().slice(0,max);
 const no=safe(input.invoiceNo,80),customer=safe(input.customerName),issuer=safe(input.issuerName),cur=safe(input.currency,5),sum=safe(input.total,50);
 const subject="Commercial Invoice "+no+" — Vietnam Clothing";
 const text="Dear "+customer+",\n\nPlease find attached Commercial Invoice "+no+" from "+issuer+".\n\nAmount due: "+cur+" "+sum+".\n\nPayment details and bank transfer instructions are included in the attached PDF. Please reply if you need assistance.\n\nBest regards,\nVietnam Clothing\nsupport@vietnamclothing.vn\n\nThis commercial payment request is not a Vietnamese VAT e-invoice.";
 const esc=escapeEmailHtml;
 const html=[
 '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>',
 '<body style="margin:0;padding:0;background:#f4f6f9;color:#273647;font-family:Arial,Helvetica,sans-serif">',
 '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9"><tr><td align="center" style="padding:32px 12px">',
 '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #e5eaf0;border-radius:10px">',
 '<tr><td style="padding:27px 32px;border-bottom:1px solid #e5eaf0">',
 '<div style="font-size:20px;font-weight:700;color:#17263c">Vietnam Clothing</div>',
 '<div style="font-size:10px;letter-spacing:1.25px;color:#77869a;margin-top:5px">MANUFACTURING · SOURCING · MERCHANDISE</div>',
 '</td></tr><tr><td style="padding:29px 32px 26px">',
 '<div style="font-size:11px;font-weight:700;letter-spacing:1.4px;color:#718198">COMMERCIAL INVOICE</div>',
 '<h1 style="font-size:25px;line-height:1.25;color:#1c2d43;margin:10px 0 21px">',esc(no),'</h1>',
 '<p style="font-size:14px;line-height:1.7;margin:0 0 15px">Dear ',esc(customer),',</p>',
 '<p style="font-size:14px;line-height:1.7;margin:0 0 22px">Please find attached Commercial Invoice ',esc(no),' issued by ',esc(issuer),'. Payment instructions and bank details are included in the attached PDF.</p>',
 '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;border:1px solid #e8edf3;border-radius:7px"><tr><td style="padding:17px 19px">',
 '<div style="font-size:10px;color:#677b92;letter-spacing:1px;font-weight:700">TOTAL AMOUNT DUE</div>',
 '<div style="font-size:22px;font-weight:700;color:#1b304c;margin-top:8px">',esc(cur),' ',esc(sum),'</div>',
 '</td></tr></table>',
 '<p style="margin:19px 0 24px;font-size:13px;line-height:1.65;color:#65778b">The Commercial Invoice PDF is attached. Please reply to this email if you need any assistance.</p>',
 '<p style="margin:0;font-size:13px;line-height:1.75">Best regards,<br><strong>Vietnam Clothing</strong><br>',
 '<a href="mailto:support@vietnamclothing.vn" style="color:#315b87;text-decoration:none">support@vietnamclothing.vn</a></p>',
 '</td></tr><tr><td style="padding:17px 32px;border-top:1px solid #e8edf3;color:#7c8b9f;font-size:11px;line-height:1.6">',
 'This commercial payment request is not a Vietnamese VAT e-invoice.<br>Vietnam Clothing · Ho Chi Minh City, Vietnam',
 '</td></tr></table></td></tr></table></body></html>'
 ].join("");
 return {subject,text,html};
}

/** One invoice message may address multiple recipients, separated by comma, semicolon or newline. */
export function parseInvoiceRecipients(value:unknown,max=10):string[]{
 if(value==null||value==="")return [];
 if(typeof value!=="string"||value.length>1800)throw new Error("Danh sách email quá dài.");
 const emails=value.split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);
 if(emails.length>max)throw new Error("Tối đa "+max+" địa chỉ email trong mỗi nhóm.");
 for(const address of emails){
  if(!validInvoiceRecipient(address))throw new Error("Email không hợp lệ: "+String(address).slice(0,100));
 }
 return Array.from(new Map(emails.map(email=>[email.toLowerCase(),email.toLowerCase()])).values());
}
export function invoiceRecipients(toValue:unknown,ccValue:unknown){
 const to=parseInvoiceRecipients(toValue,10);
 const cc=parseInvoiceRecipients(ccValue,10);
 if(!to.length)throw new Error("Cần ít nhất một địa chỉ email To.");
 const toSet=new Set(to);
 const uniqueCc=cc.filter(email=>!toSet.has(email));
 if(to.length+uniqueCc.length>20)throw new Error("Tối đa 20 email trong một Invoice.");
 return {to,cc:uniqueCc};
}
