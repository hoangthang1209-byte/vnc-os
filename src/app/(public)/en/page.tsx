import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "ATTD | Blank Apparel Wholesale & Corporate Uniforms in Vietnam",
  description: "ATTD supports B2B buyers in Vietnam and internationally with blank T-shirts, polos, corporate uniforms and apparel sourcing.",
  alternates: { canonical: "/en", languages: { vi: "/", en: "/en" } },
};
const offers = [
  { title: "Blank T-shirts & Polos", detail: "Explore fabrics, colors, fits and wholesale quantities.", href: "/nguon-hang-ao-tron" },
  { title: "Corporate Uniforms", detail: "Uniform programs with sizing, customization and delivery planning.", href: "/dong-phuc-doanh-nghiep" },
  { title: "Apparel OEM / Private Label", detail: "Product specification, sampling, branding and production sourcing.", href: "/oem" },
];
export default function EnglishHome() {
  return <main className="attd-v2-en" lang="en">
    <section className="attd-v2-en__hero"><div className="container">
      <div className="attd-v2-en__top"><span>ATTD / B2B APPAREL SOURCING</span><Link href="/" hrefLang="vi" lang="vi">VN / EN</Link></div>
      <p className="attd-v2-en__eyebrow">Vietnam · Serving domestic & international buyers</p>
      <h1>Reliable blank apparel supply.<br/><em>Built for business.</em></h1>
      <p>From blank T-shirts and polos to custom uniforms and private-label programs, ATTD helps B2B buyers source apparel with clear specifications, quantities and delivery plans.</p>
      <div className="attd-v2-en__actions"><Link href="/lien-he">Request a quotation ↗</Link><Link href="/san-pham">Browse products ↗</Link></div>
      <p className="attd-v2-en__notice">English overview preview. Product catalog and quotation forms currently remain in Vietnamese while translation is underway.</p>
    </div></section>
    <section className="container attd-v2-en__offers"><span>OUR SOLUTIONS</span><h2>Start with your sourcing needs.</h2><div>{offers.map((offer,i)=><article key={offer.title}><small>0{i+1}</small><h3>{offer.title}</h3><p>{offer.detail}</p><Link href={offer.href}>Explore ↗</Link></article>)}</div></section>
    <style>{`
      .attd-v2-en{background:#fafbf8;color:#19332a}.attd-v2-en__hero{background:#172d24;color:white;padding:64px 0 100px}.attd-v2-en__top{display:flex;justify-content:space-between;gap:20px;font-size:12px;letter-spacing:.08em;font-weight:700}.attd-v2-en__top a{color:#e3f7ce}.attd-v2-en__eyebrow{font-size:13px;color:#d0e0c7;margin-top:100px;letter-spacing:.14em}.attd-v2-en h1{font-size:clamp(44px,6.5vw,100px);line-height:1.05;letter-spacing:-.06em;max-width:1120px;margin:28px 0}.attd-v2-en h1 em{font-style:normal;color:#c8e3a8}.attd-v2-en__hero p:not(.attd-v2-en__eyebrow):not(.attd-v2-en__notice){max-width:700px;font-size:clamp(17px,2vw,22px);line-height:1.7}.attd-v2-en__actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:35px}.attd-v2-en__actions a{background:#c8e3a8;color:#19332a;padding:15px 25px;border-radius:50px;font-weight:750}.attd-v2-en__actions a+a{background:transparent;color:#fff;border:1px solid #6b8175}.attd-v2-en__notice{font-size:12px;color:#c1cec2;margin-top:45px;max-width:650px}.attd-v2-en__offers{padding-top:90px;padding-bottom:110px}.attd-v2-en__offers>span{font-size:12px;letter-spacing:.1em;font-weight:800}.attd-v2-en__offers h2{font-size:clamp(35px,4vw,64px);letter-spacing:-.05em}.attd-v2-en__offers>div{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.attd-v2-en__offers article{border:1px solid #d3ded3;padding:35px;background:white}.attd-v2-en__offers h3{font-size:26px}.attd-v2-en__offers p{color:#566c60}.attd-v2-en__offers article a{font-weight:750}@media(max-width:760px){.attd-v2-en__offers>div{grid-template-columns:1fr}.attd-v2-en__hero{padding:35px 0 65px}.attd-v2-en__eyebrow{margin-top:65px}}
    `}</style>
  </main>;
}
