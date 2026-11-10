import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  authorizedDefaultOrderTab,
  visibleOrderWorkspaceTabs,
} from "./order-workspace.types";

describe("V9 Order Detail visible tab access", () => {
  it("does not expose production, finance or delivery tabs to a restricted viewer", () => {
    const tabs = visibleOrderWorkspaceTabs({
      canViewFinancials: false,
      canViewProduction: false,
      canViewDelivery: false,
    });
    const keys = tabs.map((tab) => tab.key);
    assert.ok(keys.includes("products"));
    assert.ok(keys.includes("info"));
    assert.equal(keys.includes("payment"), false);
    assert.equal(keys.includes("qc"), false);
    assert.equal(keys.includes("delivery"), false);
    assert.equal(authorizedDefaultOrderTab("DELIVERY", tabs), "products");
  });

  it("gives delivery staff a delivery default without exposing finance and QC", () => {
    const tabs = visibleOrderWorkspaceTabs({
      canViewFinancials: false,
      canViewProduction: false,
      canViewDelivery: true,
    });
    const keys = tabs.map((tab) => tab.key);
    assert.equal(authorizedDefaultOrderTab("DELIVERY", tabs), "delivery");
    assert.equal(keys.includes("payment"), false);
    assert.equal(keys.includes("qc"), false);
    assert.ok(keys.includes("delivery"));
  });

  it("supports independent production and financial permissions", () => {
    const production = visibleOrderWorkspaceTabs({
      canViewFinancials: false,
      canViewProduction: true,
      canViewDelivery: false,
    }).map((tab) => tab.key);
    assert.ok(production.includes("qc"));
    assert.equal(production.includes("payment"), false);
    assert.equal(production.includes("delivery"), false);

    const owner = visibleOrderWorkspaceTabs({
      canViewFinancials: true,
      canViewProduction: true,
      canViewDelivery: true,
    }).map((tab) => tab.key);
    assert.ok(owner.includes("payment"));
    assert.ok(owner.includes("qc"));
    assert.ok(owner.includes("delivery"));
  });
});
