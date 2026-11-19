"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import OperationsV9ActionQueue from "./OperationsV9ActionQueue";

type Job = { id:string; trackingId:string; orderId:string; orderNo:string; customer:string;
  orderItemId:string; sku:string; name:string; image:string|null; ordered:number;
  ready:number; progress:number; risk:string; promised:string|null;
  batch:string|null; stage:string; factoryId:string|null; start:string|null;
  end:string|null; done:number; accepted:number; planned:number };
type Factory = { id:string; code:string; name:string; category:string; capabilities:string;
  address:string; contact:string; phone:string };
type Order = {id:string;orderNo:string;customer:string;status:string;due:string|null;
  items:{id:string;sku:string;name:string;quantity:number;image:string|null}[]};
type Documents = { techPacks:{id:string;itemId:string;code:string;title:string;version:number;status:string;bom:string;artwork:string;qc:string}[];
 files:{id:string;itemId:string;type:string;title:string;version:number;status:string}[];
 qc:{id:string;itemId:string;status:string;inspected:number;passed:number;defective:number}[] };
type Section = "orders"|"production"|"factories";
type Group = "order"|"sku"|"factory"|"stage";
type DocTab = "Tech Pack"|"Artwork"|"BOM"|"QC"|"Files";
const date = (s:string|null)=>s?new Date(s).toLocaleDateString("vi-VN"):"Chưa lập lịch";
const day=86400000;
const STAGE_COLORS=["#687d99","#407bd4","#8466d3","#169c7a","#dd9a35","#c7627c","#1692a6"];
function color(stage:string) {const i=/cut|cắt/i.test(stage)?0:/print|in /i.test(stage)?1:/embroider|thêu/i.test(stage)?2:/sew|may/i.test(stage)?3:/qc|kiểm/i.test(stage)?4:/pack|đóng/i.test(stage)?5:6;return STAGE_COLORS[i];}
const jobGroup=(j:Job,group:Group)=>group==="order"?j.orderNo:group==="sku"?j.orderNo+" · "+j.sku:group==="factory"?j.factoryId??"__none__":j.stage;

export default function IntegratedProductionWorkspace({jobs,orders,factories,documents,initialView="orders",initialSearch=""}:{jobs:Job[];orders:Order[];factories:Factory[];documents:Documents;initialView?:Section;initialSearch?:string}) {
 const [section,setSection]=useState<Section>(initialView);
 const [group,setGroup]=useState<Group>("order");
 const [orderSearch,setOrderSearch]=useState("");
 const [productionSearch,setProductionSearch]=useState(initialSearch);
 const [factoryTab,setFactoryTab]=useState<"Schedule"|"Jobs"|"Capacity"|"Quality"|"Profile">("Schedule");
 const [orderFilter,setOrderFilter]=useState("all");
 const [stageFilter,setStageFilter]=useState("all");
 const [riskFilter,setRiskFilter]=useState("all");
 const [expanded,setExpanded]=useState<string[]>([]);
 const [selectedOrder,setSelectedOrder]=useState<string|null>(null);
 const [selectedFactory,setSelectedFactory]=useState<string|null>(null);
 const [selectedJob,setSelectedJob]=useState<string|null>(null);
 const [docTab,setDocTab]=useState<DocTab>("Tech Pack");
 const [horizon,setHorizon]=useState(21);
 const factoriesById=useMemo(()=>new Map(factories.map(f=>[f.id,f])),[factories]);
 const filteredJobs=useMemo(()=>jobs.filter(j=>{
  if(orderFilter!=="all"&&j.orderId!==orderFilter)return false;
  if(stageFilter!=="all"&&j.stage!==stageFilter)return false;
  if(riskFilter==="risk"&&j.risk==="ON_TRACK")return false;
  const q=productionSearch.trim().toLowerCase();
  return !q||[j.orderNo,j.sku,j.name,j.stage,j.batch??"",factoriesById.get(j.factoryId??"")?.name??""].some(t=>t.toLowerCase().includes(q));
 }),[jobs,orderFilter,stageFilter,riskFilter,productionSearch,factoriesById]);
 const grouped=useMemo(()=>{const m=new Map<string,Job[]>();for(const j of filteredJobs){const k=jobGroup(j,group);m.set(k,[...(m.get(k)??[]),j]);}return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0]));},[filteredJobs,group]);
 const openFactory=factories.find(f=>f.id===selectedFactory);
 const openJob=jobs.find(j=>j.id===selectedJob);
 const jobsForFactory=jobs.filter(j=>j.factoryId===selectedFactory);
 const factoryRiskJobs=jobsForFactory.filter(j=>j.risk!=="ON_TRACK");
 const factoryOrders=new Set(jobsForFactory.map(j=>j.orderId)).size;
 const factorySkuCount=new Set(jobsForFactory.map(j=>j.orderItemId)).size;
 const atRisk=new Set(jobs.filter(j=>j.risk!=="ON_TRACK").map(j=>j.orderItemId)).size;
 const uniqueOrders=new Set(jobs.map(j=>j.orderId)).size;
 const uniqueItems=new Set(jobs.map(j=>j.orderItemId)).size;
 const activeFactories=new Set(jobs.map(j=>j.factoryId).filter(Boolean)).size;
 const today=new Date();today.setHours(0,0,0,0);
 const base=today.getTime()-3*day;
 const span=960,cell=span/horizon;
 const timeline=(j:Job)=>{if(!j.start||!j.end)return null;const st=(new Date(j.start).getTime()-base)/day;const en=(new Date(j.end).getTime()-base)/day+1;const l=Math.max(0,st)*cell,r=Math.min(horizon,en)*cell;if(r<=l)return null;return <button key={j.id} className="v9bar" title={j.orderNo+" / "+j.sku+" / "+j.stage} onClick={()=>{setSelectedJob(j.id);setDocTab("Tech Pack");}} style={{left:l,width:Math.max(4,r-l-2),background:color(j.stage)}}><span>{j.stage}</span></button>;};
 const orderJobs=(id:string)=>jobs.filter(j=>j.orderId===id);
 const goProduction=(orderId?:string,sku?:string)=>{setSection("production");setGroup(sku?"sku":"order");setOrderFilter(orderId??"all");setProductionSearch(sku??"");setSelectedOrder(null);setExpanded([]);};
 const header=(eyebrow:string,title:string,subtitle:string,actions?:React.ReactNode)=><header className="v9head"><div><div className="v9eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div><div className="v9actions">{actions}</div></header>;
 const orderItems=(o:Order)=><div className="v9items">{o.items.map(i=><div className="v9item" key={i.id}>
  {i.image?<img alt="" src={i.image}/>:<div className="v9itemplaceholder">SKU</div>}
  <div className="v9iteminfo"><strong>{i.name||i.sku}</strong><span>{i.sku} · {i.quantity.toLocaleString("vi-VN")} pcs</span></div>
  <button className="v9link" onClick={()=>goProduction(o.id,i.sku)}>Xem timeline SKU →</button>
 </div>)}</div>;
 const metric=(title:string,n:number,sub:string,warn=false)=><div className="v9metric"><span>{title}</span><strong style={warn?{color:"#d85151"}:undefined}>{n}</strong><small>{sub}</small></div>;
 const factoryCard=(f:Factory)=><button key={f.id} className="v9factorycard" onClick={()=>{setSelectedFactory(f.id);setFactoryTab("Schedule");}}>
  <span className="v9factoryicon">▨</span><strong>{f.name}</strong><small>{f.code} · {f.category}</small>
  <p>{f.capabilities||"Chưa khai báo năng lực"}</p>
  <div className="v9factorybottom"><span>{jobs.filter(j=>j.factoryId===f.id).length} jobs</span><span>Xem Factory 360 →</span></div>
 </button>;
 return <div className="vncops">
 <style>{`
 .vncops{--ink:#17253a;--muted:#6b7b90;--line:#e1e7ef;--navy:#14233a;--blue:#2563eb;color:var(--ink);font-size:13px;background:#f3f6fa;border-radius:12px;padding:16px;min-height:60vh}
 .vncops *{box-sizing:border-box}.v9shell{display:block}
 .v9localnav{display:flex;align-items:center;flex-wrap:wrap;gap:7px;margin-bottom:18px;background:white;border:1px solid #e1e7ef;border-radius:10px;padding:9px}
 .v9navitem{width:auto;border:0;background:#f0f4f9;color:#405670;font-weight:700;padding:10px 13px;border-radius:7px;cursor:pointer;font-size:12px}
 .v9navitem.active{background:#233d65;color:#fff}.v9navitem:hover{background:#dbe7f6;color:#16375a}.v9navitem.active:hover{background:#233d65;color:#fff}
 .v9navhint{font-size:10px;color:#71829a;margin-left:auto}
 .v9content{min-width:0}.v9head{display:flex;justify-content:space-between;align-items:center;gap:15px;margin:7px 0 20px}.v9eyebrow{font-size:10px;letter-spacing:1.1px;font-weight:750;color:#58749e}
 .v9head h1{font-size:26px;font-weight:800;letter-spacing:-.7px;margin:3px 0 4px}.v9head p{color:var(--muted);font-size:12px}.v9actions{display:flex;flex-wrap:wrap;gap:8px}
 .v9btn{background:white;border:1px solid #d5deea;border-radius:8px;padding:9px 13px;font-weight:650;color:#2e415f;cursor:pointer;white-space:nowrap}
 .v9btn.primary{color:white;background:#2563eb;border-color:#2563eb}.v9btn:disabled{opacity:.5;cursor:default}
 .v9metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:18px}
 .v9metric{min-height:98px;padding:15px;background:white;border:1px solid var(--line);border-radius:12px;box-shadow:0 2px 6px #273b5808;display:flex;flex-direction:column;gap:5px}
 .v9metric span{font-size:11px;font-weight:650;color:#677990}.v9metric strong{font-size:26px;line-height:1.1}.v9metric small{font-size:10px;color:#8795a7}
 .v9panel{background:white;border:1px solid var(--line);border-radius:12px;box-shadow:0 2px 8px #24395508;margin-bottom:16px;overflow:hidden}
 .v9panelpad{padding:17px}.v9panelhead{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding:16px 18px}
 .v9panelhead strong{font-size:15px}.v9hint{font-size:11px;color:var(--muted)}.v9switches{display:flex;gap:4px;flex-wrap:wrap}
 .v9switch{border:0;background:#eff3f8;padding:9px 11px;border-radius:8px;color:#475a72;font-size:11px;font-weight:700;cursor:pointer}
 .v9switch.active{background:#182740;color:white}
 .v9filters{padding:13px 16px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;border-bottom:1px solid var(--line)}
 .v9filters input,.v9filters select{font:inherit;background:#fff;color:var(--ink);min-width:120px;padding:9px;border:1px solid #d6e0ea;border-radius:8px;max-width:100%}
 .v9filters input{min-width:170px;flex:1}.v9filters .v9btn{font-size:11px;padding:9px}
 .v9legend{display:flex;flex-wrap:wrap;gap:14px;padding:11px 17px;color:var(--muted);font-size:10px}.v9legend i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px}
 .v9ganttwrap{overflow-x:auto}.v9gantt{min-width:1190px}.v9grow{display:grid;grid-template-columns:230px 960px;border-bottom:1px solid #edf0f5;min-height:39px;align-items:stretch}
 .v9glabel{text-align:left;border:0;background:transparent;display:flex;align-items:center;gap:7px;padding:10px 13px;font-weight:650;font-size:11px;color:#2b405a;cursor:pointer;overflow:hidden}
 .v9glabel>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.v9subrow .v9glabel{font-weight:500;padding-left:28px;color:#60738a}
 .v9gridcell{position:relative;height:100%;min-height:39px;background:repeating-linear-gradient(90deg,transparent,transparent calc(var(--cell) - 1px),#e6ecf3 calc(var(--cell) - 1px),#e6ecf3 var(--cell))}
 .v9bar{position:absolute;top:10px;height:18px;border:0;border-radius:5px;cursor:pointer;color:white;text-align:left;font-size:10px;font-weight:700;overflow:hidden;white-space:nowrap;padding:2px 6px}
 .v9ghead{font-size:10px;color:#71819b;background:#f7f9fc}.v9day{position:absolute;top:9px;text-align:center;font-size:10px;color:#7588a0}
 .v9empty{min-height:90px;display:flex;align-items:center;justify-content:center;color:#8392a7;font-size:12px;padding:18px;text-align:center}
 .v9footnote{padding:10px 17px;color:#8190a4;font-size:10px}.v9twocol{display:grid;grid-template-columns:1fr 1fr;gap:15px}
 .v9subheading{font-weight:760;font-size:14px;margin-bottom:12px}.v9placeholder{border:1px dashed #d9e1eb;border-radius:9px;padding:20px;text-align:center;color:#8796aa;font-size:12px}
 .v9orders{display:grid;gap:12px}.v9order{border:1px solid #e1e8f1;background:white;border-radius:12px;padding:16px}
 .v9ordertop{display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap}.v9orderid{color:#1f56a0;font-weight:800;font-size:14px}
 .v9ordername{font-size:15px;font-weight:700;margin-top:3px}.v9orderstat{font-size:11px;color:#74869d}
 .v9orderbadges{display:flex;gap:8px;flex-wrap:wrap}.v9pill{background:#eff4f9;border:1px solid #dde6f0;padding:6px 9px;border-radius:6px;font-size:10px;font-weight:750;color:#54677f}
 .v9orderbottom{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:14px;border-top:1px solid #eef2f7;padding-top:12px;flex-wrap:wrap}
 .v9link{color:#2563eb;border:0;background:transparent;font-weight:700;font-size:11px;cursor:pointer;text-align:left}
 .v9items{padding:10px 0}.v9item{display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid #eef2f7}
 .v9item img,.v9itemplaceholder{height:44px;width:44px;border:1px solid #e5eaf1;border-radius:7px;object-fit:cover;flex-shrink:0}
 .v9itemplaceholder{background:#eff3f8;display:grid;place-items:center;color:#8292a8;font-size:10px}
 .v9iteminfo{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.v9iteminfo strong{font-size:12px}.v9iteminfo span{font-size:10px;color:#7a8ba2}
 .v9factorygrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
 .v9factorycard{border:1px solid #dfe6ee;background:white;border-radius:12px;padding:17px;display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:7px;cursor:pointer;min-height:160px}
 .v9factorycard:hover{border-color:#8fb4e7}.v9factoryicon{font-size:20px;color:#3b6db2}.v9factorycard strong{font-size:13px}
 .v9factorycard small{font-size:10px;color:#8898a9}.v9factorycard p{font-size:11px;color:#62758d;line-height:1.5;flex:1}
 .v9factorybottom{width:100%;display:flex;justify-content:space-between;font-size:10px;color:#3973b9;border-top:1px solid #edf1f6;padding-top:10px}
 .v9drawerbg{position:fixed;inset:0;background:#101c2d6b;z-index:1000;display:flex;justify-content:flex-end}
 .v9drawer{background:#fff;width:min(550px,100%);height:100%;overflow-y:auto;box-shadow:-10px 0 35px #131e3140;padding:22px}
 .v9drawertop{display:flex;justify-content:space-between;gap:10px;align-items:center;border-bottom:1px solid #e8edf3;padding-bottom:16px;margin-bottom:16px}
 .v9drawer h2{font-weight:780;font-size:20px}.v9detailgrid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
 .v9detail{background:#f5f8fc;border:1px solid #edf1f6;border-radius:9px;padding:11px}
 .v9detail small{color:#8293a6;display:block;font-size:10px;margin-bottom:4px}.v9detail strong{font-size:12px;word-break:break-word}
 .v9doctabs{display:flex;flex-wrap:wrap;gap:5px;margin:16px 0}.v9doctabs button{border:1px solid #dde6ee;border-radius:6px;background:#f6f9fc;padding:8px;font-size:11px}
 .v9doctabs button.active{background:#192b47;color:white}.v9docline{padding:11px;border:1px solid #e8edf4;border-radius:8px;margin-bottom:8px;font-size:12px}
 @media(max-width:1200px){.v9metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.v9factorygrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:760px){.vncops{padding:10px}.v9localnav{padding:8px}.v9navitem{width:auto;padding:9px}.v9navhint{width:100%;margin-left:0}.v9head h1{font-size:22px}.v9head{align-items:flex-start;flex-direction:column}.v9metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.v9twocol{grid-template-columns:1fr}.v9factorygrid{grid-template-columns:1fr}}
 `}</style>
 <div className="v9shell">
 <nav className="v9localnav" aria-label="Các màn hình của Điều hành sản xuất V9">
  <button type="button" className={"v9navitem "+(section==="orders"?"active":"")} onClick={()=>setSection("orders")}>Đơn hàng & SKU</button>
  <button type="button" className={"v9navitem "+(section==="production"?"active":"")} onClick={()=>setSection("production")}>Tiến độ & Gantt</button>
  <button type="button" className={"v9navitem "+(section==="factories"?"active":"")} onClick={()=>setSection("factories")}>Factory Management</button>
  <span className="v9navhint">Các tính năng chỉnh sửa vẫn nằm trong trang nghiệp vụ hiện có.</span>
 </nav>
 <main className="v9content">
 {section==="orders"&&<>
  {header("VNC OS V9 · ORDERS & OPERATIONS","Order Portfolio","Danh sách đơn hàng kết nối SKU, Production Jobs và Factory",<button className="v9btn" onClick={()=>goProduction()}>Mở Production Timeline →</button>)}
  <div className="v9metrics">{metric("Đơn hàng",orders.length,"Đọc từ Orders")}{metric("SKU trong danh sách",orders.reduce((n,o)=>n+o.items.length,0),"Order Lines")}{metric("Đang có Production Jobs",uniqueOrders,"Có stage/batch")}{metric("Production Jobs",jobs.length,"Stage/batch được lập")}{metric("SKU cần chú ý",atRisk,"Theo trạng thái rủi ro",atRisk>0)}</div>
  <section className="v9panel v9panelpad"><div className="v9panelhead" style={{padding:"0 0 14px",marginBottom:14}}><strong>Order Directory</strong><span className="v9hint">Tối đa 200 đơn theo quyền · Read-only</span></div>
  <div className="v9filters" style={{padding:"0 0 14px",borderBottom:0}}><input aria-label="Tìm đơn hàng" placeholder="⌕ Tìm mã đơn hàng, khách hàng hoặc SKU..." value={orderSearch} onChange={e=>setOrderSearch(e.target.value)}/></div>
  <div className="v9orders">{orders.filter(o=>[o.orderNo,o.customer,...o.items.map(i=>i.sku)].some(x=>x.toLowerCase().includes(orderSearch.toLowerCase()))).map(o=><div className="v9order" key={o.id}>
   <div className="v9ordertop"><div><div className="v9orderid">{o.orderNo}</div><div className="v9ordername">{o.customer||"Chưa có tên khách hàng"}</div><div className="v9orderstat">Deadline: {date(o.due)}</div></div><div className="v9orderbadges"><span className="v9pill">{o.status}</span><span className="v9pill">{o.items.length} SKU</span><span className="v9pill">{orderJobs(o.id).length} jobs</span></div></div>
   {selectedOrder===o.id&&orderItems(o)}
   <div className="v9orderbottom"><button className="v9link" onClick={()=>setSelectedOrder(selectedOrder===o.id?null:o.id)}>{selectedOrder===o.id?"▾ Ẩn SKU":"▸ Xem SKU / Order Detail"}</button><button className="v9btn" onClick={()=>goProduction(o.id)}>Xem Production Gantt →</button></div>
  </div>)}</div>
  {!orders.length&&<div className="v9empty">Chưa có đơn hàng trong phạm vi được phép xem.</div>}
  </section>
 </>}
 {section==="production"&&<>
  {header("VNC OS V9 · OPERATIONS COMMAND","Production Control Center","Master timeline theo Order, SKU, công đoạn và Factory — dữ liệu VNC OS thực",
    <><Link href="/admin/manufacturing/production-timeline" className="v9btn">Cập nhật tiến độ</Link><button className="v9btn primary" disabled title="Chức năng tạo Job mới cần API và quyền ghi">＋ Tạo Production Job</button></>)}
  <div className="v9metrics">{metric("Đơn có lịch sản xuất",uniqueOrders,"Có stage/batch")}{metric("SKU đang theo dõi",uniqueItems,"Có record sản xuất")}{metric("Production Jobs",jobs.length,"Nhóm stage / batch")}{metric("Jobs có rủi ro",jobs.filter(j=>j.risk!=="ON_TRACK").length,"Theo tracking",true)}{metric("Factory được giao",activeFactories,"Theo Supplier hiện có")}</div>
  <section className="v9panel">
   <div className="v9panelhead"><div><strong>Master Production Timeline</strong><div className="v9hint">Chọn góc nhìn để điều phối toàn bộ portfolio</div></div><div className="v9switches">{([["order","Theo đơn hàng"],["sku","Theo SKU"],["factory","Theo Factory"],["stage","Theo công đoạn"]] as const).map(([id,label])=><button key={id} className={"v9switch "+(group===id?"active":"")} onClick={()=>{setGroup(id);setExpanded([]);}}>{label}</button>)}</div></div>
   <div className="v9filters"><input aria-label="Tìm Production Jobs" placeholder="⌕ Tìm SKU / Factory / công đoạn..." value={productionSearch} onChange={e=>setProductionSearch(e.target.value)}/><select aria-label="Lọc đơn hàng" value={orderFilter} onChange={e=>setOrderFilter(e.target.value)}><option value="all">Tất cả đơn hàng</option>{orders.map(o=><option value={o.id} key={o.id}>{o.orderNo}</option>)}</select><select aria-label="Lọc công đoạn" value={stageFilter} onChange={e=>setStageFilter(e.target.value)}><option value="all">Tất cả công đoạn</option>{[...new Set(jobs.map(j=>j.stage))].sort().map(k=><option key={k}>{k}</option>)}</select><select aria-label="Lọc rủi ro" value={riskFilter} onChange={e=>setRiskFilter(e.target.value)}><option value="all">Mọi trạng thái</option><option value="risk">Nguy cơ trễ</option></select><select aria-label="Ngày hiển thị" value={horizon} onChange={e=>setHorizon(Number(e.target.value))}><option value={14}>14 ngày</option><option value={21}>21 ngày</option><option value={35}>35 ngày</option></select><button className="v9btn" onClick={()=>setExpanded([])}>Thu gọn</button><button className="v9btn" onClick={()=>setExpanded(grouped.map(x=>x[0]))}>Mở rộng</button><span className="v9hint">{filteredJobs.length} jobs</span></div>
   <div className="v9legend">{["Cắt","In","Thêu","May","QC","Đóng gói","Khác"].map((s,i)=><span key={s}><i style={{background:STAGE_COLORS[i]}}/>{s}</span>)}</div>
   <div className="v9ganttwrap"><div className="v9gantt">
    <div className="v9grow v9ghead"><div className="v9glabel">ĐƠN HÀNG / SKU / JOB</div><div className="v9gridcell" style={{["--cell" as string]:cell+"px",height:34}}>{Array.from({length:horizon},(_,i)=><div className="v9day" key={i} style={{left:i*cell,width:cell}}>{new Date(base+i*day).getDate()}</div>)}</div></div>
    {grouped.map(([key,rows])=><div key={key}><div className="v9grow"><button className="v9glabel" title={key} onClick={()=>setExpanded(a=>a.includes(key)?a.filter(k=>k!==key):[...a,key])}><span>{expanded.includes(key)?"▾":"▸"} {group==="factory"?factoriesById.get(key)?.name??"Chưa gán Factory":key} ({rows.length})</span></button><div className="v9gridcell" style={{["--cell" as string]:cell+"px"}}>{rows.map(timeline)}</div></div>{expanded.includes(key)&&rows.map(j=><div className="v9grow v9subrow" key={j.id}><button className="v9glabel" onClick={()=>setSelectedJob(j.id)} title={j.sku+" / "+j.stage}><span>{j.sku} · {j.stage}</span></button><div className="v9gridcell" style={{["--cell" as string]:cell+"px"}}>{timeline(j)}</div></div>)}</div>)}
    {(group==="order"||group==="sku")&&orders.filter(o=>(orderFilter==="all"||orderFilter===o.id)&&!orderJobs(o.id).length&&(!productionSearch||[o.orderNo,o.customer,...o.items.map(i=>i.sku)].some(x=>x.toLowerCase().includes(productionSearch.toLowerCase())))).map(o=>
      <div className="v9grow" key={"unplanned-"+o.id}>
        <button className="v9glabel" onClick={()=>{setSection("orders");setSelectedOrder(o.id);}} title="Chưa có Production Stage">
          <span>◇ {o.orderNo} · {o.items.length} SKU</span>
        </button>
        <div className="v9gridcell" style={{["--cell" as string]:cell+"px",display:"flex",alignItems:"center"}}>
          <span style={{fontSize:10,paddingLeft:12,color:"#8795a7"}}>Chưa lập Production Jobs · <Link href={"/admin/production/plan?search="+encodeURIComponent(o.orderNo)} style={{color:"#2563eb",textDecoration:"underline"}}>Mở kế hoạch sản xuất</Link></span>
        </div>
      </div>)}
   </div></div>
   {!grouped.length&&!orders.length&&<div className="v9empty">Không có dữ liệu sản xuất trong phạm vi được phép xem.</div>}
   <div className="v9footnote">Các thanh màu biểu diễn lịch dự kiến của stage có ngày bắt đầu và kết thúc. Nhấp vào thanh để mở Job Detail. Bộ lọc và KPI dùng dữ liệu được phép xem, không phải tổng toàn hệ thống.</div>
  </section>
  <OperationsV9ActionQueue />
  <div className="v9twocol"><div className="v9panel v9panelpad"><h3 className="v9subheading">Factory Capacity</h3><div className="v9placeholder">Chưa có công suất cam kết theo ngày. Không thể tính tỷ lệ tải Factory chính xác từ số Jobs.</div><button className="v9link" style={{marginTop:12}} onClick={()=>setSection("factories")}>Mở Factory Management →</button></div><div className="v9panel v9panelpad"><h3 className="v9subheading">Production Alerts</h3>{jobs.filter(j=>j.risk!=="ON_TRACK").slice(0,6).map(j=><button key={j.id} className="v9docline" style={{display:"block",width:"100%",textAlign:"left"}} onClick={()=>setSelectedJob(j.id)}>{j.orderNo} · {j.sku} · {j.risk}</button>)}{!atRisk&&<div className="v9placeholder">Không có cảnh báo trên các tracking được tải. Chưa xác minh độ đầy đủ của dữ liệu lập lịch.</div>}</div></div>
 </>}
 {section==="factories"&&<>
  {header("VNC OS V9 · PRODUCTION / SRM","Factory Management","Factory Directory · Schedule · Jobs · Capacity · Quality · Costing",<Link className="v9btn" href="/admin/production-suppliers">Quản lý SRM</Link>)}
  <div className="v9metrics">{metric("Đối tác đang hoạt động",factories.length,"SRM theo quyền")}{metric("Factory tham gia Jobs",activeFactories,"Theo stage đã gán")}{metric("Production Jobs",jobs.length,"Danh sách được tải")}{metric("Jobs rủi ro",jobs.filter(j=>j.risk!=="ON_TRACK").length,"Theo tracking",true)}{metric("Factory Capacity",0,"Chưa có dữ liệu công suất")}</div>
  <section className="v9panel v9panelpad"><div className="v9panelhead" style={{padding:"0 0 15px",marginBottom:16}}><strong>Factory Directory</strong><span className="v9hint">Đối tác từ SRM · chưa phải entity Factory độc lập</span></div><div className="v9factorygrid">{factories.map(factoryCard)}</div>{!factories.length&&<div className="v9empty">Chưa có Factory/Supplier trong phạm vi truy cập.</div>}</section>
 </>}
 </main></div>
 {(openJob||openFactory)&&<div className="v9drawerbg" onMouseDown={()=>{setSelectedJob(null);setSelectedFactory(null);}}><aside className="v9drawer" role="dialog" aria-modal="true" aria-label={openFactory?"Factory 360":"Production Job Detail"} onMouseDown={e=>e.stopPropagation()}>
  <div className="v9drawertop"><div><div className="v9eyebrow">VNC OS V9 · {openFactory?"FACTORY 360":"PRODUCTION JOB"}</div><h2>{openFactory?.name??openJob?.name}</h2></div><button className="v9btn" onClick={()=>{setSelectedJob(null);setSelectedFactory(null)}} aria-label="Đóng">✕</button></div>
  {openFactory&&<><div className="v9detailgrid">{[["Mã đối tác",openFactory.code],["Nhóm",openFactory.category],["Năng lực",openFactory.capabilities||"Chưa khai báo"],["Liên hệ",openFactory.contact||"Chưa khai báo"],["Điện thoại",openFactory.phone||"Chưa khai báo"],["Địa chỉ",openFactory.address||"Chưa khai báo"]].map(([a,b])=><div className="v9detail" key={a}><small>{a}</small><strong>{b}</strong></div>)}</div><div className="v9detailgrid" style={{marginTop:14}}>{[["Orders",factoryOrders],["SKU",factorySkuCount],["Stage Jobs",jobsForFactory.length],["Jobs cần chú ý",factoryRiskJobs.length]].map(([label,value])=><div className="v9detail" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
  <div className="v9doctabs">{(["Schedule","Jobs","Capacity","Quality","Profile"] as const).map(t=><button key={t} className={factoryTab===t?"active":""} onClick={()=>setFactoryTab(t)}>{t}</button>)}</div>
  {(factoryTab==="Schedule"||factoryTab==="Jobs")&&<><h3 className="v9subheading">{factoryTab==="Schedule"?"Factory Production Schedule":"All Production Jobs"} ({jobsForFactory.length})</h3>{jobsForFactory.map(j=><button className="v9docline" style={{display:"block",width:"100%",textAlign:"left",cursor:"pointer"}} key={j.id} onClick={()=>{setSelectedFactory(null);setSelectedJob(j.id)}}><strong>{j.orderNo} · {j.sku}</strong><div className="v9hint">{j.stage} · {date(j.start)} – {date(j.end)} · {j.done}/{j.planned} hoàn thành</div></button>)}{!jobsForFactory.length&&<div className="v9placeholder">Chưa có Production Job được gán cho đối tác này.</div>}<button className="v9btn" onClick={()=>{setSelectedFactory(null);setSection("production");setGroup("factory");setOrderFilter("all");setProductionSearch(openFactory.name);}}>Xem trên Master Gantt →</button></>}
  {factoryTab==="Capacity"&&<div className="v9placeholder">Chưa có dữ liệu công suất cam kết theo ngày và công đoạn từ Factory. Không tính % sử dụng bằng số lượng jobs. Cần bổ sung Capacity Calendar và phân bổ theo dây chuyền.</div>}
  {factoryTab==="Quality"&&<><div className="v9detailgrid">{[["Jobs có cảnh báo",factoryRiskJobs.length],["Số stage có lượng QC đạt",jobsForFactory.filter(j=>j.accepted>0).length]].map(([label,value])=><div className="v9detail" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><div className="v9placeholder" style={{marginTop:12}}>Các số liệu trên là số lượng stage, không phải QC pass rate của Factory. Tỷ lệ lỗi theo xưởng cần dữ liệu nghiệm thu và mẫu số được xác nhận.</div></>}
  {factoryTab==="Profile"&&<div className="v9placeholder">Hồ sơ hiển thị dữ liệu Supplier từ SRM. Factory là địa điểm/năng lực sản xuất độc lập sẽ được liên kết sau khi bổ sung schema.</div>}</>}
  {openJob&&<>{openJob.image&&<img src={openJob.image} alt={"Hình minh họa "+openJob.sku} style={{width:118,height:118,objectFit:"cover",borderRadius:9,border:"1px solid #dde6f0",marginBottom:14}}/>}<div className="v9detailgrid">{[["Order",openJob.orderNo],["SKU",openJob.sku],["Stage",openJob.stage],["Batch",openJob.batch??"SKU"],["Factory",factoriesById.get(openJob.factoryId??"")?.name??"Chưa phân công"],["Kế hoạch",date(openJob.start)+" – "+date(openJob.end)],["Số lượng",openJob.done+" / "+openJob.planned],["QC đã đạt",String(openJob.accepted)],["Hạn giao",date(openJob.promised)],["Risk",openJob.risk]].map(([a,b])=><div className="v9detail" key={a}><small>{a}</small><strong>{b}</strong></div>)}</div>
  <div className="v9doctabs">{(["Tech Pack","Artwork","BOM","QC","Files"] as const).map(t=><button className={docTab===t?"active":""} key={t} onClick={()=>setDocTab(t)}>{t}</button>)}</div>
  {docTab==="Tech Pack"&&documents.techPacks.filter(t=>t.itemId===openJob.orderItemId).map(t=><div className="v9docline" key={t.id}><strong>{t.code} · {t.title}</strong><div className="v9hint">v{t.version} · {t.status}</div></div>)}
  {docTab==="Artwork"&&<>{documents.techPacks.filter(t=>t.itemId===openJob.orderItemId&&t.artwork).map(t=><div className="v9docline" key={t.id}>{t.artwork}</div>)}{documents.files.filter(t=>t.itemId===openJob.orderItemId&&/ART|PRINT|EMBROID/i.test(t.type)).map(t=><div className="v9docline" key={t.id}>{t.title} · v{t.version}</div>)}</>}
  {docTab==="BOM"&&documents.techPacks.filter(t=>t.itemId===openJob.orderItemId).map(t=><div className="v9docline" key={t.id}>{t.bom||"Chưa có ghi chú BOM"}</div>)}
  {docTab==="QC"&&documents.qc.filter(t=>t.itemId===openJob.orderItemId).map(t=><div className="v9docline" key={t.id}>{t.status} · Kiểm: {t.inspected} · Đạt: {t.passed} · Lỗi: {t.defective}</div>)}
  {docTab==="Files"&&documents.files.filter(t=>t.itemId===openJob.orderItemId).map(t=><div className="v9docline" key={t.id}>{t.title} · {t.type} · v{t.version}</div>)}
  {((docTab==="Tech Pack"&&!documents.techPacks.some(t=>t.itemId===openJob.orderItemId))||(docTab==="Artwork"&&!documents.techPacks.some(t=>t.itemId===openJob.orderItemId&&t.artwork)&&!documents.files.some(t=>t.itemId===openJob.orderItemId&&/ART|PRINT|EMBROID/i.test(t.type)))||(docTab==="BOM"&&!documents.techPacks.some(t=>t.itemId===openJob.orderItemId))||(docTab==="QC"&&!documents.qc.some(t=>t.itemId===openJob.orderItemId))||(docTab==="Files"&&!documents.files.some(t=>t.itemId===openJob.orderItemId)))&&<div className="v9placeholder">Chưa có dữ liệu {docTab} liên kết với SKU này.</div>}
  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:16}}><Link className="v9btn" href={"/admin/orders?search="+encodeURIComponent(openJob.orderNo)}>Mở Order</Link><Link className="v9btn primary" href={"/admin/production/jobs/"+encodeURIComponent(openJob.orderItemId)}>Mở Production Job</Link><Link className="v9btn" href="/admin/manufacturing/production-timeline">Cập nhật Stage</Link>{openJob.factoryId&&<button className="v9btn" onClick={()=>{setSelectedJob(null);setSelectedFactory(openJob.factoryId)}}>Mở Factory 360</button>}</div></>}
 </aside></div>}
 </div>;
}
