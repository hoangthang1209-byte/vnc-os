"use client";
import { useEffect, useState } from "react";
import { VNC_CATEGORIES_V1, VNC_PARENT_CATEGORIES } from "@/features/content-studio/catalog-taxonomy-v1";
import { VNC_PRODUCT_IDEAS_V1 } from "@/features/content-studio/product-backlog-v1";

type ProductFields = {
  slug:string; category:string; categoryId:string; title:string; summary:string; description:string;
  titleVi:string; summaryVi:string; descriptionVi:string; imageMediaAssetId:string; imageUrl:string; imageAlt:string;
  publicApproved:boolean; mediaRightsApproved:boolean;
};
type Revision = {id:string;version:number;status:string;authorId:string|null;approvedById:string|null;content:{blocks?:Array<{type:string;data:Record<string,unknown>}>}};
type Page = {id:string;slug:string;title:string;publishedRevisionId:string|null};
const init:ProductFields={slug:"",category:"apparel",categoryId:"APP-01",title:"",summary:"",description:"",titleVi:"",summaryVi:"",descriptionVi:"",imageMediaAssetId:"",imageUrl:"",imageAlt:"",publicApproved:false,mediaRightsApproved:false};
const categories=["entertainment","promotional","corporate","sourcing","apparel"];
const path="/api/admin/content-studio/pages";
const style:React.CSSProperties={width:"100%",padding:10,border:"1px solid #becbc0",borderRadius:7,marginTop:5};
export default function StudioProductEditor(){
 const [value,setValue]=useState<ProductFields>(init);
 const [pages,setPages]=useState<Page[]>([]);
 const [approvedAssets,setApprovedAssets]=useState<Array<{id:string;title:string;url:string;alt:string}>>([]);
 const [pageId,setPageId]=useState<string|null>(null);
 const [revision,setRevision]=useState<Revision|null>(null);
 const [publishedId,setPublishedId]=useState<string|null>(null);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 const update=(key:keyof ProductFields,v:string|boolean)=>setValue(old=>({...old,[key]:v}));
 const refresh=async()=>{
  const res=await fetch(path+"?siteId=vietnamclothing.vn",{cache:"no-store"});
  const data=await res.json();if(!res.ok)throw Error(data.message||"Cannot load catalog");
  setPages((data.pages||[]).filter((p:Page)=>p.slug.startsWith("/products/")));
 };
 useEffect(()=>{void refresh().catch(e=>setError(String(e)));void fetch("/api/admin/content-studio/media",{cache:"no-store"}).then(r=>r.ok?r.json():{assets:[]}).then(d=>setApprovedAssets(d.assets||[])).catch(()=>setApprovedAssets([]));},[]);
 const load=async(p:Page)=>{
  setBusy(true);setError("");
  try{
   const res=await fetch(path+"/"+encodeURIComponent(p.id)+"?siteId=vietnamclothing.vn",{cache:"no-store"});
   const data=await res.json();if(!res.ok)throw Error(data.message||"Cannot load product");
   const rev:Revision|undefined=data.page?.revisions?.[0];
   const d=rev?.content?.blocks?.find(b=>b.type==="product")?.data;
   if(!rev||!d)throw Error("No product revision found");
   const vi=(d.vi||{}) as Record<string,unknown>;
   const media=Array.isArray(d.media)&&d.media[0]&&typeof d.media[0]==="object"?d.media[0] as Record<string,unknown>:{};
   const str=(x:unknown)=>typeof x==="string"?x:"";
   setValue({slug:str(d.slug),category:str(d.category)||"apparel",categoryId:str(d.categoryId)||"APP-01",title:str(d.title),summary:str(d.summary),description:str(d.description),titleVi:str(vi.title),summaryVi:str(vi.summary),descriptionVi:str(vi.description),imageMediaAssetId:str(media.mediaAssetId),imageUrl:str(media.url),imageAlt:str(media.alt),publicApproved:d.publicApproved===true,mediaRightsApproved:d.mediaRightsApproved===true});
   setPageId(p.id);setRevision(rev);setPublishedId(data.page.publishedRevisionId);
  }catch(e){setError(e instanceof Error?e.message:"Cannot load product");}finally{setBusy(false);}
 };
 const loadConcept=(id:string)=>{
  const idea=VNC_PRODUCT_IDEAS_V1.find(x=>x.id===id);
  if(!idea)return;
  if(pageId){setError("Create a new draft before loading another concept");return;}
  const slug=idea.nameEn.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  setValue({...init,slug,categoryId:idea.categoryId,title:idea.nameEn,titleVi:idea.nameVi});
  setNotice("Internal concept "+idea.id+" loaded. Specifications, source, images and rights MUST be verified before approval.");
 };
 const productData=()=>({slug:value.slug,category:value.category,categoryId:value.categoryId,title:value.title,summary:value.summary,description:value.description,
   vi:{title:value.titleVi,summary:value.summaryVi,description:value.descriptionVi},
   publicApproved:value.publicApproved,mediaRightsApproved:value.mediaRightsApproved,
   media:[{mediaAssetId:value.imageMediaAssetId,url:value.imageUrl,alt:value.imageAlt,approved:value.mediaRightsApproved,visibility:"PUBLIC",usageRightsApproved:value.mediaRightsApproved}]});
 const save=async()=>{
  setBusy(true);setError("");setNotice("");
  try{
   if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug))throw Error("Use a lowercase product slug");
   const data={siteId:"vietnamclothing.vn",slug:"/products/"+value.slug,title:value.title,
    blocks:[{type:"product",data:productData()}]};
   const edit=Boolean(pageId);
   const res=await fetch(edit?path+"/"+encodeURIComponent(pageId!):path,{method:edit?"PUT":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(edit?{...data,expectedVersion:revision?.version}:data)});
   const body=await res.json();if(!res.ok)throw Error(body.message||"Save failed");
   setNotice("DRAFT saved. It is not published. Submit for independent review before publication.");
   if(edit){await refresh();await load({id:pageId!,slug:data.slug,title:data.title,publishedRevisionId:publishedId});}else{setPageId(body.page.id);await refresh();const found={id:body.page.id,slug:data.slug,title:data.title,publishedRevisionId:null};await load(found);}
  }catch(e){setError(e instanceof Error?e.message:"Save failed");}finally{setBusy(false);}
 };
 const transition=async(action:"review"|"approve"|"publish")=>{
  if(!pageId||!revision)return;
  setBusy(true);setError("");setNotice("");
  try{
   const res=await fetch(path+"/"+encodeURIComponent(pageId)+"/"+action,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({siteId:"vietnamclothing.vn",revisionId:revision.id})});
   const data=await res.json();if(!res.ok)throw Error(data.message||"Action denied");
   await load({id:pageId,slug:"/products/"+value.slug,title:value.title,publishedRevisionId:publishedId});
   setNotice(action==="review"?"Review requested":action==="approve"?"Approved after independent review":"Published in VNC OS; website feed deployment remains a separate check");
  }catch(e){setError(e instanceof Error?e.message:"Action failed");}finally{setBusy(false);}
 };
 const field=(key:keyof ProductFields,label:string,long=false)=><label style={{display:"block",fontSize:13,fontWeight:600,marginBottom:10}}>{label}{long?<textarea rows={3} style={style} value={String(value[key])} onChange={e=>update(key,e.target.value)}/>:<input style={style} value={String(value[key])} disabled={key==="slug"&&!!pageId} onChange={e=>update(key,e.target.value)}/>}</label>;
 return <section style={{border:"1px solid #d5dfd8",borderRadius:12,padding:20,marginTop:26,background:"#fff"}}>
  <h2>Product Publishing · VietnamClothing.vn (EN/VN)</h2>
  <p style={{fontSize:13}}>Products are site-scoped Content Studio revisions. Do not attest image rights without verifying the original asset and permission to publish.</p>
  {!pageId?<label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:12}}>VNC V1 product ideas — unapproved intake
   <select style={style} defaultValue="" onChange={e=>loadConcept(e.target.value)}><option value="">Choose one of 55 draft concepts</option>{VNC_PRODUCT_IDEAS_V1.map(p=><option key={p.id} value={p.id}>{p.id} · {p.nameVi} · {p.priority}</option>)}</select>
  </label>:null}
  <label style={{fontSize:13,fontWeight:600}}>Existing products
   <select style={style} value={pageId||""} onChange={e=>{const p=pages.find(x=>x.id===e.target.value);if(p)void load(p);else{setValue(init);setPageId(null);setRevision(null);}}}>
    <option value="">Create a new product</option>{pages.map(p=><option key={p.id} value={p.id}>{p.title} · {p.slug}</option>)}
   </select>
  </label>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:20,marginTop:20}}>
    <div><h3>English</h3>{field("slug","Product slug")}{field("title","Product name")}{field("summary","Short description",true)}{field("description","Detailed description",true)}</div>
    <div><h3>Tiếng Việt</h3>{field("titleVi","Tên sản phẩm")}{field("summaryVi","Mô tả ngắn",true)}{field("descriptionVi","Mô tả chi tiết",true)}
      <label style={{fontSize:13,fontWeight:600}}>Category<select style={style} value={value.category} onChange={e=>update("category",e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
      <label style={{fontSize:13,fontWeight:600}}>VNC Product Category V1<select style={style} value={value.categoryId} onChange={e=>update("categoryId",e.target.value)}>{VNC_PARENT_CATEGORIES.map(parent=><optgroup key={parent.id} label={parent.nameEn+" / "+parent.nameVi}>{VNC_CATEGORIES_V1.filter(x=>x.parentId===parent.id).map(child=><option key={child.id} value={child.id}>{child.nameEn} / {child.nameVi}</option>)}</optgroup>)}</select></label></div>
  </div>
  <h3>Media Library reference</h3>
  <label style={{display:"block",fontSize:13,fontWeight:600}}>Verified Media Library asset
    <select style={style} value={value.imageMediaAssetId} onChange={e=>{const a=approvedAssets.find(x=>x.id===e.target.value);setValue(old=>({...old,imageMediaAssetId:a?.id||"",imageUrl:a?.url||"",imageAlt:a?.alt||""}));}}>
      <option value="">No verified media asset selected</option>{approvedAssets.map(a=><option key={a.id} value={a.id}>{a.title}</option>)}
    </select>
  </label>
  {approvedAssets.length===0?<p role="status" style={{fontSize:12,color:"#925c25"}}>No Media Library images have verified public-use rights yet; this blocks product approval and publish.</p>:null}
  <p style={{fontSize:12}}>Use only verified HTTPS media URLs from your approved media collection. Direct Media Library picker is not integrated yet.</p>
  <p style={{fontSize:12}}>Asset URL: {value.imageUrl||"None"}</p>{field("imageAlt","Image alt text")}
  <label style={{display:"block",marginTop:10}}><input type="checkbox" checked={value.mediaRightsApproved} onChange={e=>update("mediaRightsApproved",e.target.checked)}/> Media source and publication rights verified</label>
  <label style={{display:"block",marginTop:8}}><input type="checkbox" checked={value.publicApproved} onChange={e=>update("publicApproved",e.target.checked)}/> Product facts and public listing approved for review</label>
  <button disabled={busy} onClick={()=>void save()} style={{padding:"12px 18px",marginTop:20,borderRadius:8,background:"#123e32",color:"white"}}>{pageId?"Save new DRAFT revision":"Create DRAFT product"}</button>
  {revision?<div style={{marginTop:18,borderTop:"1px solid #ddd",paddingTop:12}}>
    <strong>Revision v{revision.version} · {revision.status}</strong><p style={{fontSize:12}}>Author: {revision.authorId||"—"} · Reviewer: {revision.approvedById||"—"} · Published: {revision.id===publishedId?"Yes":"No"}</p>
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      <button disabled={busy||revision.status!=="DRAFT"} onClick={()=>void transition("review")}>Submit for review</button>
      <button disabled={busy||revision.status!=="IN_REVIEW"} onClick={()=>void transition("approve")}>Approve (reviewer)</button>
      <button disabled={busy||revision.status!=="APPROVED"} onClick={()=>void transition("publish")}>Publish</button>
    </div></div>:null}
  {notice?<p role="status" style={{color:"green"}}>{notice}</p>:null}{error?<p role="alert" style={{color:"darkred"}}>{error}</p>:null}
 </section>;
}
