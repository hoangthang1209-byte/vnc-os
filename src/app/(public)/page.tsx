import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/attd-vnc-parity.css";

export const revalidate = 3600;
export const metadata: Metadata = {
 title:"ATTD | B2B Apparel Sourcing, Blank Garments & Corporate Uniforms",
 description:"ATTD chuyên cung ứng áo trơn sỉ, đồng phục doanh nghiệp, gia công OEM/ODM và nguồn hàng may mặc cho khách hàng B2B.",
};
const offers=[
 {n:"01",title:"Áo trơn sỉ",desc:"Blank T-shirts, polo, hoodie, chất liệu, màu và size cho khách hàng B2B.",href:"/nguon-hang-ao-tron"},
 {n:"02",title:"Đồng phục doanh nghiệp",desc:"Phát triển đồng phục theo bộ nhận diện, nhu cầu và số lượng.",href:"/dong-phuc-doanh-nghiep"},
 {n:"03",title:"OEM / Private Label",desc:"Tư vấn chất liệu, form dáng, nhãn riêng, làm mẫu và sản xuất.",href:"/oem"},
 {n:"04",title:"Nguồn hàng may mặc",desc:"Tìm nguồn cung phù hợp cho doanh nghiệp, đại lý và đối tác.",href:"/nguon-hang"},
];
const concepts=[
 {title:"Áo thun trơn & Polo",tag:"BLANK APPAREL",desc:"Các lựa chọn áo cơ bản để xây dựng chương trình mua sỉ và in/thêu.",href:"/nguon-hang-ao-tron"},
 {title:"Đồng phục theo yêu cầu",tag:"CORPORATE UNIFORMS",desc:"Áo đồng phục cho đội ngũ, cửa hàng và các hoạt động doanh nghiệp.",href:"/dong-phuc-doanh-nghiep"},
 {title:"OEM & Private Label",tag:"APPAREL DEVELOPMENT",desc:"Phát triển thiết kế, mẫu, nhãn và bao bì theo yêu cầu dự án.",href:"/oem"},
];
export default function ATTDHome(){
 return <main className="vnc-attd">
 <section className="hero"><div className="shell hero-grid"><div className="hero-copy"><span className="eyebrow">ATTD / VIETNAM / B2B APPAREL SOURCING</span><h1>Apparel solutions.<br/>Built around your business.</h1><p>Áo trơn sỉ, đồng phục doanh nghiệp và phát triển sản phẩm may mặc theo yêu cầu. ATTD hỗ trợ khách hàng Việt Nam và quốc tế từ brief đến phương án cung ứng.</p><div className="actions"><Link href="/lien-he" className="pill">Gửi yêu cầu báo giá ↗</Link><Link href="/san-pham" className="pill secondary">Khám phá sản phẩm</Link></div></div><div className="hero-photo"><div style={{position:"absolute",inset:0,background:"linear-gradient(140deg,#e9e7e3,#a7aea8 55%,#4b5651)"}}/><div style={{position:"absolute",inset:"10% 12%",border:"1px solid #ffffff88",borderRadius:16,display:"grid",placeItems:"center",textAlign:"center",color:"#fff",fontSize:"clamp(42px,6vw,82px)",fontWeight:750,letterSpacing:"-.05em"}}>ATTD<br/><small style={{fontSize:15,letterSpacing:".2em"}}>APPAREL & SOURCING</small></div><span className="photo-label">Visual concept / approved media to follow</span></div></div></section>
 <div className="shell trust-strip"><span>BLANK APPAREL</span><span>CORPORATE UNIFORMS</span><span>OEM / ODM</span><span>B2B SOURCING</span></div>
 <section className="section"><div className="shell"><div className="section-head"><span className="eyebrow">OUR SOLUTIONS</span><h2>Một đối tác. Nhiều giải pháp may mặc B2B.</h2><p>Chọn nhóm nhu cầu của bạn để xem hướng triển khai và gửi yêu cầu phù hợp.</p></div><div className="rowlist">{offers.map(x=><Link key={x.n} href={x.href}><span>{x.n}</span><strong>{x.title}</strong><p>{x.desc}</p><span aria-hidden>↗</span></Link>)}</div></div></section>
 <section className="section soft"><div className="shell"><div className="section-head"><span className="eyebrow">PRODUCT PATHWAYS</span><h2>Khám phá sản phẩm và năng lực của ATTD.</h2><p>Các nhóm sản phẩm minh họa theo nhu cầu cung ứng. Thông số và báo giá được xác nhận theo từng đơn hàng.</p></div><div className="grid">{concepts.map((x,i)=><article className="card" key={x.title}><div className="card-image" style={{background:["linear-gradient(135deg,#dddcd6,#a8a7a0)","linear-gradient(135deg,#d9ddda,#a9b5ad)","linear-gradient(135deg,#ddd9d3,#bfb3aa)"][i]}}><div style={{height:"100%",display:"grid",placeItems:"center",fontFamily:"Manrope,sans-serif",fontSize:34,fontWeight:750,color:"#fff"}}>{["BLANK","UNIFORMS","OEM"][i]}</div></div><div className="card-body"><span className="eyebrow">{x.tag}</span><h3>{x.title}</h3><p>{x.desc}</p><Link href={x.href}>Xem giải pháp ↗</Link></div></article>)}</div><p style={{marginTop:22,fontSize:13,color:"#737875"}}>Hình minh họa đang chờ thư viện ảnh ATTD được duyệt, không đại diện cho hàng có sẵn.</p></div></section>
 <section className="section"><div className="shell"><div className="section-head"><span className="eyebrow">HOW WE WORK</span><h2>Từ nhu cầu đến kế hoạch cung ứng.</h2><p>Quy trình dự án minh bạch để thống nhất sản phẩm, chất lượng và tiến độ.</p></div><div className="grid">{[["01","Gửi brief","Nhu cầu, loại hàng, số lượng và thời gian."],["02","Xây phương án","Chất liệu, quy cách, báo giá và mẫu khi cần."],["03","Triển khai","Sản xuất, kiểm hàng, đóng gói và giao hàng." ]].map(([n,t,d])=><article className="card" key={n}><div className="card-body"><span className="eyebrow">{n}</span><h3>{t}</h3><p>{d}</p></div></article>)}</div></div></section>
 <section className="section dark"><div className="shell cta-row"><div><span className="eyebrow">LET'S BUILD TOGETHER</span><h2>Tell us what you need. We'll source the right solution.</h2><p>Gửi ý tưởng, số lượng và yêu cầu. ATTD sẽ trao đổi phương án phù hợp với dự án của bạn.</p></div><Link href="/lien-he" className="pill secondary">Trao đổi dự án ↗</Link></div></section>
 </main>
}
