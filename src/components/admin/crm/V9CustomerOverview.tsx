"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, FileText, Mail, Phone, Pencil, Plus, ShoppingBag } from "lucide-react";
import type { CrmCustomerRecord } from "@/features/crm/types";
import type { CustomerAccountOverview } from "@/features/crm/customer-account-overview.types";
import { formatOrderCurrency, formatOrderDate } from "@/features/orders/order-format";
import { formatQuoteCurrency, formatQuoteDate } from "@/features/quotes/format";
import OrderStatusBadge from "@/components/admin/orders/OrderStatusBadge";
import QuoteStatusBadge from "@/components/admin/quotes/QuoteStatusBadge";
import { CustomerMasterTypeBadge, CustomerStatusBadge } from "@/components/admin/crm/CustomerBadges";
import styles from "./V9CustomerOverview.module.css";

type Section = "orders" | "quotes" | "contacts" | "activity" | "documents";

export default function V9CustomerOverview({
  customer, overview, onEdit, onContact, onActivity,
}: {
  customer: CrmCustomerRecord;
  overview: CustomerAccountOverview;
  onEdit: () => void;
  onContact: () => void;
  onActivity: () => void;
}) {
  const [section, setSection] = useState<Section>("orders");
  const { capabilities, kpis } = overview;
  const initials = customer.name.trim().split(/\s+/).slice(0, 2).map((x) => x[0] || "").join("").toUpperCase();
  const primaryContact = customer.contacts?.find((item) => item.isPrimary) || customer.contacts?.[0];
  const panes: { key: Section; title: string; count: number | null }[] = [
    { key: "orders", title: "Đơn hàng", count: capabilities.includeOrders ? kpis.totalOrders : null },
    { key: "quotes", title: "Báo giá", count: capabilities.includeQuotes ? kpis.openQuotations : null },
    { key: "contacts", title: "Liên hệ", count: customer.contacts?.length ?? 0 },
    { key: "documents", title: "Tài liệu", count: null },
    { key: "activity", title: "Lịch sử hoạt động", count: customer.activities?.length ?? 0 },
  ].filter((p) => (p.key !== "orders" || capabilities.includeOrders) && (p.key !== "quotes" || capabilities.includeQuotes));

  return (
    <div className={styles.workspace} data-testid="v9-customer-360">
      <div className={styles.columns}>
        <section className={styles.panel} aria-label="Hồ sơ khách hàng">
          <div className={styles.panelTitle}>Hồ sơ khách hàng</div>
          <div className={styles.profileBody}>
            <div className={styles.identity}>
              <div className={styles.monogram} aria-hidden="true">{initials || "KH"}</div>
              <div className={styles.identityText}>
                <h2>{customer.name}</h2>
                <div className={styles.pills}><CustomerMasterTypeBadge label={customer.customerType?.name}/><CustomerStatusBadge status={customer.status}/></div>
              </div>
            </div>
            <dl className={styles.keyValues}>
              <dt>Mã khách hàng</dt><dd>{customer.code}</dd>
              <dt>Tên pháp lý</dt><dd>{customer.legalName || "Chưa cập nhật"}</dd>
              <dt>Thị trường / địa chỉ</dt><dd>{customer.provinceNameSnapshot || customer.province || customer.address || "Chưa cập nhật"}</dd>
              <dt>Người liên hệ chính</dt><dd>{primaryContact?.fullName || "Chưa có liên hệ"}</dd>
              <dt>Email</dt><dd>{customer.email ? <a href={`mailto:${customer.email}`}>{customer.email}</a> : "Chưa cập nhật"}</dd>
              <dt>Số điện thoại</dt><dd>{customer.phone ? <a href={`tel:${customer.phone}`}>{customer.phone}</a> : "Chưa cập nhật"}</dd>
              <dt>Mã số thuế</dt><dd>{customer.taxCode || "Chưa cập nhật"}</dd>
            </dl>
            <div className={styles.actions}>
              <button type="button" className={styles.secondary} onClick={onEdit}><Pencil size={14}/> Chỉnh sửa hồ sơ</button>
              {capabilities.canCreateQuote && <Link className={styles.primary} href={`/admin/quotes/new?customerId=${encodeURIComponent(customer.id)}`}><Plus size={14}/> Tạo báo giá</Link>}
            </div>
          </div>
        </section>
        <section className={styles.panel} aria-label="Customer health và liên hệ">
          <div className={styles.panelTitle}>Customer health & liên hệ</div>
          <div className={styles.profileBody}>
            <div className={styles.metrics}>
              {capabilities.includeOrders && <div className={styles.metric}><span>Đơn hàng</span><strong>{kpis.totalOrders.toLocaleString("vi-VN")}</strong><small>{kpis.activeOrders} đang hoạt động</small></div>}
              {capabilities.includeOrders && capabilities.includeFinancials && <div className={styles.metric}><span>Giá trị đơn hàng</span><strong>{formatOrderCurrency(kpis.totalOrderValue)}</strong><small>Lũy kế theo dữ liệu hệ thống</small></div>}
              {capabilities.includeQuotes && <div className={styles.metric}><span>Báo giá đang mở</span><strong>{kpis.openQuotations}</strong><small>Chờ xử lý thương mại</small></div>}
            </div>
            <div className={styles.activityPreview}>
              <h3>Hoạt động gần đây</h3>
              {(customer.activities ?? []).slice(0, 3).map((item, index) => (
                <div className={styles.event} key={index}>
                  <span className={styles.dot} aria-hidden="true"/>
                  <span>{item.type || "Hoạt động khách hàng"}</span>
                </div>
              ))}
              {!customer.activities?.length && <p className={styles.empty}>Chưa có hoạt động được ghi nhận.</p>}
            </div>
            <div className={styles.contactShortcuts}>
              {customer.email && <a href={`mailto:${customer.email}`} className={styles.secondary}><Mail size={14}/> Email</a>}
              {customer.phone && <a href={`tel:${customer.phone}`} className={styles.secondary}><Phone size={14}/> Gọi</a>}
              <button type="button" className={styles.secondary} onClick={onActivity}><Plus size={14}/> Ghi hoạt động</button>
            </div>
          </div>
        </section>
      </div>

      <section className={styles.panel} aria-label="Hoạt động thương mại và tài liệu">
        <div className={styles.panelTitle}>Hoạt động thương mại & tài liệu</div>
        <div className={styles.tabbar} role="tablist" aria-label="Hồ sơ thương mại">
          {panes.map((pane) => <button key={pane.key} type="button" role="tab" id={`v9-tab-${pane.key}`} aria-selected={section===pane.key}
            aria-controls="v9-customer-commercial-panel" className={section===pane.key?styles.activeTab:styles.tab}
            onClick={()=>setSection(pane.key)}>{pane.title}{pane.count != null ? ` (${pane.count})` : ""}</button>)}
        </div>
        <div className={styles.tableArea} role="tabpanel" id="v9-customer-commercial-panel" aria-labelledby={`v9-tab-${section}`}>
          {section==="orders" && (overview.orders.length ? <div className={styles.tableWrap}><table><thead><tr><th>Mã đơn</th><th>Ngày tạo</th><th>Giá trị</th><th>Trạng thái</th><th/></tr></thead><tbody>
            {overview.orders.map((o)=><tr key={o.id}><td><strong>{o.orderNo}</strong></td><td>{formatOrderDate(o.orderDate)}</td><td>{capabilities.includeFinancials?formatOrderCurrency(o.totalAmount):"—"}</td><td><OrderStatusBadge status={o.status}/></td><td><Link href={`/admin/orders/${o.id}`}>Mở đơn →</Link></td></tr>)}
          </tbody></table></div>:<div className={styles.empty}>Chưa có đơn hàng.</div>)}
          {section==="quotes" && (overview.openQuotes.length ? <div className={styles.tableWrap}><table><thead><tr><th>Mã báo giá</th><th>Ngày báo giá</th><th>Giá trị</th><th>Trạng thái</th><th/></tr></thead><tbody>
            {overview.openQuotes.map((q)=><tr key={q.id}><td><strong>{q.quoteNo}</strong></td><td>{formatQuoteDate(q.quoteDate)}</td><td>{capabilities.includeFinancials?formatQuoteCurrency(q.totalAmount):"—"}</td><td><QuoteStatusBadge status={q.status}/></td><td><Link href={`/admin/quotes/${q.id}`}>Mở báo giá →</Link></td></tr>)}
          </tbody></table></div>:<div className={styles.empty}>Chưa có báo giá đang mở.</div>)}
          {section==="contacts" && <div className={styles.contactsList}>
            {(customer.contacts??[]).map((c)=><div className={styles.contact} key={c.id}><Building2 size={17}/><div><strong>{c.fullName}</strong><small>{[c.title,c.department,c.email,c.phone].filter(Boolean).join(" · ")}</small></div>{c.isPrimary&&<span className={styles.tag}>Chính</span>}</div>)}
            {!customer.contacts?.length && <p className={styles.empty}>Chưa có người liên hệ.</p>}
            <button type="button" className={styles.secondary} onClick={onContact}><Plus size={14}/> Quản lý liên hệ</button>
          </div>}
          {section==="activity" && <div className={styles.contactsList}>{(customer.activities??[]).slice(0,12).map((item,i)=><div className={styles.contact} key={i}><span className={styles.dot}/><strong>{item.type||"Hoạt động"}</strong></div>)}{!customer.activities?.length&&<p className={styles.empty}>Chưa có lịch sử hoạt động.</p>}<button type="button" className={styles.secondary} onClick={onActivity}>Mở nhật ký & ghi hoạt động</button></div>}
          {section==="documents" && <div className={styles.documentEmpty}><FileText size={20}/><p>Tài liệu liên quan được quản lý trong Document Center. Chưa có bảng liên kết chứng từ riêng cho khách hàng này.</p><Link href="/admin/documents/invoices" className={styles.secondary}>Mở Invoice Center</Link></div>}
        </div>
        <div className={styles.footer}><ShoppingBag size={14}/><span>Dữ liệu từ CRM, báo giá và đơn hàng thực tế · Nội dung hiển thị theo phân quyền</span></div>
      </section>
    </div>
  );
}
