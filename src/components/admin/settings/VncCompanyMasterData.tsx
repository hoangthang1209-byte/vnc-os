"use client";
import {useState} from "react";
import Link from "next/link";
import InvoiceIssuerPicker, {type IssuerSelection,type VncIssuerInfo} from "@/components/admin/documents/InvoiceIssuerPicker";
import s from "./VncCompanyMasterData.module.css";

export default function VncCompanyMasterData(){
 const [entityId,setEntityId]=useState("");
 const [bankId,setBankId]=useState("");
 const [entities,setEntities]=useState<VncIssuerInfo[]>([]);
 const selected=entities.find(x=>x.id===entityId)??entities.find(x=>x.isDefault&&x.isActive)??entities.find(x=>x.isActive);
 const activeBank=selected?.bankAccounts.find(x=>x.id===bankId);
 const noRepresentative=entities.filter(x=>x.isActive&&!x.legalRepresentativeName).length;
 function choose(entity:VncIssuerInfo){
  setEntityId(entity.id);
  const bank=entity.bankAccounts.find(x=>x.isDefault&&x.isActive)??entity.bankAccounts.find(x=>x.isActive);
  setBankId(bank?.id??"");
 }
 return <div className={s.root}>
  <header className={s.heading}>
   <div>
    <span className={s.eyebrow}>VNC MASTER DATA / LEGAL & BANKING</span>
    <h2>Hồ sơ pháp nhân</h2>
    <p>Hồ sơ phát hành dùng chung cho hợp đồng, Commercial Invoice và các chứng từ VNC OS.</p>
   </div>
   <Link className={s.contractLink} href="/admin/documents/contracts">Mở Hợp đồng →</Link>
  </header>
  <div className={s.stats}>
   <div><span>Pháp nhân</span><strong>{entities.length}</strong></div>
   <div><span>Đang hoạt động</span><strong>{entities.filter(x=>x.isActive).length}</strong></div>
   <div><span>Chưa có người đại diện</span><strong>{noRepresentative}</strong></div>
  </div>
  <div className={s.workspace}>
   <aside className={s.entities}>
    <div className={s.sectionHeading}><h3>Danh sách pháp nhân</h3><span>{entities.length} hồ sơ</span></div>
    {entities.map(e=><button key={e.id} type="button" className={e.id===selected?.id?s.entityActive:s.entity} onClick={()=>choose(e)}>
     <div className={s.entityTop}><strong>{e.code}</strong><span className={e.isActive?s.active:s.inactive}>{e.isActive?"Hoạt động":"Tạm ngưng"}</span></div>
     <div className={s.entityName}>{e.legalName}</div>
     <div className={s.entityMeta}>{e.taxCode?"MST "+e.taxCode:"Chưa có MST"}</div>
    </button>)}
    {!entities.length&&<p className={s.empty}>Chưa có pháp nhân. Thêm pháp nhân tại khung quản lý bên phải.</p>}
   </aside>
   <div className={s.details}>
    <div className={s.sectionHeading}><h3>Chi tiết pháp nhân</h3>{selected&&<span>{selected.code}</span>}</div>
    {selected&&<>
     <h4>{selected.legalName}</h4>
     <div className={s.factGrid}>
      <div className={s.fact}><span>Mã số thuế</span><strong>{selected.taxCode||"Chưa cập nhật"}</strong></div>
      <div className={s.fact}><span>Email liên hệ</span><strong>{selected.email||"Chưa cập nhật"}</strong></div>
      <div className={s.factWide}><span>Địa chỉ pháp lý</span><strong>{selected.address||"Chưa cập nhật"}</strong></div>
      <div className={s.fact}><span>Người đại diện theo pháp luật</span><strong>{selected.legalRepresentativeName||"Chưa cập nhật"}</strong></div>
      <div className={s.fact}><span>Chức danh</span><strong>{selected.legalRepresentativeTitle||"Chưa cập nhật"}</strong></div>
     </div>
     {!selected.legalRepresentativeName&&<div className={s.warning}>Chưa có người đại diện theo pháp luật. Hãy đối chiếu giấy đăng ký doanh nghiệp trước khi cập nhật và phát hành hợp đồng.</div>}
     <div className={s.bankPanel}>
      <div className={s.sectionHeading}><h3>Ngân hàng & tài khoản nhận tiền</h3><span>{selected.bankAccounts.length} tài khoản</span></div>
      {selected.bankAccounts.length?
       selected.bankAccounts.map(bank=><button key={bank.id} type="button" className={bank.id===(activeBank?.id??selected.bankAccounts.find(x=>x.isDefault)?.id)?s.bankActive:s.bank} onClick={()=>setBankId(bank.id)}>
        <strong>{bank.bankName}</strong><span>{bank.currency||"—"} · {bank.accountNo}</span>
       </button>):
       <p className={s.empty}>Chưa cấu hình tài khoản thanh toán.</p>}
     </div>
    </>}
    <div className={s.editor}>
     <div className={s.sectionHeading}><h3>Quản lý & chỉnh sửa</h3><span>Dữ liệu gốc</span></div>
     <InvoiceIssuerPicker selectedEntityId={selected?.id??entityId} selectedBankId={bankId} canManage useModal
      onDataChange={setEntities}
      onSelect={({entity,account}:IssuerSelection)=>{setEntityId(entity.id);setBankId(account?.id??"");}}/>
    </div>
   </div>
  </div>
  <p className={s.footnote}>Các thay đổi tại đây chỉ áp dụng cho chứng từ tạo mới. Snapshot của Invoice hoặc hợp đồng đã phát hành không bị sửa theo.</p>
 </div>;
}
