import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

describe("VNC OS V9 Order size matrix and demo factory Gantt", () => {
  const table = read("src/components/admin/orders/workspace/OrderProductTable.tsx");
  const sheet = read("src/components/admin/orders/workspace/OrderWorkspaceShell.tsx");
  const gantt = read("src/components/admin/operations-v9/IntegratedProductionWorkspace.tsx");
  const page = read("src/app/(backend)/admin/operations-v9/page.tsx");

  it("renders actual size quantities as columns, not compact badges", () => {
    assert.match(table, /SIZE_KEYS\.slice\(0, 5\)/);
    assert.match(table, /UNALLOC\./);
    assert.match(table, /<th className=\{styles\.numeric\}>FREE<\/th>/);
    assert.match(table, /current\.sizes\.get\(size\)/);
    assert.match(table, /matrix\(item\)/);
    assert.doesNotMatch(table, /compactSizeSummary/);
    assert.match(table, /"style"\)/);
    assert.match(table, /getMarket\(item\)/);
  });

  it("uses compact header and prioritizes full-width table", () => {
    assert.match(sheet, /<OrderCommandStrip/);
    assert.match(sheet, /style=\{\{display:"block",minWidth:0\}\}/);
    assert.match(sheet, /<details className=\{styles\.productionDisclosure\}>/);
  });

  it("keeps demo assignments distinct from actual production and exposes calendar navigation", () => {
    assert.match(page, /demo: Boolean\(t\.note\?\.startsWith\("DEMO ONLY"\)\)/);
    assert.match(gantt, /Planning type/);
    assert.match(gantt, /90 ngày/);
    assert.match(gantt, /120 ngày/);
    assert.match(gantt, /setTimeOffset/);
    assert.match(gantt, /factoryFilter/);
    assert.match(gantt, /\/admin\/production\/jobs\//);
  });
});
