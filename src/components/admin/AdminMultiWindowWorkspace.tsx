"use client";
import {useMemo,useState} from "react";
import {useAdminPermissions} from "@/components/admin/AdminPermissionsContext";
import {adminNavigationSections} from "@/lib/admin/admin-navigation";
export default function AdminMultiWindowWorkspace(){
 const [open,setOpen]=useState(false);
 const [panes,setPanes]=useState(["/admin/orders","/admin/crm/leads"]);
 const {permissions,loading}=useAdminPermissions();
 const items=useMemo(()=>adminNavigationSections.flatMap(s=>s.platforms.flatMap(p=>p.items)).filter(i=>i.href&&i.status==="active"&&(i.requiredPermissions||[]).every(k=>permissions[k])),[permissions]);
 const allowed=items.filter(i=>Boolean(i.href));
 if(loading||!allowed.length)return null;
 const urls=new Set(allowed.map(i=>i.href));
 const active=panes.filter(p=>urls.has(p));
 return <>
 <button type="button" onClick={()=>setOpen(true)}>▦ Đa cửa sổ</button>
 {open&&<div role="dialog" aria-modal="true" aria-label="VNC OS multi window" style={{position:"fixed",inset:0,zIndex:9999,background:"#f1f5f9",display:"flex",flexDirection:"column"}}>
 <div style={{padding:12,display:"flex",gap:12,background:"white",color:"#0f172a"}}>
 <strong style={{marginRight:"auto"}}>VNC OS · Multi-Window</strong>
 <button type="button" disabled={active.length>=3} onClick={()=>setPanes(p=>[...p,allowed.find(x=>!p.includes(x.href!))?.href||allowed[0].href!])}>+ Cửa sổ</button>
 <button type="button" onClick={()=>setOpen(false)}>Đóng ✕</button>
 </div>
 <div style={{flex:1,minHeight:0,display:"grid",gridTemplateColumns:"repeat("+Math.max(1,active.length)+",minmax(0,1fr))",gap:8,padding:8}}>
 {active.map((href,index)=><div key={index} style={{display:"flex",flexDirection:"column",minWidth:0,background:"white"}}>
 <div style={{padding:8,display:"flex",gap:8}}>
 <select aria-label={"Module "+(index+1)} value={href} onChange={e=>setPanes(p=>p.map((v,i)=>i===index?e.target.value:v))}>{allowed.map(i=><option key={i.href} value={i.href}>{i.label}</option>)}</select>
 <button type="button" disabled={active.length<=1} onClick={()=>setPanes(p=>p.filter((_,i)=>i!==index))}>✕</button>
 </div>
 <iframe title={allowed.find(i=>i.href===href)?.label||"Module"} src={href} style={{flex:1,border:0,minHeight:0}}/>
 </div>)}
 </div>
 </div>}
 </>;
}
