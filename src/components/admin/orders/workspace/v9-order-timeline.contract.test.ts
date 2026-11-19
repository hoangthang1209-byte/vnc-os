import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("V9 Order Timeline authorization affordances", () => {
  const source = readFileSync("src/components/admin/orders/workspace/V9OrderOverview.tsx", "utf8");
  const css = readFileSync("src/components/admin/orders/workspace/V9OrderOverview.module.css", "utf8");

  it("keeps delivery milestones factual but not clickable without delivery permission", () => {
    assert.ok(source.includes("requiresDelivery?:boolean"));
    assert.ok(source.includes('label:"Sẵn sàng giao",requiresDelivery:true'));
    assert.ok(source.includes('label:"Đã gửi hàng",requiresDelivery:true'));
    assert.ok(source.includes("step.requiresDelivery && !canViewDelivery"));
    assert.ok(source.includes("<div key={step.label}"));
    assert.ok(css.includes(".steps button,.steps>div"));
  });

  it("offers production timeline only to production-authorized roles", () => {
    assert.ok(source.includes('canViewProduction&&<Link href={`/admin/manufacturing/production-timeline?order=${encodeURIComponent(order.id)}`}'));
    assert.ok(source.includes('encodeURIComponent(order.id)'), "timeline must be scoped to the selected order");
    assert.ok(source.includes('onNavigateTab("qc")'));
  });
});
