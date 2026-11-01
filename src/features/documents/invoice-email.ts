export function validInvoiceRecipient(email:unknown):email is string{
 if(typeof email!=="string"||email.length>254||/[\r\n]/.test(email))return false;
 return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
export function invoiceEmailContent(input:{invoiceNo:string;customerName:string;issuerName:string;currency:string;total:string}){
 const safe=(text:string,max=180)=>text.replace(/[\r\n\x00-\x1f]/g," ").trim().slice(0,max);
 const invoiceNo=safe(input.invoiceNo,80);
 return {
  subject:`Commercial Invoice ${invoiceNo} — ${safe(input.issuerName)}`,
  text:`Dear ${safe(input.customerName)},\n\nPlease find attached Commercial Invoice ${invoiceNo} from ${safe(input.issuerName)}.\n\nAmount due: ${safe(input.currency,5)} ${safe(input.total,50)}.\n\nPayment instructions are included in the attached PDF. Please contact us if any details need clarification.\n\nBest regards,\nVietnam Clothing\n\nThis commercial payment request is not a Vietnamese VAT e-invoice.`
 };
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
