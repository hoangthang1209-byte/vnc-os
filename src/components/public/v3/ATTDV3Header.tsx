"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";

const navigation = [
  { href: "/nguon-hang-ao-tron", label: "Áo trơn sỉ" },
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/dong-phuc-doanh-nghiep", label: "Đồng phục" },
  { href: "/oem", label: "OEM / ODM" },
  { href: "/nguon-hang", label: "Nguồn hàng B2B" },
  { href: "/gioi-thieu", label: "Về ATTD" },
];
export default function ATTDV3Header() {
  const pathname = usePathname();
  const [open,setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => { if(e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown",close);
    return () => window.removeEventListener("keydown",close);
  },[open]);
  return <header className="a3-header">
    <div className="a3-shell a3-header__bar">
      <Link href="/" className="a3-header__brand" aria-label="ATTD — trang chủ">ATTD<span>.</span><small>APPAREL SOURCING</small></Link>
      <nav className="a3-header__nav" aria-label="Điều hướng chính">{navigation.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>)}</nav>
      <div className="a3-header__right">
        <div className="a3-header__lang" aria-label="Language / Ngôn ngữ"><Link href="/" lang="vi" hrefLang="vi" aria-current={pathname !== "/en" ? "page" : undefined}>VN</Link><span>/</span><Link href="/en" lang="en" hrefLang="en" aria-current={pathname === "/en" ? "page" : undefined}>EN</Link></div>
        <Link href="/lien-he" className="a3-header__cta">Nhận báo giá <ArrowUpRight size={16}/></Link>
        <button type="button" className="a3-header__toggle" aria-controls="a3-mobile-navigation" aria-expanded={open} aria-label={open ? "Đóng menu" : "Mở menu"} onClick={() => setOpen(!open)}>{open?<X size={24}/>:<Menu size={24}/>}</button>
      </div>
    </div>
    {open && <nav id="a3-mobile-navigation" className="a3-header__mobile" aria-label="Menu mobile">
      {navigation.map(item=><Link key={item.href} href={item.href} onClick={()=>setOpen(false)}>{item.label}<ArrowUpRight size={17}/></Link>)}
      <Link href="/en" onClick={()=>setOpen(false)}>English / EN <ArrowUpRight size={17}/></Link>
      <Link href="/lien-he" className="a3-header__mobile-cta" onClick={()=>setOpen(false)}>Yêu cầu báo giá <ArrowUpRight size={17}/></Link>
    </nav>}
  </header>;
}
