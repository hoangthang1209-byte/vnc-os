/**
 * Run: npx tsx scripts/admin-v9-qa-ledger.ts > /private/v9-qa-ledger.csv
 * This is only a blank 44-view acceptance template, not a QA certification.
 * Add screenshot references outside the repo; never commit authenticated captures.
 */
import { makeV9QaLedger } from "../src/lib/admin/admin-v9-qa-ledger";

const records = makeV9QaLedger();
const columns = ["viewId", "domain", "title", "candidateRoute", "role", "viewport",
  "expectedAccess", "actualAccess", "visual", "functional", "screenshotEvidence", "testedBy", "note"] as const;

function csvCell(s: string): string {
  return '"' + s.replace(/"/g, '""') + '"';
}

process.stdout.write(columns.join(",") + "\n");
for (const record of records) {
  process.stdout.write(columns.map(key => csvCell(record[key])).join(",") + "\n");
}
