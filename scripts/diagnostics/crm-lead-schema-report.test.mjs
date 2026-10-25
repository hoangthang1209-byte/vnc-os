import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const diagnostic = readFileSync(new URL("./crm-lead-schema.mjs", import.meta.url), "utf8");
const sql = readFileSync(new URL("./lead-schema-verify.sql", import.meta.url), "utf8");

test("diagnostic uses read-only inspection and never executes migration/reset", () => {
  for (const content of [diagnostic, sql]) {
    assert.doesNotMatch(content, /\b(?:DROP|TRUNCATE|DELETE\s+FROM|ALTER\s+TABLE|UPDATE\s+["\w]|INSERT\s+INTO|migrate\s+reset|db\s+push)\b/i);
  }
  assert.match(diagnostic, /information_schema\.columns/);
  assert.match(sql, /_prisma_migrations/);
});
