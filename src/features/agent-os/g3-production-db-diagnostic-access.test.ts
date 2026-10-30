import assert from "node:assert/strict";
import { test } from "node:test";
import { diagnosticAccessStatus } from "./g3-production-db-diagnostic-access";
import type { AdminSessionMode, AdminSessionUser } from "@/features/auth/admin-session.types";

function session(authenticated: boolean, mode: AdminSessionMode): AdminSessionUser {
  return {
    authenticated, mode, userId: null, username: null, employeeId: null,
    roleId: null, roleCode: null, legacyEmployeeRole: null, permissions: new Map(),
  };
}

test("unauthenticated session denied 401, even outside production", () => {
  assert.equal(diagnosticAccessStatus(session(false, "owner"), "production"), 401);
  assert.equal(diagnosticAccessStatus(session(false, "owner"), undefined), 401);
});

test("authenticated non-owner denied 403 in production", () => {
  assert.equal(diagnosticAccessStatus(session(true, "legacy"), "production"), 403);
  assert.equal(diagnosticAccessStatus(session(true, "user"), "production"), 403);
});

test("owner blocked outside production, permitted only in production", () => {
  assert.equal(diagnosticAccessStatus(session(true, "owner"), "preview"), 404);
  assert.equal(diagnosticAccessStatus(session(true, "owner"), undefined), 404);
  assert.equal(diagnosticAccessStatus(session(true, "owner"), "production"), null);
});
