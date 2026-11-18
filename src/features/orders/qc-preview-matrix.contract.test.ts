import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("QC Preview role matrix harness security contract", () => {
  const source = readFileSync("scripts/qc-v9-readonly-role-matrix.ts", "utf8");
  it("only exercises GET on explicit preview, never writes production data", () => {
    for (const fragment of ['.endsWith(".vercel.app")', 'base.hostname !== expectedHost', 'context.get(', 'maxRedirects: 0', 'failOnStatusCode: false']) {
      assert.ok(source.includes(fragment), "Missing safeguard: " + fragment);
    }
    for (const forbidden of ["context.post(", "context.patch(", "context.delete(", "context.put(", "context.fetch("]) {
      assert.ok(!source.includes(forbidden), "Unsafe request method " + forbidden);
    }
  });
  it("does not include protected data in output and requires private sessions for all roles", () => {
    for (const fragment of ['Owner', 'Sales', 'Production', 'Delivery', 'Anonymous', 'safePrivateFile(', 'results.push({ case: c.id', 'response.dispose()']) {
      assert.ok(source.includes(fragment), "Missing scope: " + fragment);
    }
    assert.ok(!source.includes('results.push({ orderId:'));
  });
});
