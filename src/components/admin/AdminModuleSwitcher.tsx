"use client";
import Link from "next/link";
import {useMemo,useState} from "react";
import {useAdminPermissions} from "@/components/admin/AdminPermissionsContext";
import {adminNavigationSections} from "@/lib/admin/admin-navigation";
export default function AdminModuleSwitcher(){
 const {permissions,loading}=useAdminPermissions();
 const [open,setOpen]=useState(false);
 const [query,setQuery]=useState("");
 const items=useMemo(()=>adminNavigationSections.flatMap(section=>section.platforms.flatMap(platform=>platform.items.map(item=>({...item,group:section.label})))).filter(item=>item.status==="active"&&item.href&&(item.requiredPermissions??[]).every(permission=>permissions[permission])),[permissions]);
 const visible=items.filter(item=>(item.label+" "+item.group).toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")));
 if(loading||!items.length)return null;
 return <div style={{position:"relative"}}>
  <button type="button" onClick={()=>setOpen(value=>!value)} aria-expanded={open} aria-label="Chọn module quản trị" style={{border:"1px solid #dce2ea",background:"#fff",borderRadius:7,padding:"7px 11px",fontSize:12,color:"#263449",cursor:"pointer"}}>☷ Module ▾</button>
  {open&&<div style={{position:"absolute",right:0,top:"calc(100% + 7px)",width:"min(360px,85vw)",maxHeight:"min(70vh,540px)",overflow:"auto",zIndex:80,background:"#fff",border:"1px solid #dce2ea",boxShadow:"0 12px 32px #17253b22",borderRadius:10,padding:10}}>
   <input autoFocus type="search" placeholder="Tìm module..." aria-label="Tìm module" value={query} onChange={e=>setQuery(e.target.value)} style={{width:"100%",boxSizing:"border-box",border:"1px solid #dae0e8",borderRadius:6,padding:9,fontSize:12,marginBottom:8}}/>
   {visible.map(item=><Link key={item.href} href={item.href!} onClick={()=>{setOpen(false);setQuery("");}} style={{display:"block",padding:"9px 10px",borderRadius:6,color:"#25364c",textDecoration:"none",fontSize:12,borderBottom:"1px solid #f0f2f5"}}><strong>{item.label}</strong><span style={{display:"block",fontSize:10,color:"#8290a2",marginTop:3}}>{item.group}</span></Link>)}
   {!visible.length&&<p style={{fontSize:12,color:"#7d8795",padding:12}}>Không tìm thấy module phù hợp.</p>}
  </div>}
 </div>;
}
