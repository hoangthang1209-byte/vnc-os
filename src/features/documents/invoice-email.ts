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
