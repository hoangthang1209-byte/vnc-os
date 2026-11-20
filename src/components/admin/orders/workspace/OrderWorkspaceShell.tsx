"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { useAdminPermissions } from "@/components/admin/AdminPermissionsContext";
import type { DeliveryCarrierRecord } from "@/features/delivery/delivery-carrier.service";
import type { DeliveryMethodRecord } from "@/features/delivery/delivery-method.service";
import type { EmployeeRecord } from "@/features/employees/employee.service";
import type { OrderDetailRecord } from "@/features/orders/order.types";
import OrderWorkspaceHeader from "./OrderWorkspaceHeader";
import OrderDocumentActions from "@/components/admin/orders/OrderDocumentActions";
import OrderExecutionControl from "./OrderExecutionControl";
import V9OrderOverview from "./V9OrderOverview";
import OrderCommandStrip from "./OrderCommandStrip";
import styles from "./OrderWorkspaceV9.module.css";
import OrderBatchAssignment from "./OrderBatchAssignment";
import OrderProductTable from "./OrderProductTable";
import OrderProductionSummaryPanel from "./OrderProductionSummaryPanel";
import OrderItemProductionPanel from "@/components/admin/item-production/OrderItemProductionPanel";
import OrderWorkspaceInfoTab from "./OrderWorkspaceInfoTab";
import OrderWorkspaceDeliveryTab from "./OrderWorkspaceDeliveryTab";
import OrderWorkspacePaymentTab from "./OrderWorkspacePaymentTab";
import OrderCommercialCostStrip from "./OrderCommercialCostStrip";
import OrderWorkspaceActivityTab from "./OrderWorkspaceActivityTab";
import OrderWorkspaceNotesTab from "./OrderWorkspaceNotesTab";
import OrderWorkspaceLowerSections from "./OrderWorkspaceLowerSections";
import { useOrderWorkspaceData } from "./useOrderWorkspaceData";
import {
  visibleOrderWorkspaceTabs,
  authorizedDefaultOrderTab,
  orderWorkspaceTabStorageKey,
  type OrderWorkspaceTab,
} from "./order-workspace.types";

type ProductionFields = {
  productionOwnerId: string;
  productionDueDate: string;
  productionNote: string;
};

type DeliveryFields = {
  deliveryMethodId: string;
  deliveryOwnerId: string;
  deliveryCarrierId: string;
  deliveryTrackingCode: string;
  deliveryRecipientName: string;
  deliveryRecipientPhone: string;
  deliveryAddress: string;
  deliveryExpectedAt: string;
  deliveryNote: string;
};

export type OrderWorkspaceShellProps = {
  orderId: string;
  order: OrderDetailRecord;
  listBackHref: string;
  busy: boolean;
  canEditOrder: boolean;
  onRefreshOrder: () => Promise<void>;
  canRecordPayment: boolean;
  showDeliveryForm: boolean;
  transitions: OrderStatus[];
  correctionTargets: OrderStatus[];
  productionFields: ProductionFields;
  deliveryFields: DeliveryFields;
  productionEmployees: EmployeeRecord[];
  employees: EmployeeRecord[];
  deliveryMethods: DeliveryMethodRecord[];
  carriers: DeliveryCarrierRecord[];
  deliveryRefreshKey: number;
  onProductionFieldsChange: (fields: ProductionFields) => void;
  onProductionEmployeesChange: (employees: EmployeeRecord[]) => void;
  onDeliveryFieldsChange: (fields: DeliveryFields) => void;
  onCarriersChange: (carriers: DeliveryCarrierRecord[]) => void;
  onSaveProduction: (e: React.FormEvent) => void;
  onSaveDelivery: (e: React.FormEvent) => void;
  onProductionEmployeeCreated: (employee: EmployeeRecord) => void;
  onCarrierCreated: (carrier: DeliveryCarrierRecord) => void;
  onDeliveryRefresh: () => void;
  onRequestStatusChange: (status: OrderStatus) => void;
  onOpenCancel: () => void;
  onOpenCorrection: (status: OrderStatus) => void;
  onOpenRecordPayment: () => void;
  onOpenEditPayment: (paymentId: string) => void;
  onOpenVoidPayment: (paymentId: string) => void;
};

export default function OrderWorkspaceShell(props: OrderWorkspaceShellProps) {
  const { permissions, roleCode, loading: permissionsLoading } = useAdminPermissions();
  const canViewFinancials = permissions.canViewFinancials;
  const canViewProduction = permissions.canViewProduction;
  const canViewDelivery = permissions.canViewDelivery;

  const {
    orderId,
    order,
    busy,
    canEditOrder,
    onRefreshOrder,
    canRecordPayment,
    showDeliveryForm,
    transitions,
    correctionTargets,
    productionFields,
    deliveryFields,
    productionEmployees,
    employees,
    deliveryMethods,
    carriers,
    deliveryRefreshKey,
    onProductionFieldsChange,
    onProductionEmployeesChange,
    onDeliveryFieldsChange,
    onCarriersChange,
    onSaveProduction,
    onSaveDelivery,
    onProductionEmployeeCreated,
    onCarrierCreated,
    onDeliveryRefresh,
    onRequestStatusChange,
    onOpenCancel,
    onOpenCorrection,
    onOpenRecordPayment,
    onOpenEditPayment,
    onOpenVoidPayment,
  } = props;

  const workspaceData = useOrderWorkspaceData(orderId);
  const tabStorageKey = orderWorkspaceTabStorageKey(orderId);

  const visibleTabs = useMemo(
    () => visibleOrderWorkspaceTabs({ canViewFinancials, canViewProduction, canViewDelivery }),
    [canViewFinancials, canViewProduction, canViewDelivery],
  );

  const [activeTab, setActiveTab] = useState<OrderWorkspaceTab>(
    () => authorizedDefaultOrderTab(roleCode, visibleTabs),
  );

  useEffect(() => {
    let nextTab = authorizedDefaultOrderTab(roleCode, visibleTabs);
    try {
      const stored = sessionStorage.getItem(tabStorageKey) as OrderWorkspaceTab | null;
      if (stored && visibleTabs.some((t) => t.key === stored)) {
        nextTab = stored;
      }
    } catch {
      /* ignore */
    }
    // Defer React state update to avoid synchronous render cascades in an effect.
    Promise.resolve().then(() => setActiveTab(nextTab));
  }, [orderId, roleCode, tabStorageKey, visibleTabs]);

  const navigateTab = useCallback(
    (tab: OrderWorkspaceTab) => {
      if (!visibleTabs.some((t) => t.key === tab)) return;
      setActiveTab(tab);
      try {
        sessionStorage.setItem(tabStorageKey, tab);
      } catch {
        /* ignore */
      }
    },
    [tabStorageKey, visibleTabs],
  );

  if (permissionsLoading) return <div role="status" className="admin-panel">Đang kiểm tra quyền xem đơn hàng…</div>;

  return (
    <div className={`order-workspace ${styles.root}`} data-testid="v9-order-detail-workspace">
      <nav className={`order-workspace-breadcrumb ${styles.breadcrumb}`} aria-label="Breadcrumb">
        <Link href="/admin/orders">Đơn hàng</Link>
        <span aria-hidden>›</span>
        <span>Chi tiết đơn hàng</span>
        <span aria-hidden>›</span>
        <span>{order.orderNo}</span>
      </nav>

      <OrderWorkspaceHeader
        order={order}
        bundle={workspaceData.bundle}
        canEditOrder={canEditOrder}
        canViewFinancials={canViewFinancials}
        busy={busy}
        transitions={transitions}
        correctionTargets={correctionTargets}
        onRequestStatusChange={onRequestStatusChange}
        onOpenCancel={onOpenCancel}
        onOpenCorrection={onOpenCorrection}
      />

      <OrderCommandStrip order={order} canViewFinancials={canViewFinancials} />
      {canViewProduction && /BB2|BIGBANG/i.test([order.orderNo, order.customerCompanyName ?? ""].join(" ")) && (
        <div style={{ marginBottom: 12 }}>
          <Link
            href={`/admin/production/preparation?orderNo=${encodeURIComponent(order.orderNo)}`}
            className="admin-btn admin-btn--secondary admin-btn--small"
          >
            BOM · Rập · Sơ đồ cắt · Nhãn KUL/JKT
          </Link>
          <span style={{ marginLeft: 8, fontSize: 11, color: "#8b5b23" }}>
            Chuẩn bị sản xuất · kiểm tra định mức trước khi phát hành
          </span>
        </div>
      )}

      <div className={`admin-crm-360-tabs order-workspace-tabs ${styles.tabs}`} role="tablist" aria-label="Order sections">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`admin-crm-360-tab${activeTab === tab.key ? " is-active" : ""}`}
            onClick={() => navigateTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={`order-workspace-tab-panel ${styles.panel}`}>
        {activeTab === "products" && (
          <div className="order-workspace-products-layout" style={{display:"block",minWidth:0}}>
            <OrderProductTable
              order={order}
              bundle={workspaceData.bundle}
              itemMaterials={workspaceData.itemMaterials}
              materialRows={workspaceData.materialRows}
              loading={workspaceData.loading}
              canViewProduction={canViewProduction}
              canEditOrder={canEditOrder}
              onRefreshOrder={onRefreshOrder}
              productionApprovals={workspaceData.productionApprovals}
            />
            <details className={styles.productionDisclosure}>
              <summary>Production readiness & control summary</summary>
              <OrderProductionSummaryPanel
                orderNo={order.orderNo}
                bundle={workspaceData.bundle}
                materialRows={workspaceData.materialRows}
                canViewProduction={canViewProduction}
                roleCode={roleCode}
              />
            </details>
          </div>
        )}

        {activeTab === "qc" && canViewProduction && (
          <div className="order-workspace-v9-quality">
            <h2>Sản xuất & kiểm tra chất lượng theo dòng hàng</h2>
            <p className="admin-field-hint">Công đoạn và QC từ Order Core/Production API; không suy diễn sản lượng từ trạng thái đơn.</p>
            <OrderItemProductionPanel orderId={orderId} orderStatus={order.status} />
          </div>
        )}

        {activeTab === "documents" && (
          <div className="order-workspace-v9-documents">
            <h2>Chứng từ và tài liệu</h2>
            <p className="admin-field-hint">Vui lòng xác minh mã đơn trên chứng từ. Các liên kết mở module thật, không khẳng định chứng từ đã được gắn với đơn.</p>
            <div style={{display:"flex",gap:9,flexWrap:"wrap",paddingBlock:12}}>
              {canViewProduction && <Link className="admin-btn admin-btn--secondary" href={`/admin/production?search=${encodeURIComponent(order.orderNo)}`}>Tài liệu sản xuất</Link>}
              {canViewFinancials && <Link className="admin-btn admin-btn--secondary" href="/admin/documents/invoices">Invoice Center</Link>}
            </div>
            <OrderDocumentActions order={order} />
          </div>
        )}

        {activeTab === "info" && (
          <div className={styles.infoFlow}>
            <OrderBatchAssignment orderId={orderId} customerId={order.customerId} canEditOrder={canEditOrder} />
            <details className={styles.compactDetails}>
              <summary>Liên kết khách hàng, project và lộ trình</summary>
              <V9OrderOverview order={order} canViewFinancials={canViewFinancials}
                canViewCrm={permissions.canViewCrm} canViewProduction={canViewProduction}
                canViewDelivery={canViewDelivery} onNavigateTab={navigateTab} />
            </details>
            <details className={styles.compactDetails}>
              <summary>Checklist điều hành</summary>
              <OrderExecutionControl order={order} onNavigateTab={navigateTab} canViewFinancials={canViewFinancials} />
            </details>
            <details className={styles.compactDetails}>
              <summary>Tài liệu và thông tin bổ sung</summary>
              <OrderWorkspaceLowerSections order={order} orderId={orderId}
                productionFileCount={workspaceData.productionFileCount}
                canViewFinancials={canViewFinancials}
                roleCode={roleCode} onNavigateTab={navigateTab} />
            </details>
          </div>
        )}

        {activeTab === "info" && (
          <OrderWorkspaceInfoTab
            order={order}
            canViewFinancials={canViewFinancials}
            canEditOrder={canEditOrder}
            busy={busy}
            productionFields={productionFields}
            productionEmployees={productionEmployees}
            onProductionFieldsChange={onProductionFieldsChange}
            onProductionEmployeesChange={onProductionEmployeesChange}
            onSaveProduction={onSaveProduction}
            onProductionEmployeeCreated={onProductionEmployeeCreated}
          />
        )}

        {activeTab === "delivery" && canViewDelivery && (
          <OrderWorkspaceDeliveryTab
            orderId={orderId}
            order={order}
            showDeliveryForm={showDeliveryForm}
            canEditOrder={canEditOrder}
            busy={busy}
            deliveryFields={deliveryFields}
            deliveryMethods={deliveryMethods}
            employees={employees}
            carriers={carriers}
            deliveryRefreshKey={deliveryRefreshKey}
            onDeliveryFieldsChange={onDeliveryFieldsChange}
            onCarriersChange={onCarriersChange}
            onSaveDelivery={onSaveDelivery}
            onCarrierCreated={onCarrierCreated}
            onDeliveryRefresh={onDeliveryRefresh}
          />
        )}

        {activeTab === "payment" && canViewFinancials && (
          <div className={styles.infoFlow}>
            <OrderWorkspacePaymentTab
            order={order}
            canRecordPayment={canRecordPayment}
            busy={busy}
            onOpenRecordPayment={onOpenRecordPayment}
            onOpenEditPayment={onOpenEditPayment}
            onOpenVoidPayment={onOpenVoidPayment}
          />
            <details className={styles.compactDetails}>
              <summary>Chi phí, giá vốn và lãi gộp</summary>
              <OrderCommercialCostStrip order={order} canEditOrder={canEditOrder} />
            </details>
          </div>
        )}

        {activeTab === "activity" && <OrderWorkspaceActivityTab order={order} />}
        {activeTab === "notes" && (
          <OrderWorkspaceNotesTab order={order} canEditOrder={canEditOrder} />
        )}
      </div>

    </div>
  );
}
