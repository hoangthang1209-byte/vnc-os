"use client";
import {useState} from "react";
import MediaPicker, {type MediaPickerValue} from "@/components/admin/MediaPicker";

type Props={initial:{logoUrl:string|null;faviconUrl:string|null}};
const selected=(url:string|null):MediaPickerValue|null=>url?{id:"existing-vnc",url,filename:url.split("/").pop()||"image"}:null;
export default function VncOsCompanyBrandingForm({initial}:Props){
 const [logo,setLogo]=useState<MediaPickerValue|null>(selected(initial.logoUrl));
 const [icon,setIcon]=useState<MediaPickerValue|null>(selected(initial.faviconUrl));
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 async function save(){
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/admin/settings/vnc-company-branding",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({logoUrl:logo?.url??null,faviconUrl:icon?.url??null}),
   });
   const json=await response.json();
   if(!response.ok)throw new Error(json.error||"Không lưu được");
   setMessage("Đã lưu nhận diện VNC OS. Tải lại trang để cập nhật favicon.");
  }catch(error){setMessage(error instanceof Error?error.message:"Lỗi cập nhật nhận diện");}
  finally{setBusy(false);}
 }
 return <section className="admin-form">
  <h2>Nhận diện công ty VNC</h2>
  <p>Logo công ty dùng chung trong chứng từ VNC. Favicon VNC OS tách biệt hoàn toàn khỏi favicon website ATTD.</p>
  <MediaPicker folder="branding" value={logo} onChange={setLogo} label="Logo công ty VNC"/>
  <MediaPicker folder="branding" value={icon} onChange={setIcon} label="Favicon VNC OS (ưu tiên hình vuông)"/>
  <p>Để trống favicon sẽ sử dụng biểu tượng VNC OS mặc định, không sử dụng favicon ATTD.</p>
  <button type="button" className="admin-btn admin-btn--primary" onClick={()=>void save()} disabled={busy}>{busy?"Đang lưu...":"Lưu logo và favicon VNC OS"}</button>
  {message&&<p role="status">{message}</p>}
 </section>;
}
