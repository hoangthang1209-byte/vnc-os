"use client";
import { useCallback, useEffect, useState } from "react";
import StudioProductEditor from "./StudioProductEditor";

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
  const [revisionHistory,setRevisionHistory]=useState<Revision[]>([]);
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
      setEditing({id:page.id,version:revision.version});setSelectedRevision({pageId:page.id,revision,publishedRevisionId:payload.page.publishedRevisionId});setRevisionHistory(payload.page.revisions||[]);setSlug(page.slug);setTitle(typeof (revision.content as {title?:unknown}).title==="string"?(revision.content as {title:string}).title:page.title);
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
      if(next)setSelectedRevision({pageId,revision:next,publishedRevisionId:detail.page.publishedRevisionId});setRevisionHistory(detail.page.revisions||[]);
      setNotice(action==="review"?"Revision sent for independent review.":action==="approve"?"Revision approved. Publishing is a separate action.":"Approved revision published.");
      await refresh(site);
    }catch(e){setError(e instanceof Error?e.message:"Workflow action failed");}finally{setLoading(false);}
  };
  const seed=()=>{setRevisionHistory([]);setSelectedRevision(null);setEditing(null);const sample=examples[site];setSlug(sample.slug);setTitle(sample.title);setBlocks(sample.blocks);setNotice("Example loaded in editor only. Save as draft to write to Content Studio.");};
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
  const publishedCount=pages.filter(p=>Boolean(p.publishedRevisionId)).length;
  const draftCount=pages.length-publishedCount;
  return <main style={{maxWidth:1440,margin:"0 auto",padding:"clamp(16px,2.5vw,32px)",fontFamily:"var(--font-geist-sans),Inter,system-ui,sans-serif",color:"#182c38",minWidth:0}}>
    <nav aria-label="Breadcrumb" style={{fontSize:12,color:"#71808a",marginBottom:13}}>VNC OS <span aria-hidden="true"> / </span> Marketing & CMS <span aria-hidden="true"> / </span> Content Studio</nav>
    <header style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexWrap:"wrap",marginBottom:22}}>
      <div><p style={{fontSize:11,letterSpacing:".12em",fontWeight:750,color:"#74838c",margin:"0 0 8px"}}>ADMIN V9 · CONTENT OPERATIONS</p>
      <h1 style={{fontSize:"clamp(25px,3vw,35px)",fontWeight:760,letterSpacing:"-.035em",lineHeight:1.18,margin:"0 0 7px"}}>Content Studio</h1>
      <p style={{margin:0,color:"#647480",fontSize:13,maxWidth:750,lineHeight:1.6}}>Quản lý nội dung đa website từ một không gian làm việc. Mọi thay đổi đều qua Draft → Review → Approval trước khi Publish.</p></div>
      <div style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:"1px solid #e1e7eb",borderRadius:11,padding:"9px 13px",fontSize:12,fontWeight:650,color:"#476576"}}><span aria-hidden="true" style={{height:8,width:8,background:"#c79536",borderRadius:99}}/> Staging · Approval required</div>
    </header>
    <section aria-label="CMS overview" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginBottom:18}}>
      {([{label:"Pages in selected site",value:pages.length,helper:"Site-scoped records"},{label:"Not yet published",value:draftCount,helper:"Requires review"},{label:"Published pages",value:publishedCount,helper:"Published revision present"},{label:"Active workspace",value:site==="attd.vn"?"ATTD":"VNC",helper:"Isolated per website"}] as const).map(k=><div key={k.label} style={{background:"#fff",border:"1px solid #e0e7eb",borderRadius:13,padding:"16px 18px",minWidth:0}}><div style={{fontSize:12,color:"#647480",marginBottom:10}}>{k.label}</div><div style={{fontSize:25,fontWeight:770,letterSpacing:"-.04em"}}>{k.value}</div><div style={{fontSize:11,color:"#8a98a0",marginTop:5}}>{k.helper}</div></div>)}
    </section>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,margin:"18px 0 16px",padding:"13px 16px",background:"#eef3f5",border:"1px solid #dfe8ed",borderRadius:12}}>
      <div><strong style={{fontSize:13}}>Publishing governance</strong><div style={{fontSize:12,color:"#62747f",marginTop:4}}>Bản nháp không được hiển thị công khai; quyền duyệt độc lập và quyền hình ảnh phải được xác minh.</div></div>
      <span style={{fontSize:11,fontWeight:750,color:"#496471",background:"#fff",padding:"6px 10px",borderRadius:8}}>DRAFT → REVIEW → APPROVE → PUBLISH</span>
    </div>
    <label style={{display:"block",fontSize:13,fontWeight:700,margin:"14px 0 14px"}}>Website workspace
      <select value={site} onChange={e=>{setSite(e.target.value as SiteId);setTitle("");setSlug("/");setBlocks([{type:"hero",data:{headline:"",subtitle:""}}]);setEditing(null);setNotice("");setError("");}} style={field}>
        {sites.map(s=><option key={s.id} value={s.id}>{s.name} · {s.locale}</option>)}
      </select>
    </label>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,350px),1fr))",gap:14}}>
      <section style={panel}><h2 style={{margin:"0 0 8px",fontSize:17}}>Pages & revisions</h2>{loading?<p>Loading…</p>:pages.length?pages.map(p=><div key={p.id} style={{padding:"12px 0",borderBottom:"1px solid #dce3dc"}}><strong>{p.title}</strong><div style={{fontSize:13}}>{p.slug} · {p.publishedRevisionId?"Published revision exists":"DRAFT / NOT PUBLISHED"}</div><button type="button" disabled={loading} onClick={()=>void edit(p)} style={{...button,marginTop:8}}>Edit draft</button></div>):<p>No pages yet for {site}. Start with a demo draft.</p>}<p style={{fontSize:12,color:"#65766e"}}>This list is filtered by the selected site ID on the server.</p></section>
      <section style={panel}><h2 style={{margin:"0 0 8px",fontSize:17}}>{editing?"Edit page draft":"New page draft"}</h2>{editing?<button type="button" onClick={()=>{setSelectedRevision(null);setEditing(null);setSlug("/");setTitle("");setBlocks([{type:"hero",data:{headline:"",subtitle:""}}]);setNotice("");}} style={button}>Create another page</button>:null}<button type="button" onClick={seed} style={button}>Load demo content for this site</button>
        <label style={label}>Page path<input value={slug} disabled={Boolean(editing)} onChange={e=>setSlug(e.target.value)} style={field} placeholder="/category-page"/></label>
        <label style={label}>Page title<input value={title} onChange={e=>setTitle(e.target.value)} style={field}/></label>
        {blocks.map((block,index)=><div key={index} style={{border:"1px solid #ced8ce",borderRadius:9,padding:14,marginTop:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><strong>{block.type}</strong><button type="button" onClick={()=>setBlocks(old=>old.filter((_,i)=>i!==index))}>Remove</button></div>
          {Object.entries(block.data).map(([key,value])=><label key={key} style={label}>{key}<textarea rows={key==="text"?4:2} value={value} onChange={e=>changeBlock(index,key,e.target.value)} style={field}/></label>)}
        </div>)}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:15}}>{(["hero","richText","cta"] as const).map(v=><button key={v} type="button" onClick={()=>addBlock(v)} style={button}>+ {v}</button>)}</div>
        <button type="button" onClick={()=>void save()} disabled={loading||!title.trim()} style={{...button,marginTop:22,background:"#123e32",color:"#fff"}}>{editing?"Save new DRAFT revision":"Save DRAFT"} — {site}</button>
        {selectedRevision?<section style={{marginTop:20,padding:14,border:"1px solid #ccd8ce",borderRadius:9}}><h3>Revision #{selectedRevision.revision.version}</h3><p>Status: <strong>{selectedRevision.revision.status}</strong> · Author: {selectedRevision.revision.authorId||"unattributed"} · Approved by: {selectedRevision.revision.approvedById||"—"}</p><p>Published: {selectedRevision.publishedRevisionId===selectedRevision.revision.id?"Yes":"No"}</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button type="button" disabled={loading||selectedRevision.revision.status!=="DRAFT"} onClick={()=>void workflow("review")} style={button}>Submit for review</button><button type="button" disabled={loading||selectedRevision.revision.status!=="IN_REVIEW"} onClick={()=>void workflow("approve")} style={button}>Approve (authorized reviewer)</button><button type="button" disabled={loading||selectedRevision.revision.status!=="APPROVED"} onClick={()=>void workflow("publish")} style={button}>Publish approved revision</button></div><p style={{fontSize:12}}>Your account must have cms.approve to approve. An author cannot approve their own revision.</p><h4>Revision history (newest first)</h4><ol style={{paddingLeft:20}}>{revisionHistory.map(r=><li key={r.id} style={{fontSize:12,marginBottom:6}}>v{r.version} · {r.status} · Author: {r.authorId||"unattributed"} · Approved by: {r.approvedById||"—"} · {r.publishedAt?"Published "+new Date(r.publishedAt).toLocaleString():"Not published"}</li>)}</ol></section>:null}
        {notice?<p role="status" style={{color:"#12613c"}}>{notice}</p>:null}{error?<p role="alert" style={{color:"#a03527"}}>{error}</p>:null}
        <p style={{fontSize:12,color:"#64776b"}}>Drafts require database schema deployment. A 503 response means the Content Studio migration is not yet installed. No direct publishing is exposed.</p>
      </section>
    </div>
    {site==="vietnamclothing.vn"?<StudioProductEditor />:null}
  </main>;
}
const panel:React.CSSProperties={padding:"clamp(16px,2vw,24px)",border:"1px solid #e0e7eb",borderRadius:14,background:"#fff",boxShadow:"0 2px 12px rgba(15,39,60,.025)",minWidth:0};
const field:React.CSSProperties={width:"100%",display:"block",padding:11,marginTop:6,border:"1px solid #cdd8dd",borderRadius:9,font:"inherit",fontSize:13,background:"#fff",color:"#233a46"};
const label:React.CSSProperties={display:"block",fontWeight:650,marginTop:13,fontSize:14};
const button:React.CSSProperties={padding:"10px 13px",border:"1px solid #d5e0e5",borderRadius:9,cursor:"pointer",fontSize:12,fontWeight:700,background:"#f4f7f8",color:"#294557"};
