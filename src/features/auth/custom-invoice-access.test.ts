import test from "node:test";
import assert from "node:assert/strict";
import { createAnonymousSession, createOwnerSession, grantsToPermissionMap } from "./admin-session.types";
import { can } from "./admin-permissions";
import { getRequiredPermissionForAdminRoute, isFinancialAdminRoute } from "./order-financial-permissions";

test("invoice route is protected by existing finance permission",()=>{
  assert.equal(isFinancialAdminRoute("/admin/documents/invoices"),true);
  assert.equal(getRequiredPermissionForAdminRoute("/admin/documents/invoices"),"orders.view_financials");
  assert.equal(getRequiredPermissionForAdminRoute("/admin/documents/invoices/new"),"orders.view_financials");
});
test("anonymous cannot create or view invoice",()=>{
  const s=createAnonymousSession();
  assert.equal(can(s,"orders.view_financials"),false);
  assert.equal(can(s,"quotes.create"),false);
  assert.equal(can(s,"payments.manage"),false);
});
test("owner has finance, creation, and payment rights",()=>{
  const s=createOwnerSession();
  assert.equal(can(s,"orders.view_financials"),true);
  assert.equal(can(s,"quotes.create"),true);
  assert.equal(can(s,"payments.manage"),true);
});
test("RBAC finance viewer cannot issue an invoice",()=>{
  const s={...createOwnerSession(),mode:"user" as const,permissions:grantsToPermissionMap([["orders.view_financials","ALL"]])};
  assert.equal(can(s,"orders.view_financials"),true);
  assert.equal(can(s,"quotes.create"),false);
  assert.equal(can(s,"payments.manage"),false);
});
