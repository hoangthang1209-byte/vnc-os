"use client";
import {useMemo,useState,type ReactNode} from "react";
type Column<T>={key:string;label:string;render:(row:T)=>ReactNode;searchText?:(row:T)=>string};
export default function AdminDataWorkspace<T extends {id:string|number}>({title,description,rows,columns,actions,emptyLabel="Không có dữ liệu",pageSize=20}:{title:string;description?:string;rows:T[];columns:Column<T>[];actions?:ReactNode;emptyLabel?:string;pageSize?:number}){
 const [query,setQuery]=useState("");const [sort,setSort]=useState<string|null>(null);const [desc,setDesc]=useState(false);const [page,setPage]=useState(1);
 const filtered=useMemo(()=>{const q=query.trim().toLocaleLowerCase("vi");const result=rows.filter(row=>!q||columns.some(c=>(c.searchText?.(row)??String(c.render(row)??"")).toLocaleLowerCase("vi").includes(q)));if(sort){const col=columns.find(c=>c.key===sort);if(col)result.sort((a,b)=>{const left=col.searchText?.(a)??String(col.render(a)??"");const right=col.searchText?.(b)??String(col.render(b)??"");return left.localeCompare(right,"vi",{numeric:true})*(desc?-1:1);});}return result;},[rows,columns,query,sort,desc]);
 const pages=Math.max(1,Math.ceil(filtered.length/pageSize));const current=Math.min(page,pages);
 return <section className="vnc-data-workspace" aria-label={title}>
  <div className="vnc-data-workspace__header"><div><h2>{title}</h2>{description&&<p>{description}</p>}</div><div className="vnc-data-workspace__actions">{actions}</div></div>
  <div className="vnc-data-workspace__toolbar"><label><span className="sr-only">Tìm kiếm {title}</span><input type="search" placeholder="Tìm kiếm trong danh sách…" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/></label><span role="status">{filtered.length.toLocaleString("vi-VN")} kết quả</span></div>
  <div className="vnc-data-workspace__scroll"><table><thead><tr>{columns.map(c=><th key={c.key} scope="col"><button type="button" onClick={()=>{setDesc(sort===c.key?!desc:false);setSort(c.key);}} aria-label={"Sắp xếp theo "+c.label}>{c.label} {sort===c.key?(desc?"↓":"↑"):"↕"}</button></th>)}</tr></thead><tbody>{filtered.slice((current-1)*pageSize,current*pageSize).map(row=><tr key={row.id}>{columns.map(c=><td key={c.key}>{c.render(row)}</td>)}</tr>)}{!filtered.length&&<tr><td colSpan={columns.length}>{emptyLabel}</td></tr>}</tbody></table></div>
  <footer className="vnc-data-workspace__footer"><span>Trang {current}/{pages}</span><div><button type="button" disabled={current<=1} onClick={()=>setPage(p=>p-1)}>Trước</button><button type="button" disabled={current>=pages} onClick={()=>setPage(p=>p+1)}>Sau</button></div></footer>
 </section>;
}
