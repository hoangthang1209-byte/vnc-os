import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const file = (name: string) => readFileSync(name, "utf8");
const table = file("src/components/admin/orders/workspace/OrderProductTable.tsx");
const editor = file("src/components/admin/orders/workspace/OrderSkuEditor.tsx");
const api = file("src/app/api/orders/[id]/items/[itemId]/route.ts");
const shell = file("src/components/admin/orders/workspace/OrderWorkspaceShell.tsx");
const parent = file("src/components/admin/orders/OrderDetailView.tsx");

describe("Order V9 market selection & SKU editor", () => {
  it("selects multiple markets and aggregates style and size only from the selected rows", () => {
    assert.match(table, /selectedMarkets/);
    assert.match(table, /type="checkbox"/);
    assert.match(table, /toggleMarket\(code\)/);
    assert.match(table, /rows\.reduce\(\(sum, item\) => sum \+ item\.quantity/);
    assert.match(table, /sumSizes\(items, size\)/);
    assert.match(table, /getMarket\(item\)/);
    assert.match(table, /setSelectedMarkets\(\[\.\.\.availableMarkets\]\)/);
  });
  it("exposes authorized editor actions both for style and individual SKU", () => {
    assert.match(table, /canEditOrder && <button/);
    assert.match(table, /level: "style"/);
    assert.match(table, /level: "sku"/);
    assert.match(editor, /<MediaPicker/);
    assert.match(editor, /applyToStyle: true/);
    assert.match(editor, /applyToStyle: false/);
    assert.match(editor, /onSaved\(\)/);
    assert.match(shell, /onRefreshOrder=\{onRefreshOrder\}/);
    assert.match(parent, /onRefreshOrder=\{load\}/);
  });
  it("keeps quantity and SKU IDs immutable in inline patch and enforces permissions", () => {
    assert.match(api, /requireAdminPermission/);
    assert.match(api, /canAccessOrderRecord/);
    assert.match(api, /can\(session, "orders.update"\)/);
    assert.match(api, /orderId: id, id: \{ in: targetIds \}/);
    assert.match(api, /allowed: Field\[\]/);
    assert.doesNotMatch(api, /"quantity"\s*\|/);
    assert.doesNotMatch(api, /"skuSnapshot"\s*\|/);
  });
});
