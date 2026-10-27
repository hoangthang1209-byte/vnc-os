"use client";

import { useEffect, useState } from "react";

type Item = { site: string; status: "DRAFT"; demo: true; publicApproved: false; mediaRightsApproved: false; slug: string; category: string; title: string; summary: string; description: string; media: { url: string; alt: string; visibility: "DEMO"; approved: false; usageRightsApproved: false }[] };

const seed: Item[] = [
  ["demo-artist-tour-tee","entertainment","Artist Tour T-Shirt Concept","Concept apparel for licensed entertainment merchandise programs."],
  ["demo-campaign-kit","promotional","Campaign Welcome Kit Concept","Customizable campaign packs for promotional gifting."],
  ["demo-corporate-gift","corporate","Corporate Gift Set Concept","A curated branded gift experience for business partners."],
  ["demo-product-development","sourcing","Product Sourcing Concept","Example of coordinating materials, samples and packaging."],
  ["demo-private-label-hoodie","apparel","Private Label Hoodie Concept","An illustrative apparel OEM product-development brief."],
].map(([slug,category,title,summary]) => ({ site:"vietnamclothing.vn",status:"DRAFT",demo:true,publicApproved:false,mediaRightsApproved:false,slug,category,title,summary,description:summary+" Fictitious sample content, not real availability.",media:[{url:"./demo-media/"+slug+".svg",alt:"DEMO illustration: "+title,visibility:"DEMO",approved:false,usageRightsApproved:false}]} as Item));

const key = "vnc-content-studio-demo-products-v1";
export default function DemoCatalogEditor() {
  const [items,setItems] = useState<Item[]>(seed);
  const [active,setActive] = useState(0);
  const [notice,setNotice] = useState("");
  useEffect(() => {
    try { const raw=window.localStorage.getItem(key); if (!raw) return; const parsed: unknown=JSON.parse(raw); if (Array.isArray(parsed) && parsed.length > 0) {
      const safe=parsed.filter((x): x is Item => !!x && typeof x==="object" && x.demo===true && x.status==="DRAFT" && x.site==="vietnamclothing.vn");
      if (safe.length) setItems(safe);
    }} catch { /* ignore invalid local draft */ }
  }, []);
  const chosen=items[active] || items[0];
  const patch=(field: "title"|"summary"|"description"|"category", value:string)=>{
    setItems(previous=>previous.map((item,i)=>i===active?{...item,[field]:value}:item));
    setNotice("Unsaved edits — save browser draft or export JSON");
  };
  const save=()=>{try{window.localStorage.setItem(key,JSON.stringify(items));setNotice("Saved in this browser only. No database records changed.");}catch{setNotice("Browser storage unavailable — please export JSON.");}};
  const download=()=>{const payload={site:"vietnamclothing.vn",schemaVersion:1,source:"DEMO_SAMPLE_NOT_PUBLISHED",demoOnly:true,products:items.map(x=>({...x,status:"DRAFT" as const,demo:true as const,publicApproved:false as const,mediaRightsApproved:false as const}))};const blob=new Blob([JSON.stringify(payload,null,2)+"\n"],{type:"application/json"});const url=URL.createObjectURL(blob);const anchor=document.createElement("a");anchor.href=url;anchor.download="demo-catalog-data.json";anchor.click();URL.revokeObjectURL(url);setNotice("Downloaded demo JSON. To reflect changes on the public staging site, review and commit this file to the website branch.");};
  return <main style={{maxWidth:1120,margin:"0 auto",padding:"38px 20px",fontFamily:"system-ui,sans-serif",color:"#142c27"}}>
    <p style={{fontSize:12,letterSpacing:".13em",fontWeight:700}}>VNC OS / CONTENT STUDIO / PREVIEW</p>
    <h1 style={{fontSize:"clamp(30px,4vw,50px)",margin:"10px 0"}}>VietnamClothing — Demo Product Drafts</h1>
    <p>Editable fictional content for layout review only. <strong>Not published, not approved media, not a connected catalog database.</strong> Changes are stored in this browser, not VNC OS. Export JSON for code review and upload into the staging website.</p>
    <div style={{display:"grid",gridTemplateColumns:"minmax(200px,1fr) minmax(0,2fr)",gap:24,marginTop:30}}>
      <aside style={{display:"grid",alignContent:"start",gap:8}} aria-label="Demo products">
        {items.map((x,i)=><button key={x.slug} type="button" onClick={()=>setActive(i)} style={{background:i===active?"#18372e":"#f1f4ef",color:i===active?"white":"#18372e",border:0,borderRadius:8,padding:15,textAlign:"left",cursor:"pointer"}}><span style={{fontSize:10,display:"block",marginBottom:6}}>DRAFT / DEMO</span>{x.title}</button>)}
      </aside>
      <section style={{background:"#f5f7f3",borderRadius:14,padding:24,display:"grid",gap:14}}>
        <p style={{fontSize:12,fontWeight:800,color:"#a05131",margin:0}}>DEMO — NOT A REAL PRODUCT</p>
        <label>Title<input value={chosen.title} onChange={e=>patch("title",e.target.value)} style={inputStyle}/></label>
        <label>Category<select value={chosen.category} onChange={e=>patch("category",e.target.value)} style={inputStyle}>{["entertainment","promotional","corporate","sourcing","apparel"].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
        <label>Summary<textarea rows={3} value={chosen.summary} onChange={e=>patch("summary",e.target.value)} style={inputStyle}/></label>
        <label>Description<textarea rows={5} value={chosen.description} onChange={e=>patch("description",e.target.value)} style={inputStyle}/></label>
        <p style={{fontSize:12,margin:0}}>Illustration: <code>{chosen.media[0]?.url}</code>. Illustrations are committed demo SVGs on the VNC staging branch.</p>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}><button type="button" onClick={save} style={buttonStyle}>Save local draft</button><button type="button" onClick={download} style={buttonStyle}>Export demo JSON</button><button type="button" onClick={()=>{setItems(seed);setActive(0);setNotice("Reset to original examples; save or export to retain this reset.");}} style={buttonStyle}>Reset examples</button></div>
        <p role="status" style={{fontSize:13}}>{notice}</p>
      </section>
    </div>
  </main>;
}
const inputStyle: React.CSSProperties={display:"block",width:"100%",padding:12,marginTop:6,border:"1px solid #c1cac3",borderRadius:7,font: "inherit",background:"white"};
const buttonStyle: React.CSSProperties={padding:"12px 16px",background:"#173a31",color:"white",border:0,borderRadius:7,fontWeight:700,cursor:"pointer"};
