"use client";
import { useCallback, useEffect, useState } from "react";

type SiteId = "attd.vn" | "vietnamclothing.vn";
type Page = { id:string; slug:string; title:string; publishedRevisionId:string|null; updatedAt:string };
type Revision = { id:string; version:number; content:{blocks?:Block[]};status:string;authorId?:string|null;approvedById?:string|null;approvedAt?:string|null;publishedAt?:string|null };
type Block = { type:"hero"|"richText"|"cta"; data:Record<string,string> };
const sites: {id:SiteId;name:string;locale:string}[]=[
  {id:"attd.vn",name:"ATTD · Blank Apparel & Uniforms",locale:"vi / en"},
  {id:"vietnamclothing.vn",name:"VietnamClothing · Merchandise & OEM",locale:"en / vi"},
];
const examples:Record<SiteId,{slug:string;title:string;blocks:Block[]}>={
  "attd.vn":{slug:"/ao-thun-tron",title:"Áo thun trơn sỉ | ATTD",blocks:[
    {type:"hero",data:{headline:"Nguồn áo thun trơn B2B",subtitle:"Chọn form, chất liệu, màu sắc và số lượng cho đơn hàng của bạn."}},
    {type:"richText",data:{text:"Nội dung DEMO. Thông số, MOQ và năng lực cung ứng phải được xác nhận trước khi xuất bản."}},
    {type:"cta",data:{label:"Yêu cầu báo giá",href:"/lien-he"}},
  ]},
  "vietnamclothing.vn":{slug:"/merchandise",title:"Branded Merchandise | VietnamClothing",blocks:[
    {type:"hero",data:{headline:"Merchandise for remarkable brands",subtitle:"Concept-to-product development for entertainment, campaigns and branded experiences."}},
    {type:"richText",data:{text:"DEMO draft content; no client endorsements or verified production claims."}},
    {type:"cta",data:{label:"Discuss your project",href:"/contact.html"}},
  ]},
};

export default function MultisiteStudio(){
  const [site,setSite]=useState<SiteId>("attd.vn");
  const [pages,setPages]=useState<Page[]>([]);
  const [slug,setSlug]=useState("/");
  const [title,setTitle]=useState("");
  const [blocks,setBlocks]=useState<Block[]>([{type:"hero",data:{headline:"",subtitle:""}}]);
  const [loading,setLoading]=useState(false);
  const [editing,setEditing]=useState<{id:string;version:number}|null>(null);
  const [selectedRevision,setSelectedRevision]=useState<{pageId:string;revision:Revision;publishedRevisionId:string|null}|null>(null);
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");
  const refresh=useCallback(async (selected:SiteId)=>{
    setLoading(true);setError("");
    try{
      const res=await fetch("/api/admin/content-studio/pages?siteId="+encodeURIComponent(selected),{cache:"no-store"});
      const body=await res.json();
      if(!res.ok)throw Error(body.message||"Unable to load pages");
      setPages(body.pages||[]);
    }catch(e){setPages([]);setError(e instanceof Error?e.message:"Unable to load pages");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{const task=Promise.resolve().then(()=>refresh(site));void task;},[site,refresh]);
  const edit=async(page:Page)=>{
    setLoading(true);setError("");setNotice("");
    try {
      const response=await fetch("/api/admin/content-studio/pages/"+encodeURIComponent(page.id)+"?siteId="+encodeURIComponent(site),{cache:"no-store"});
      const payload=await response.json();
      if(!response.ok)throw Error(payload.message||"Unable to load revision");
      const revision:Revision|undefined=payload.page?.revisions?.[0];
      if(!revision || !Array.isArray(revision.content?.blocks))throw Error("No editable revision found");
      setEditing({id:page.id,version:revision.version});setSelectedRevision({pageId:page.id,revision,publishedRevisionId:payload.page.publishedRevisionId});setSlug(page.slug);setTitle(typeof (revision.content as {title?:unknown}).title==="string"?(revision.content as {title:string}).title:page.title);
      setBlocks(revision.content.blocks.filter((b:Block)=>["hero","richText","cta"].includes(b.type)).map((b:Block)=>({type:b.type,data:b.data})));
      if(revision.content.blocks.some((b:Block)=>!["hero","richText","cta"].includes(b.type))) {
        setEditing(null);throw Error("This page contains advanced blocks. Editing is disabled to prevent data loss.");
      }
      setNotice("Loaded revision "+revision.version+". Saving creates a new DRAFT revision; it does not publish.");
    }catch(e){setError(e instanceof Error?e.message:"Unable to edit page");}
    finally{setLoading(false);}
  };
  const workflow=async(action:"review"|"approve"|"publish")=>{
    if(!selectedRevision)return;
    setLoading(true);setError("");setNotice("");
    try{
      const {pageId,revision}=selectedRevision;
      const res=await fetch("/api/admin/content-studio/pages/"+encodeURIComponent(pageId)+"/"+action,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({siteId:site,revisionId:revision.id})});
      const body=await res.json();if(!res.ok)throw Error(body.message||"Workflow action failed");
      const updated=await fetch("/api/admin/content-studio/pages/"+encodeURIComponent(pageId)+"?siteId="+encodeURIComponent(site),{cache:"no-store"});
      const detail=await updated.json();if(!updated.ok)throw Error(detail.message||"Refresh failed");
      const next:Revision|undefined=detail.page?.revisions?.find((r:Revision)=>r.id===revision.id);
      if(next)setSelectedRevision({pageId,revision:next,publishedRevisionId:detail.page.publishedRevisionId});
      setNotice(action==="review"?"Revision sent for independent review.":action==="approve"?"Revision approved. Publishing is a separate action.":"Approved revision published.");
      await refresh(site);
    }catch(e){setError(e instanceof Error?e.message:"Workflow action failed");}finally{setLoading(false);}
  };
  const seed=()=>{setSelectedRevision(null);setEditing(null);const sample=examples[site];setSlug(sample.slug);setTitle(sample.title);setBlocks(sample.blocks);setNotice("Example loaded in editor only. Save as draft to write to Content Studio.");};
  const changeBlock=(index:number,key:string,value:string)=>setBlocks(old=>old.map((block,i)=>i===index?{...block,data:{...block.data,[key]:value}}:block));
  const addBlock=(type:Block["type"])=>setBlocks(old=>[...old,{type,data:type==="hero"?{headline:"",subtitle:""}:type==="cta"?{label:"",href:"/"}:{text:""}}]);
  const save=async()=>{setNotice("");setError("");setLoading(true);try{
    const isEdit=Boolean(editing);
    const res=await fetch(editing?"/api/admin/content-studio/pages/"+encodeURIComponent(editing.id):"/api/admin/content-studio/pages",{method:editing?"PUT":"POST",headers:{"content-type":"application/json"},body:JSON.stringify({siteId:site,slug,title,blocks,...(editing?{expectedVersion:editing.version}:{})})});
    const body=await res.json();if(!res.ok)throw Error(body.message||"Draft creation failed");
    if(editing){setEditing({id:editing.id,version:body.revision.version});setSelectedRevision(null);}
    setNotice(isEdit?"New DRAFT revision saved for "+site+". It is not published.":"Draft created for "+site+". It is not published.");
    await refresh(site);
  }catch(e){setError(e instanceof Error?e.message:"Unable to save draft");}finally{setLoading(false);}};
  return <main style={{maxWidth:1150,margin:"0 auto",padding:"38px 22px",fontFamily:"system-ui,sans-serif",color:"#1c302b"}}>
    <p style={{fontSize:12,letterSpacing:".12em",fontWeight:800}}>VNC OS / MULTISITE CONTENT STUDIO</p>
    <h1 style={{fontSize:"clamp(28px,4vw,48px)",margin:"10px 0"}}>One CMS. Two independent brands.</h1>
    <p>Manage drafts, request independent review, approve with separate CMS permission, and publish approved revisions. Content remains site-scoped; public integration and migration require separate release checks.</p>
    <label style={{display:"block",fontWeight:700,margin:"24px 0 12px"}}>Website
      <select value={site} onChange={e=>{setSite(e.target.value as SiteId);setTitle("");setSlug("/");setBlocks([{type:"hero",data:{headline:"",subtitle:""}}]);setEditing(null);setNotice("");setError("");}} style={field}>
        {sites.map(s=><option key={s.id} value={s.id}>{s.name} · {s.locale}</option>)}
      </select>
    </label>
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1.5fr)",gap:22}}>
      <section style={panel}><h2>Draft inventory</h2>{loading?<p>Loading…</p>:pages.length?pages.map(p=><div key={p.id} style={{padding:"12px 0",borderBottom:"1px solid #dce3dc"}}><strong>{p.title}</strong><div style={{fontSize:13}}>{p.slug} · {p.publishedRevisionId?"Published revision exists":"DRAFT / NOT PUBLISHED"}</div><button type="button" disabled={loading} onClick={()=>void edit(p)} style={{...button,marginTop:8}}>Edit draft</button></div>):<p>No pages yet for {site}. Start with a demo draft.</p>}<p style={{fontSize:12,color:"#65766e"}}>This list is filtered by the selected site ID on the server.</p></section>
      <section style={panel}><h2>{editing?"Edit page draft":"New page draft"}</h2>{editing?<button type="button" onClick={()=>{setSelectedRevision(null);setEditing(null);setSlug("/");setTitle("");setBlocks([{type:"hero",data:{headline:"",subtitle:""}}]);setNotice("");}} style={button}>Create another page</button>:null}<button type="button" onClick={seed} style={button}>Load demo content for this site</button>
        <label style={label}>Page path<input value={slug} disabled={Boolean(editing)} onChange={e=>setSlug(e.target.value)} style={field} placeholder="/category-page"/></label>
        <label style={label}>Page title<input value={title} onChange={e=>setTitle(e.target.value)} style={field}/></label>
        {blocks.map((block,index)=><div key={index} style={{border:"1px solid #ced8ce",borderRadius:9,padding:14,marginTop:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><strong>{block.type}</strong><button type="button" onClick={()=>setBlocks(old=>old.filter((_,i)=>i!==index))}>Remove</button></div>
          {Object.entries(block.data).map(([key,value])=><label key={key} style={label}>{key}<textarea rows={key==="text"?4:2} value={value} onChange={e=>changeBlock(index,key,e.target.value)} style={field}/></label>)}
        </div>)}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:15}}>{(["hero","richText","cta"] as const).map(v=><button key={v} type="button" onClick={()=>addBlock(v)} style={button}>+ {v}</button>)}</div>
        <button type="button" onClick={()=>void save()} disabled={loading||!title.trim()} style={{...button,marginTop:22,background:"#123e32",color:"#fff"}}>{editing?"Save new DRAFT revision":"Save DRAFT"} — {site}</button>
        {selectedRevision?<section style={{marginTop:20,padding:14,border:"1px solid #ccd8ce",borderRadius:9}}><h3>Revision #{selectedRevision.revision.version}</h3><p>Status: <strong>{selectedRevision.revision.status}</strong> · Author: {selectedRevision.revision.authorId||"unattributed"} · Approved by: {selectedRevision.revision.approvedById||"—"}</p><p>Published: {selectedRevision.publishedRevisionId===selectedRevision.revision.id?"Yes":"No"}</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button type="button" disabled={loading||selectedRevision.revision.status!=="DRAFT"} onClick={()=>void workflow("review")} style={button}>Submit for review</button><button type="button" disabled={loading||selectedRevision.revision.status!=="IN_REVIEW"} onClick={()=>void workflow("approve")} style={button}>Approve (authorized reviewer)</button><button type="button" disabled={loading||selectedRevision.revision.status!=="APPROVED"} onClick={()=>void workflow("publish")} style={button}>Publish approved revision</button></div><p style={{fontSize:12}}>Your account must have cms.approve to approve. An author cannot approve their own revision.</p></section>:null}
        {notice?<p role="status" style={{color:"#12613c"}}>{notice}</p>:null}{error?<p role="alert" style={{color:"#a03527"}}>{error}</p>:null}
        <p style={{fontSize:12,color:"#64776b"}}>Drafts require database schema deployment. A 503 response means the Content Studio migration is not yet installed. No direct publishing is exposed.</p>
      </section>
    </div>
  </main>;
}
const panel:React.CSSProperties={padding:22,border:"1px solid #d2dcd4",borderRadius:12,background:"#f9faf7"};
const field:React.CSSProperties={width:"100%",display:"block",padding:12,marginTop:6,border:"1px solid #bac6bc",borderRadius:8,font:"inherit",background:"#fff"};
const label:React.CSSProperties={display:"block",fontWeight:650,marginTop:13,fontSize:14};
const button:React.CSSProperties={padding:"10px 14px",border:"1px solid #b7c5ba",borderRadius:8,cursor:"pointer",fontWeight:700,background:"#e7eee5",color:"#163a2c"};
