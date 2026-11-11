import assert from "node:assert/strict";
import test from "node:test";

import {
  getRecordModuleShortcut,
  getRecordModuleShortcuts,
  isLinkedRecordType,
  recordModuleRoutes,
} from "./record-links";

test("V9 link registry resolves only existing admin list routes", () => {
  for (const [type, href] of Object.entries(recordModuleRoutes)) {
    assert.ok(href.startsWith("/admin/"));
    assert.ok(!href.includes("?"));
    assert.equal(getRecordModuleShortcut(type as keyof typeof recordModuleRoutes).href, href);
  }
});

test("invalid runtime record type cannot be accepted", () => {
  assert.equal(isLinkedRecordType("customer"), true);
  assert.equal(isLinkedRecordType("unknown"), false);
  assert.equal(isLinkedRecordType("__proto__"), false);
});

test("duplicate record shortcuts are removed without changing input order", () => {
  const shortcuts = getRecordModuleShortcuts(["order", "customer", "order", "invoice"]);
  assert.deepEqual(shortcuts.map((shortcut) => shortcut.type), ["order", "customer", "invoice"]);
});
