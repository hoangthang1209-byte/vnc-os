"use client";

import {useState} from "react";
import VncOsCompanyBrandingForm from "./VncOsCompanyBrandingForm";
import VncCompanyMasterData from "./VncCompanyMasterData";
import styles from "./VncCompanySettingsWorkspace.module.css";

type Props={initial:{logoUrl:string|null;faviconUrl:string|null}};
type Tab="company"|"identity";

export default function VncCompanySettingsWorkspace({initial}:Props){
 const [active,setActive]=useState<Tab>("company");
 return <div className={styles.workspace}>
  <header className={styles.intro}>
   <span className={styles.kicker}>VNC OS / COMPANY SETTINGS</span>
   <h2>Thông tin công ty và nhận diện</h2>
   <p>Một nguồn dữ liệu thống nhất cho Commercial Invoice và các chứng từ VNC. Thay đổi thông tin ở đây không chỉnh sửa chứng từ đã phát hành.</p>
  </header>
  <div className={styles.tabs} role="tablist" aria-label="Các nhóm cấu hình công ty">
   <button type="button" id="vnc-tab-company" role="tab" aria-controls="vnc-panel-company" aria-selected={active==="company"} className={active==="company"?styles.active:""} onClick={()=>setActive("company")}>Pháp nhân & ngân hàng</button>
   <button type="button" id="vnc-tab-identity" role="tab" aria-controls="vnc-panel-identity" aria-selected={active==="identity"} className={active==="identity"?styles.active:""} onClick={()=>setActive("identity")}>Logo & favicon</button>
  </div>
  <section id="vnc-panel-company" role="tabpanel" aria-labelledby="vnc-tab-company" hidden={active!=="company"} className={styles.panel}>
   <VncCompanyMasterData/>
  </section>
  <section id="vnc-panel-identity" role="tabpanel" aria-labelledby="vnc-tab-identity" hidden={active!=="identity"} className={styles.panel}>
   <VncOsCompanyBrandingForm initial={initial}/>
  </section>
 </div>;
}
