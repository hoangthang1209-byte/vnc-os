import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const load = (path: string) => readFileSync(path, "utf8");
const shell = load("src/components/admin/orders/workspace/OrderWorkspaceShell.tsx");
const strip = load("src/components/admin/orders/workspace/OrderCommandStrip.tsx");
const itemForm = load("src/components/admin/orders/OrderItemFormRow.tsx");

describe("VNC OS V9 lean order information architecture", () => {
  it("prioritizes the product table before secondary connected records", () => {
    assert.match(shell, /<OrderCommandStrip/);
    assert.match(shell, /activeTab === "products"/);
    assert.match(shell, /<OrderProductTable/);
    assert.match(shell, /activeTab === "info"/);
    assert.match(shell, /<V9OrderOverview/);
    assert.match(shell, /<OrderExecutionControl/);
    assert.match(shell, /<OrderWorkspaceLowerSections/);
    assert.ok(shell.indexOf("<OrderProductTable") < shell.indexOf("<V9OrderOverview"));
    assert.doesNotMatch(shell, /<OrderWorkspaceSummaryCards/);
  });

  it("leaves essential size matrix visible and hides only optional line fields", () => {
    assert.match(itemForm, /<details className=\{styles\.itemMediaToggle\}>/);
    assert.match(itemForm, /<MediaPicker/);
    assert.match(itemForm, /<OrderAdvancedSection title="Thông số và phân loại/);
    assert.match(itemForm, /<OrderItemVariantMatrixEditor/);
    assert.ok(itemForm.lastIndexOf("</OrderAdvancedSection>") < itemForm.indexOf("<OrderItemVariantMatrixEditor"));
    assert.match(itemForm, /item\.quantity/);
    assert.match(itemForm, /item\.unitPrice/);
  });

  it("keeps KPI values limited to essentials and distinct from financial tab", () => {
    assert.match(strip, /TOTAL QTY/);
    assert.match(strip, /SIZE PENDING/);
    assert.match(strip, /STYLES/);
    assert.doesNotMatch(strip, /label: "ORDER VALUE"/);
  });
});
