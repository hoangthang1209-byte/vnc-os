"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Job = {
  id: string; trackingId: string; orderId: string; orderNo: string; customer: string;
  orderItemId: string; sku: string; name: string; image: string | null;
  ordered: number; ready: number; progress: number; risk: string;
  promised: string | null; batch: string | null; stage: string;
  factoryId: string | null; start: string | null; end: string | null;
  done: number; accepted: number; planned: number;
};
type Factory = { id: string; code: string; name: string; category: string;
  capabilities: string; address: string; contact: string; phone: string };
type Mode = "orders" | "sku" | "factory" | "stage";
const dateText = (x: string | null) => x ? new Date(x).toLocaleDateString("vi-VN") : "Chưa lập lịch";
const day = 86400000;
const stages = ["Cắt", "In", "Thêu", "May", "QC", "Đóng gói"];
const stageColor = (x: string) => {
  const i = stages.findIndex((v) => x.toLowerCase().includes(v.toLowerCase()));
  return ["#64748b","#2563eb","#8b5cf6","#08916c","#d97706","#b4528b"][i < 0 ? 0 : i];
};
const groupKey = (j: Job, m: Mode) =>
  m === "orders" ? j.orderNo :
  m === "sku" ? j.orderNo + " / " + j.sku :
  m === "factory" ? (j.factoryId ?? "unassigned") : j.stage;
export default function IntegratedProductionWorkspace({jobs,factories}: {
  jobs: Job[]; factories: Factory[];
}) {
  const [mode,setMode] = useState<Mode>("orders");
  const [search,setSearch] = useState("");
  const [selected,setSelected] = useState<string | null>(null);
  const [expanded,setExpanded] = useState<string[]>([]);
  const [factoryDetail,setFactoryDetail] = useState<string | null>(null);
  const [days,setDays] = useState(21);
  const factoryMap = useMemo(()=>new Map(factories.map(f=>[f.id,f])),[factories]);
  const data = useMemo(()=>jobs.filter(j=>[j.orderNo,j.sku,j.name,j.stage,
    factoryMap.get(j.factoryId ?? "")?.name ?? ""].some(v=>v.toLowerCase().includes(search.toLowerCase()))),[jobs,search,factoryMap]);
  const grouped = useMemo(()=> {
    const map = new Map<string,Job[]>();
    for (const j of data) {const k=groupKey(j,mode);map.set(k,[...(map.get(k)??[]),j]);}
    return [...map].sort((a,b)=>a[0].localeCompare(b[0]));
  },[data,mode]);
  const selectedJob = jobs.find(j=>j.id===selected);
  const anchor = new Date(); anchor.setHours(0,0,0,0);
  const timelineStart = anchor.getTime() - 3*day;
  const width = 920;
  const step = width/days;
  const bar = (j:Job) => {
    if (!j.start || !j.end) return null;
    const start=(new Date(j.start).getTime()-timelineStart)/day;
    const end=(new Date(j.end).getTime()-timelineStart)/day;
    const left=Math.max(0,start)*step;
    const right=Math.min(days,Math.max(start+0.5,end+1))*step;
    if(right<=0||left>=width) return null;
    return <button key={j.id} title={j.sku+" · "+j.stage+" · "+dateText(j.start)+"–"+dateText(j.end)}
      onClick={()=>setSelected(j.id)}
      className="absolute top-1 h-6 rounded text-white text-[10px] text-left px-1 overflow-hidden whitespace-nowrap"
      style={{left,width:Math.max(2,right-left-2),background:stageColor(j.stage)}}>{j.stage}</button>;
  };
  const groupLabel=(k:string)=>
    mode==="factory" ? (factoryMap.get(k)?.name ?? "Chưa phân công Factory") : k;
  const risks=new Set(data.filter(j=>j.risk!=="ON_TRACK").map(j=>j.orderItemId));
  const uniqueSkus=new Set(data.map(j=>j.orderItemId)).size;
  const uniqueOrders=new Set(data.map(j=>j.orderId)).size;
  const activeFactories=new Set(data.map(j=>j.factoryId).filter(Boolean)).size;
  const factoryJobs=jobs.filter(j=>j.factoryId===factoryDetail);
  const factory=factoryDetail?factoryMap.get(factoryDetail):undefined;
  return <div className="max-w-[1700px] mx-auto p-3 md:p-6 space-y-5 text-slate-800">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs tracking-widest uppercase text-slate-500">VNC OS V9 / Operations</p>
        <h1 className="text-2xl font-semibold text-slate-900">Orders ↔ Production ↔ Factory</h1>
        <p className="text-sm text-slate-500">Master timeline · Dữ liệu sản xuất thực từ VNC OS · Chế độ chỉ đọc</p></div>
      <div className="flex gap-2 text-sm">
        <Link className="border rounded-lg px-3 py-2" href="/admin/orders">Orders</Link>
        <Link className="border rounded-lg px-3 py-2" href="/admin/manufacturing/production-timeline">Cập nhật sản xuất</Link>
      </div>
    </header>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[["Đơn có sản xuất",uniqueOrders],["SKU đang theo dõi",uniqueSkus],["Factory được giao",activeFactories],["SKU cần chú ý",risks.size]].map(([k,v])=>
        <div key={String(k)} className="bg-white border rounded-xl p-4"><p className="text-xs text-slate-500">{k}</p>
          <p className="text-2xl font-semibold mt-1">{v}</p></div>)}
    </div>
    <div className="bg-white border rounded-xl p-3 md:p-4 space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {([["orders","Theo đơn hàng"],["sku","Theo SKU"],["factory","Theo Factory"],["stage","Theo công đoạn"]] as const).map(([v,l])=>
            <button key={v} onClick={()=>{setMode(v);setExpanded([]);}}
              className={"text-xs md:text-sm px-3 py-2 rounded-lg "+(mode===v?"bg-slate-900 text-white":"bg-slate-100")}>{l}</button>)}
        </div>
        <div className="flex items-center gap-2">
          <input aria-label="Tìm kiếm" placeholder="Tìm đơn / SKU / Factory" value={search} onChange={e=>setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-44 md:w-64"/>
          <select aria-label="Khoảng xem" className="border rounded-lg p-2 text-sm" value={days} onChange={e=>setDays(Number(e.target.value))}>
            <option value={14}>14 ngày</option><option value={21}>21 ngày</option><option value={35}>35 ngày</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[1130px]">
          <div className="flex border-b pb-2 text-[11px] text-slate-500">
            <div className="w-[210px] shrink-0">Đơn / SKU / Factory / Công đoạn</div>
            <div className="relative" style={{width}}>
              {Array.from({length:days},(_,i)=><span key={i} className="absolute text-center" style={{left:i*step,width:step}}>
                {new Date(timelineStart+i*day).getDate()}</span>)}
            </div>
          </div>
          {grouped.map(([key,rows])=><div key={key}>
            <div className="flex border-b items-center hover:bg-slate-50">
              <button className="w-[210px] shrink-0 text-left text-xs font-semibold py-3 pr-2"
                onClick={()=>setExpanded(a=>a.includes(key)?a.filter(v=>v!==key):[...a,key])}>
                <span className="mr-1">{expanded.includes(key)?"▾":"▸"}</span>{groupLabel(key)}
                <span className="ml-1 text-slate-400">({rows.length})</span></button>
              <div className="relative h-9 bg-slate-50/60" style={{width}}>
                {Array.from({length:days},(_,i)=><span key={i} className="absolute h-full border-l border-slate-200/80" style={{left:i*step}}/>)}
                {rows.map(bar)}
              </div>
            </div>
            {expanded.includes(key)&&rows.map(j=><div key={j.id} className="flex items-center border-b bg-slate-50/30">
              <button className="w-[210px] shrink-0 text-left text-[11px] py-2 pl-5 pr-2 truncate" onClick={()=>setSelected(j.id)}
                title={j.orderNo+" / "+j.sku+" / "+j.stage}>
                {j.sku} · {j.stage}<span className="block text-slate-400">{factoryMap.get(j.factoryId??"")?.name??"Chưa phân xưởng"}</span>
              </button>
              <div className="relative h-10" style={{width}}>{Array.from({length:days},(_,i)=><span key={i} className="absolute h-full border-l border-slate-200/70" style={{left:i*step}}/>)}{bar(j)}</div>
            </div>)}
          </div>)}
          {!grouped.length&&<p className="py-10 text-center text-slate-500">Chưa có Production Stage phù hợp bộ lọc. Không hiển thị dữ liệu giả.</p>}
        </div>
      </div>
      <p className="text-xs text-slate-500">Thanh lịch chỉ xuất hiện với job có ngày bắt đầu/kết thúc kế hoạch. Nhấp vào job để xem thông tin thật và liên kết về đơn hàng.</p>
    </div>
    <section className="bg-white border rounded-xl p-4">
      <h2 className="font-semibold mb-3">Factory Directory · Đối tác sản xuất đang hoạt động</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {factories.map(f=><button key={f.id} onClick={()=>setFactoryDetail(f.id)}
          className="border rounded-xl p-3 text-left hover:border-slate-600">
          <p className="font-medium text-sm">{f.name}</p><p className="text-[11px] text-slate-500">{f.code} · {f.category}</p>
          <p className="text-xs mt-2 line-clamp-2">{f.capabilities||"Chưa khai báo năng lực"}</p>
          <p className="text-xs text-slate-500 mt-2">{jobs.filter(j=>j.factoryId===f.id).length} Production Jobs</p>
        </button>)}
      </div>
    </section>
    {(selectedJob||factory)&&<div className="fixed inset-0 z-[70] bg-black/30 flex justify-end" onMouseDown={()=>{setSelected(null);setFactoryDetail(null)}}>
      <aside role="dialog" aria-modal="true" aria-label="Chi tiết sản xuất" className="bg-white h-full w-full max-w-xl overflow-y-auto shadow-2xl p-5 space-y-4"
        onMouseDown={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center"><h2 className="text-lg font-semibold">{factory?"Factory 360":"Production Job"}</h2>
          <button aria-label="Đóng" className="text-xl p-1" onClick={()=>{setSelected(null);setFactoryDetail(null)}}>×</button></div>
        {selectedJob&&!factory&&<div className="space-y-3 text-sm">
          <p className="text-slate-500">{selectedJob.orderNo} / {selectedJob.sku}</p>
          <h3 className="font-semibold text-lg">{selectedJob.name} · {selectedJob.stage}</h3>
          {selectedJob.image&&<img src={selectedJob.image} alt="SKU thumbnail" className="h-24 w-24 rounded border object-cover"/>}
          <dl className="grid grid-cols-2 gap-3">{[
            ["Batch",selectedJob.batch??"SKU"],
            ["Factory",factoryMap.get(selectedJob.factoryId??"")?.name??"Chưa phân xưởng"],
            ["Kế hoạch",dateText(selectedJob.start)+" – "+dateText(selectedJob.end)],
            ["Đã hoàn thành",String(selectedJob.done)+" / "+selectedJob.planned],
            ["QC đạt",String(selectedJob.accepted)],
            ["Rủi ro",selectedJob.risk],
            ["Hạn giao",dateText(selectedJob.promised)],
            ["Sẵn sàng",String(selectedJob.ready)+" / "+selectedJob.ordered],
          ].map(([k,v])=><div key={k} className="bg-slate-50 p-3 rounded"><dt className="text-xs text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
          <div className="flex flex-wrap gap-2">
            <Link className="px-3 py-2 rounded bg-slate-900 text-white" href={"/admin/orders?search="+encodeURIComponent(selectedJob.orderNo)}>Mở Order</Link>
            <Link className="px-3 py-2 rounded border" href="/admin/manufacturing/production-timeline">Cập nhật job</Link>
            {selectedJob.factoryId&&<button className="px-3 py-2 rounded border" onClick={()=>{setFactoryDetail(selectedJob.factoryId);setSelected(null)}}>Factory 360</button>}
          </div>
          <p className="text-xs text-slate-500">Tài liệu kỹ thuật được quản lý qua module Tech Pack / Rập / QC hiện hữu; chưa tạo bản sao tài liệu.</p>
          <div className="flex gap-2"><Link href="/admin/tech-pack" className="underline">Tech Pack</Link><Link href="/admin/pattern" className="underline">Pattern</Link></div>
        </div>}
        {factory&&<div className="space-y-4 text-sm">
          <h3 className="font-semibold text-lg">{factory.name}</h3>
          <p className="text-slate-500">{factory.code} · {factory.category}</p>
          <p>{factory.capabilities||"Chưa khai báo năng lực"}</p>
          <p>Địa chỉ: {factory.address||"Chưa khai báo"}</p>
          <p>Liên hệ: {factory.contact||"Chưa khai báo"} · {factory.phone||"—"}</p>
          <h4 className="font-semibold">Lịch jobs được phân bổ ({factoryJobs.length})</h4>
          {factoryJobs.map(j=><button key={j.id} className="block w-full text-left border rounded-lg p-3"
            onClick={()=>{setSelected(j.id);setFactoryDetail(null)}}>
            <strong>{j.orderNo} · {j.sku}</strong><span className="block text-xs text-slate-500">{j.stage} · {dateText(j.start)} – {dateText(j.end)}</span></button>)}
          <p className="text-xs text-amber-700">Công suất xưởng chưa có nguồn dữ liệu cam kết theo ngày nên hệ thống không tự tính % tải giả.</p>
          <Link className="underline" href="/admin/production-suppliers">Mở Supplier / SRM</Link>
        </div>}
      </aside>
    </div>}
  </div>;
}
