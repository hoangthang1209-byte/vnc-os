"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./OrderProjectV9.module.css";

type Batch = { id:string; code:string; name:string; _count:{orders:number} };
type Project = {id:string;code:string;name:string;customer:{name:string;code:string};batches:Batch[]};
type CustomerOption = {id:string;name:string;code:string};
type Filter = "all" | "empty" | "active";

export default function OrderProjectManager() {
  const [projects,setProjects] = useState<Project[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");
  const [search,setSearch] = useState("");
  const [filter,setFilter] = useState<Filter>("all");
  const [portfolioView,setPortfolioView] = useState<"table"|"cards">("table");
  const [customerSearch,setCustomerSearch] = useState("");
  const [customerOptions,setCustomerOptions] = useState<CustomerOption[]>([]);
  const [customerId,setCustomerId] = useState("");
  const [code,setCode] = useState("");
  const [name,setName] = useState("");
  const [newProjectOpen,setNewProjectOpen] = useState(false);
  const [batchProjectId,setBatchProjectId] = useState<string|null>(null);
  const [batchCode,setBatchCode] = useState("");
  const [batchName,setBatchName] = useState("");
  const [saving,setSaving] = useState(false);

  const refresh = useCallback(async (signal?:AbortSignal) => {
    const response = await fetch("/api/orders/projects",{cache:"no-store",signal});
    const result = await response.json() as {projects?:Project[];message?:string};
    if(!response.ok||!Array.isArray(result.projects)) throw new Error(result.message??"Không tải được dự án");
    return result.projects;
  },[]);
  useEffect(()=>{
    const controller=new AbortController();
    void refresh(controller.signal).then(items=>{
      if(!controller.signal.aborted){setProjects(items);setError("");setLoading(false);}
    }).catch(e=>{if(!controller.signal.aborted){setError(e instanceof Error?e.message:"Không thể tải dự án");setLoading(false);}});
    return ()=>controller.abort();
  },[refresh]);

  useEffect(()=>{
    if(!newProjectOpen)return;
    const controller=new AbortController();
    const timer=window.setTimeout(()=>{
      void fetch(`/api/crm/customers?limit=50&search=${encodeURIComponent(customerSearch)}`,{cache:"no-store",signal:controller.signal})
        .then(async r=>{if(!r.ok)throw new Error("Không thể tìm khách hàng");return r.json() as Promise<{customers?:CustomerOption[]}>;})
        .then(data=>{if(!controller.signal.aborted)setCustomerOptions(data.customers??[]);})
        .catch(()=>{if(!controller.signal.aborted)setCustomerOptions([]);});
    },250);
    return ()=>{controller.abort();window.clearTimeout(timer);};
  },[customerSearch,newProjectOpen]);

  const visible=useMemo(()=>projects.filter(p=>{
    const text=[p.code,p.name,p.customer.name,p.customer.code,...p.batches.map(b=>b.code)].join(" ").toLocaleLowerCase("vi");
    const match=text.includes(search.trim().toLocaleLowerCase("vi"));
    const hasOrders=p.batches.some(b=>b._count.orders>0);
    return match&&(filter==="all"||(filter==="active"?hasOrders:!hasOrders));
  }),[projects,search,filter]);
  const allBatches=projects.reduce((n,p)=>n+p.batches.length,0);
  const allOrders=projects.reduce((n,p)=>n+p.batches.reduce((total,b)=>total+b._count.orders,0),0);

  async function submit(path:string,body:object):Promise<boolean>{
    if(saving)return false;
    setSaving(true);setMessage("");setError("");
    try{
      const response=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const result=await response.json() as {message?:string};
      if(!response.ok)throw new Error(result.message??"Không thể lưu dữ liệu");
      setProjects(await refresh());
      setMessage("Đã lưu vào hệ thống thành công.");
      return true;
    }catch(e){setError(e instanceof Error?e.message:"Không thể lưu");return false;}
    finally{setSaving(false);}
  }

  return <main className={styles.root} data-testid="v9-order-project-workspace">
    <nav className={styles.breadcrumb}><Link href="/admin/orders">Đơn hàng</Link><span>/</span><span>Project & Batch</span></nav>
    <header className={styles.hero}>
      <div><p className={styles.eyebrow}>ORDER OPERATIONS / V9</p><h1>Project & Batch</h1><p>Tổ chức dự án theo khách hàng và đợt sản xuất — PO và Shipment được quản lý riêng.</p></div>
      <div className={styles.heroActions}><Link href="/admin/orders" className={styles.secondary}>Danh sách đơn hàng</Link><button className={styles.primary} type="button" onClick={()=>setNewProjectOpen(v=>!v)} aria-expanded={newProjectOpen}>+ Tạo Project</button></div>
    </header>

    <section className={styles.metrics} aria-label="Tổng quan dữ liệu Project">
      {[
        ["Tổng Project",projects.length,"Số dự án từ API"],
        ["Tổng Batch",allBatches,"Các đợt đã tạo"],
        ["Đơn liên kết",allOrders,"Tổng số đơn đếm theo Batch"],
        ["Project chưa có đơn",projects.filter(p=>p.batches.every(b=>b._count.orders===0)).length,"Cần liên kết đơn hàng"],
      ].map(([label,value,desc])=><div className={styles.metric} key={String(label)}><span>{label}</span><strong>{Number(value).toLocaleString("vi-VN")}</strong><small>{desc}</small></div>)}
    </section>

    {message&&<p role="status" className={styles.success}>{message}</p>}
    {error&&<p role="alert" className={styles.error}>{error}</p>}

    {newProjectOpen&&<section className={styles.panel} aria-label="Tạo dự án">
      <div className={styles.panelHead}><h2>Tạo Project mới</h2><button type="button" onClick={()=>setNewProjectOpen(false)} className={styles.secondary}>Đóng</button></div>
      <form className={styles.formGrid} onSubmit={async e=>{
        e.preventDefault();
        if(!customerId){setError("Chọn một khách hàng có thật trong CRM.");return;}
        if(await submit("/api/orders/projects",{customerId,code:code.trim(),name:name.trim()})){
          setCode("");setName("");setCustomerId("");setCustomerSearch("");setNewProjectOpen(false);
        }
      }}>
        <label className={styles.wide}>Khách hàng CRM
          <input className={styles.input} value={customerSearch} onChange={e=>{setCustomerSearch(e.target.value);setCustomerId("");}} placeholder="Tìm tên hoặc mã khách hàng" aria-label="Tìm khách hàng"/>
          <select className={styles.input} required value={customerId} onChange={e=>setCustomerId(e.target.value)} aria-label="Chọn khách hàng CRM">
            <option value="">Chọn khách hàng từ kết quả tìm kiếm</option>
            {customerOptions.map(c=><option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
        </label>
        <label>Mã Project<input className={styles.input} required value={code} onChange={e=>setCode(e.target.value)} placeholder="VD: BIGBANG-2026"/></label>
        <label>Tên Project<input className={styles.input} required value={name} onChange={e=>setName(e.target.value)} placeholder="Tên chương trình hoặc dự án"/></label>
        <div className={styles.wide}><button type="submit" disabled={saving||!customerId||!code.trim()||!name.trim()} className={styles.primary}>{saving?"Đang lưu...":"Lưu Project"}</button></div>
      </form>
    </section>}

    <section className={styles.panel} aria-label="Danh sách Project và Batch">
      <div className={styles.panelHead}><div><h2>Danh sách Project</h2><p>{visible.length} / {projects.length} dự án</p></div><input value={search} onChange={e=>setSearch(e.target.value)} className={styles.search} placeholder="Tìm dự án, khách hàng, batch..." aria-label="Tìm Project"/></div>
      <div className={styles.viewSwitch} role="group" aria-label="Cách xem Project">
        <button type="button" aria-pressed={portfolioView==="table"} className={portfolioView==="table"?styles.selected:""} onClick={()=>setPortfolioView("table")}>Bảng Portfolio</button>
        <button type="button" aria-pressed={portfolioView==="cards"} className={portfolioView==="cards"?styles.selected:""} onClick={()=>setPortfolioView("cards")}>Thẻ Project</button>
      </div>
      <div className={styles.filters} role="group" aria-label="Lọc Project">
        {([["all","Tất cả"],["active","Có đơn hàng"],["empty","Chưa có đơn hàng"]] as const).map(([key,label])=><button type="button" key={key} aria-pressed={filter===key} className={filter===key?styles.selected:""} onClick={()=>setFilter(key)}>{label}</button>)}
      </div>
      {loading?<p className={styles.empty} role="status">Đang tải danh sách dự án...</p>:visible.length===0?<p className={styles.empty}>Không có Project phù hợp.</p>:
      portfolioView==="table"?<div className={styles.tableWrap}><table className={styles.table}>
        <thead><tr><th>Project</th><th>Khách hàng</th><th>Batches</th><th>Đơn hàng</th><th>Thao tác</th></tr></thead>
        <tbody>{visible.map(project=><tr key={project.id}>
          <td><strong>{project.name}</strong><small>{project.code}</small></td>
          <td>{project.customer.name}<small>{project.customer.code}</small></td>
          <td>{project.batches.length}<small>{project.batches.map(b=>b.code).join(" · ")||"Chưa có Batch"}</small></td>
          <td>{project.batches.reduce((n,b)=>n+b._count.orders,0).toLocaleString("vi-VN")}</td>
          <td><button type="button" className={styles.secondary} onClick={()=>{setPortfolioView("cards");setBatchProjectId(project.id);}}>Xem Batch / Thêm</button></td>
        </tr>)}</tbody>
      </table></div>:
      <div className={styles.projectGrid}>{visible.map(project=><article className={styles.projectCard} key={project.id}>
        <div className={styles.projectTitle}><div><span className={styles.projectCode}>{project.code}</span><h3>{project.name}</h3><p>{project.customer.code} · {project.customer.name}</p></div><span className={styles.badge}>{project.batches.length} Batch</span></div>
        <div className={styles.batchList}>
          {project.batches.length?project.batches.map(batch=><div key={batch.id} className={styles.batchRow}><div><strong>{batch.code}</strong><span>{batch.name}</span></div><span>{batch._count.orders} đơn</span></div>):<p className={styles.empty}>Chưa có Batch nào trong Project.</p>}
        </div>
        <div className={styles.cardActions}><button type="button" className={styles.secondary} onClick={()=>{setBatchProjectId(batchProjectId===project.id?null:project.id);setBatchName("");setBatchCode("");}}>+ Thêm Batch</button><Link href="/admin/orders" className={styles.secondary}>Mở Orders</Link></div>
        {batchProjectId===project.id&&<form className={styles.batchForm} onSubmit={async e=>{
          e.preventDefault();
          if(await submit(`/api/orders/projects/${encodeURIComponent(project.id)}/batches`,{code:batchCode.trim(),name:batchName.trim()})){setBatchProjectId(null);setBatchCode("");setBatchName("");}
        }}><label>Mã Batch<input className={styles.input} required value={batchCode} onChange={e=>setBatchCode(e.target.value)} placeholder="VD: BATCH-02"/></label><label>Tên Batch<input className={styles.input} required value={batchName} onChange={e=>setBatchName(e.target.value)} placeholder="Tên đợt"/></label><button className={styles.primary} type="submit" disabled={saving||!batchCode.trim()||!batchName.trim()}>Lưu Batch</button></form>}
      </article>)}</div>}
    </section>
  </main>;
}
