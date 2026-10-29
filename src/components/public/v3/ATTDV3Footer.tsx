import Link from "next/link";
const groups = [
 { title:"Sản phẩm",items:[["Áo trơn sỉ","/nguon-hang-ao-tron"],["Danh mục sản phẩm","/san-pham"],["Đồng phục doanh nghiệp","/dong-phuc-doanh-nghiep"]]},
 { title:"Giải pháp",items:[["Nguồn hàng B2B","/nguon-hang"],["OEM / ODM","/oem"],["Yêu cầu báo giá","/lien-he"]]},
 { title:"ATTD",items:[["Giới thiệu","/gioi-thieu"],["Liên hệ","/lien-he"]]},
] as const;
export default function ATTDV3Footer(){return <footer className="a3-footer">
  <div className="a3-shell a3-footer__cta"><div><span>YOUR NEXT APPAREL PARTNER</span><h2>Có nhu cầu đặt hàng sỉ hay đồng phục?</h2><p>Chia sẻ sản phẩm, số lượng và thời gian cần hàng. ATTD sẽ tư vấn phương án phù hợp.</p></div><Link href="/lien-he">Gửi yêu cầu báo giá ↗</Link></div>
  <div className="a3-shell a3-footer__grid"><div className="a3-footer__brand"><Link href="/">ATTD<span>.</span></Link><p>Nguồn hàng may mặc, áo trơn sỉ, đồng phục doanh nghiệp và OEM/ODM cho khách hàng B2B tại Việt Nam và quốc tế.</p></div>{groups.map(group=><div key={group.title}><h3>{group.title}</h3>{group.items.map(([label,href])=><Link href={href} key={href}>{label}</Link>)}</div>)}</div>
  <div className="a3-shell a3-footer__bottom"><span>© {new Date().getFullYear()} ATTD. All rights reserved.</span><span>Vietnam · B2B Apparel Sourcing</span></div>
</footer>}