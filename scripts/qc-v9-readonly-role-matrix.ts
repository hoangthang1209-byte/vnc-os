/**
 * Read-only QC authorization smoke for an isolated Vercel Preview environment.
 *
 * Operator supplies a PRIVATE JSON manifest with 5 role storage-state files and
 * expected responses for real, disposable order fixtures. No secrets in Git.
 *
 * V9_QC_PREVIEW_URL=https://<preview-host>.vercel.app
 * V9_QC_PREVIEW_HOST=<preview-host>.vercel.app
 * V9_QC_MATRIX_FILE=/private/qc-matrix.json
 * npx tsx scripts/qc-v9-readonly-role-matrix.ts
 *
 * This tests GET only; 200/401/403/404 outcomes are recorded as observed,
 * never inferred. Writes, evidence mutations, and UI acceptance still require
 * separate supervised QA. Do NOT use this against production.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { request } from "playwright";

type Role = "Owner" | "Sales" | "Production" | "Delivery" | "Anonymous";
type MatrixCase = {
  id: string;
  role: Role;
  scenario: "allowed" | "not-authenticated" | "denied" | "outside-order-scope";
  orderId: string;
  expectedStatus: 200 | 401 | 403 | 404;
};
type Matrix = {
  storageStates: Partial<Record<Exclude<Role, "Anonymous">, string>>;
  cases: MatrixCase[];
};

const roles: Role[] = ["Owner", "Sales", "Production", "Delivery", "Anonymous"];
const allowedStatuses = [200, 401, 403, 404];

async function main() {
  const url = process.env.V9_QC_PREVIEW_URL;
  const expectedHost = process.env.V9_QC_PREVIEW_HOST;
  const manifestPath = process.env.V9_QC_MATRIX_FILE;
  if (!url || !expectedHost || !manifestPath) throw new Error("Preview URL, explicit host and private matrix file are required");

  const base = new URL(url);
  if (base.protocol !== "https:" || base.hostname !== expectedHost || !base.hostname.endsWith(".vercel.app") || base.pathname !== "/" || base.search || base.hash) {
    throw new Error("Use an explicitly trusted HTTPS Vercel Preview host; production and arbitrary hosts are prohibited");
  }
  const repo = resolve(process.cwd());
  const safePrivateFile = (path: string) => {
    const absolute = resolve(path);
    if (absolute === repo || absolute.startsWith(repo + "/")) throw new Error("Private QA credentials and fixtures cannot be stored inside the repository");
    if (!existsSync(absolute)) throw new Error("Missing private QA input file");
    return absolute;
  };
  const manifest = JSON.parse(readFileSync(safePrivateFile(manifestPath), "utf8")) as Matrix;
  if (!Array.isArray(manifest.cases) || !manifest.cases.length || !manifest.storageStates) throw new Error("Missing QC role matrix cases and session map");
  if (new Set(manifest.cases.map(c => c.id)).size !== manifest.cases.length) throw new Error("Case IDs must be unique");
  if (!roles.every(role => manifest.cases.some(c => c.role === role))) throw new Error("Include all five roles, including Anonymous");
  for (const item of manifest.cases) {
    if (!roles.includes(item.role) || !item.id || !item.orderId || !allowedStatuses.includes(item.expectedStatus)) {
      throw new Error("Invalid case: required role, ID, disposable order and explicit HTTP status");
    }
    if (item.role === "Anonymous" && item.expectedStatus !== 401) throw new Error("Anonymous QC GET should be expected to return 401");
    if (item.role !== "Anonymous" && !manifest.storageStates[item.role]) throw new Error("Missing authorized role session state");
  }
  const results: { case: string; role: Role; scenario: string; expected: number; actual: number; pass: boolean }[] = [];
  for (const role of roles) {
    const roleCases = manifest.cases.filter(c => c.role === role);
    if (!roleCases.length) continue;
    const stateFile = role === "Anonymous" ? undefined : safePrivateFile(manifest.storageStates[role]!);
    const context = await request.newContext({
      baseURL: base.origin,
      ...(stateFile ? { storageState: stateFile } : {}),
      extraHTTPHeaders: { accept: "application/json" },
      ignoreHTTPSErrors: false,
    });
    try {
      for (const c of roleCases) {
        // Never issue writes, follow redirects, or log payloads / protected IDs.
        const response = await context.get("/api/orders/" + encodeURIComponent(c.orderId) + "/qc", {
          maxRedirects: 0, failOnStatusCode: false, timeout: 15000,
        });
        const actual = response.status();
        results.push({ case: c.id, role, scenario: c.scenario, expected: c.expectedStatus, actual, pass: actual === c.expectedStatus });
        await response.dispose();
      }
    } finally {
      await context.dispose();
    }
  }
  // Results intentionally exclude order IDs, cookies, response bodies, and storage paths.
  process.stdout.write(JSON.stringify({
    note: "Read-only GET smoke; does not certify evidence mutation permissions or 44-view acceptance",
    results,
    passed: results.filter(r => r.pass).length,
    total: results.length,
  }, null, 2) + "\n");
  if (results.some(r => !r.pass)) process.exitCode = 1;
}

void main().catch((error: unknown) => {
  // Avoid echoing possibly sensitive URL, file names or session details.
  process.stderr.write("QC smoke failed to initialize or execute. Check private operator inputs.\n");
  process.exitCode = 1;
});
