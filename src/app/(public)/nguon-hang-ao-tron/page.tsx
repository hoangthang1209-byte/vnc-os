import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nguồn áo thun trơn sỉ & đồng phục B2B | ATTD",
  description: "Tìm nguồn áo thun trơn, polo, áo khoác, hàng may mặc sỉ và đồng phục doanh nghiệp. Yêu cầu báo giá theo số lượng với ATTD.",
  robots: { index: true, follow: true },
};

const categories = [
  { id: "01", title: "Áo thun trơn", subtitle: "Blank T-shirts", body: "Nguồn áo cơ bản cho đại lý, xưởng in/thêu và đơn hàng doanh nghiệp.", detail: "Chất liệu · form · size · màu · số lượng" },
  { id: "02", title: "Áo polo trơn", subtitle: "Blank Polos", body: "Lựa chọn polo cho đồng phục, phân phối và các chương trình B2B.", detail: "Kiểu cổ · vải · bảng size · phối màu" },
  { id: "03", title: "Áo khoác & sản phẩm khác", subtitle: "Outerwear & essentials", body: "Tư vấn danh mục nguồn hàng theo mục đích sử dụng và thị trường giao nhận.", detail: "Theo brief · kiểm tra khả năng cung ứng" },
  { id: "04", title: "Đồng phục doanh nghiệp", subtitle: "Corporate uniforms", body: "Một đầu mối cho chương trình đồng phục nhân viên, chuỗi cửa hàng và đội ngũ.", detail: "Logo · chia size · in/thêu · kế hoạch giao" },
] as const;

export default function BlankSupplyPage() {
  return (
    <main className="attd-supply">
      <section className="attd-supply__hero">
        <div className="attd-supply__eyebrow">BLANK APPAREL / WHOLESALE / UNIFORMS</div>
        <h1>Nguồn hàng may mặc B2B.<br/><em>Rõ sản phẩm. Rõ nhu cầu.</em></h1>
        <p>ATTD hỗ trợ doanh nghiệp, đại lý và đối tác trong nước lẫn quốc tế tìm nguồn áo trơn, sản phẩm may mặc tiêu chuẩn và đồng phục theo yêu cầu. Mỗi báo giá được xác nhận theo cấu hình và số lượng thực tế.</p>
        <div className="attd-supply__actions"><Link href="/lien-he">Gửi yêu cầu báo giá <span aria-hidden>↗</span></Link><Link href="/san-pham">Khám phá danh mục <span aria-hidden>→</span></Link></div>
        <div className="attd-supply__tags"><span>Bán sỉ B2B</span><span>Đồng phục doanh nghiệp</span><span>Vietnam / International buyers</span></div>
      </section>
      <section className="attd-supply__section" aria-labelledby="supply-title">
        <div className="attd-supply__sectionhead"><div><span>01 / PRODUCT PATHWAYS</span><h2 id="supply-title">Chọn đúng nguồn hàng.</h2></div><p>Từ nhu cầu nhập hàng định kỳ đến chương trình đồng phục: một điểm liên hệ, nhiều hướng triển khai rõ ràng.</p></div>
        <div className="attd-supply__grid">{categories.map(c => <article key={c.id} className="attd-supply__card"><div className="attd-supply__number">{c.id} / {c.subtitle}</div><h3>{c.title}</h3><p>{c.body}</p><div className="attd-supply__detail">{c.detail}</div><Link href="/lien-he">Nhận tư vấn & báo giá ↗</Link></article>)}</div>
      </section>
      <section className="attd-supply__section attd-supply__process"><div><span>02 / HOW WE WORK</span><h2>Đơn hàng rõ ràng từ bước đầu.</h2></div><ol><li>Gửi loại sản phẩm và mục đích sử dụng</li><li>Xác nhận chất liệu, số lượng, màu, size và yêu cầu in/thêu</li><li>Thống nhất phương án, báo giá và lịch giao</li><li>Triển khai theo điều kiện đã xác nhận</li></ol></section>
      <section className="attd-supply__closing"><span>BUILD A RELIABLE SUPPLY PROGRAM</span><h2>Bạn đang tìm nguồn hàng?</h2><p>Cho ATTD biết nhóm sản phẩm, số lượng dự kiến, địa điểm và thời gian cần hàng.</p><Link href="/lien-he">Trao đổi đơn hàng ↗</Link></section>
      <style>{`
        .attd-supply{--ink:#142725;--lime:#d7f05a;--paper:#f5f4ec;background:var(--paper);color:var(--ink);font-family:inherit;min-height:100vh}
        .attd-supply *{box-sizing:border-box}.attd-supply a{text-decoration:none}.attd-supply__nav{display:flex;justify-content:space-between;align-items:center;padding:24px clamp(22px,6vw,100px);border-bottom:1px solid #cbd1c7;background:#f8f8f1}.attd-supply__brand{font-weight:850;font-size:29px;letter-spacing:-.06em;color:var(--ink)}.attd-supply__brand span{font-weight:500;font-size:11px;letter-spacing:.09em}.attd-supply__nav nav{display:flex;align-items:center;gap:28px}.attd-supply__nav nav a{color:var(--ink);font-size:14px;font-weight:650}.attd-supply__navcta{background:var(--ink);color:#fff!important;padding:12px 17px;border-radius:100px}
        .attd-supply__hero{background:#152b28;color:#fff;padding:clamp(68px,10vw,156px) clamp(22px,8vw,130px) 70px;position:relative;overflow:hidden}.attd-supply__hero:after{content:"ATTD";position:absolute;right:-5%;bottom:-16%;font-size:clamp(170px,35vw,600px);font-weight:950;letter-spacing:-.09em;color:#ffffff09;pointer-events:none}.attd-supply__eyebrow,.attd-supply__sectionhead span,.attd-supply__process span,.attd-supply__closing span{font-size:12px;letter-spacing:.18em;font-weight:750}.attd-supply__eyebrow{color:var(--lime)}.attd-supply__hero h1{font-weight:850;font-size:clamp(49px,7vw,108px);letter-spacing:-.068em;line-height:1.03;max-width:1100px;margin:30px 0}.attd-supply__hero h1 em{color:var(--lime);font-style:normal}.attd-supply__hero>p{font-size:clamp(17px,2vw,21px);line-height:1.65;max-width:680px;color:#dae3dd}.attd-supply__actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:35px}.attd-supply__actions a{background:var(--lime);color:var(--ink);font-weight:800;border-radius:100px;padding:16px 23px}.attd-supply__actions a+a{background:transparent;color:white;border:1px solid #7b9086}.attd-supply__tags{display:flex;gap:12px;flex-wrap:wrap;margin-top:75px}.attd-supply__tags span{border-top:1px solid #4d665b;padding-top:12px;font-size:12px;min-width:160px;color:#dce6d7}
        .attd-supply__section{padding:100px clamp(22px,7vw,112px)}.attd-supply__sectionhead{display:flex;align-items:end;justify-content:space-between;gap:40px;margin-bottom:40px}.attd-supply__sectionhead h2,.attd-supply__process h2{font-size:clamp(38px,5vw,72px);letter-spacing:-.06em;line-height:1.1;margin:12px 0}.attd-supply__sectionhead>p{max-width:400px;line-height:1.7;color:#55635c}.attd-supply__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.attd-supply__card{background:#fff;padding:clamp(28px,4vw,56px);min-height:360px;display:flex;align-items:flex-start;flex-direction:column;border:1px solid #dbe0d7}.attd-supply__number{font-size:11px;letter-spacing:.1em;color:#65736e}.attd-supply__card h3{font-size:clamp(28px,3vw,44px);letter-spacing:-.05em;margin:30px 0 12px}.attd-supply__card p{line-height:1.65;color:#52645c;max-width:390px}.attd-supply__detail{font-size:12px;margin-top:auto;padding-top:27px;color:#64766d}.attd-supply__card a{color:var(--ink);font-weight:800;margin-top:16px;border-bottom:1px solid currentColor;padding-bottom:4px}
        .attd-supply__process{background:#dce7db;display:grid;grid-template-columns:1fr 1fr;gap:60px}.attd-supply__process ol{padding-left:30px;margin:0}.attd-supply__process li{padding:18px 0;border-bottom:1px solid #aebfae;font-weight:600}.attd-supply__closing{padding:90px 24px;text-align:center;background:var(--lime)}.attd-supply__closing h2{font-size:clamp(42px,7vw,86px);letter-spacing:-.065em;margin:16px}.attd-supply__closing p{font-size:18px}.attd-supply__closing a{display:inline-block;margin-top:26px;background:var(--ink);color:white;padding:16px 28px;border-radius:40px;font-weight:750}
        @media(max-width:720px){.attd-supply__nav{padding:18px 20px}.attd-supply__nav nav{gap:12px}.attd-supply__nav nav a:not(.attd-supply__navcta){display:none}.attd-supply__hero{padding:70px 22px}.attd-supply__section{padding:65px 22px}.attd-supply__sectionhead,.attd-supply__process{display:block}.attd-supply__grid{grid-template-columns:1fr}.attd-supply__process ol{margin-top:25px}.attd-supply__tags{margin-top:48px}.attd-supply__card{min-height:290px}}
      `}</style>
    </main>
  );
}
